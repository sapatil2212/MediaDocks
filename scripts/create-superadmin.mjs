#!/usr/bin/env node
/**
 * Creates (or resets) the super-admin credentials in the database.
 *
 *   npm run admin:create -- --generate
 *   npm run admin:create -- --email=admin@example.com
 *
 * The `SuperAdmin` table is one supported authentication source for
 * /superadmin. Environment credentials may also grant access; neither source
 * masks a valid credential in the other. This script writes a scrypt digest to
 * the database — never a reversible password — in the
 * `scrypt:<salt>:<hash>` format that lib/admin/auth.ts verifies.
 *
 * Password handling:
 *   --generate  creates a 24-character random password and writes it to
 *               superadmin-credentials.local (gitignored via *.local), because
 *               printing it to stdout would leave it in terminal scrollback and
 *               command logs. Move it into a password manager and delete the file.
 *   otherwise   the password is read from stdin with the echo suppressed.
 *
 * Flags:
 *   --generate         generate a strong random password instead of prompting
 *   --email=<address>  target address; defaults to SUPER_ADMIN_EMAIL
 */
import crypto from "crypto";
import fs from "fs/promises";
import path from "path";
import { PrismaClient } from "@prisma/client";

const SCRYPT_KEYLEN = 64;
const MIN_LENGTH = 12;
const GENERATED_LENGTH = 24;
const CREDENTIALS_FILE = "superadmin-credentials.local";

// Ambiguous characters (O/0, l/1/I) are excluded so the password can be typed
// back reliably from the file.
const ALPHABET = "abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_@#%+=";

const args = process.argv.slice(2);
const shouldGenerate = args.includes("--generate");
const emailArg = args.find((arg) => arg.startsWith("--email="));

function fail(message) {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function verifyScrypt(password, stored) {
  const [scheme, salt, expected] = String(stored ?? "").split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex")),
      Buffer.from(expected),
    );
  } catch {
    return false;
  }
}

/** Rejection sampling, so every character is drawn uniformly from the alphabet. */
function generatePassword(length = GENERATED_LENGTH) {
  const limit = 256 - (256 % ALPHABET.length);
  let out = "";
  while (out.length < length) {
    for (const byte of crypto.randomBytes(length)) {
      if (byte >= limit) continue;
      out += ALPHABET[byte % ALPHABET.length];
      if (out.length === length) break;
    }
  }
  return out;
}

function askHidden(question) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    process.stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");

    let value = "";
    const finish = () => {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.removeListener("data", onData);
      process.stdout.write("\n");
      resolve(value);
    };

    const onData = (chunk) => {
      for (const char of String(chunk)) {
        if (char === "\r" || char === "\n" || char === "\u0004") return finish();
        if (char === "\u0003") {
          stdin.setRawMode(false);
          process.stdout.write("\n");
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") {
          if (value.length > 0) {
            value = value.slice(0, -1);
            process.stdout.write("\b \b");
          }
          continue;
        }
        if (char >= " ") {
          value += char;
          process.stdout.write("*");
        }
      }
    };

    stdin.on("data", onData);
  });
}

async function readPipedLines() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").split(/\r?\n/);
}

/* ─────────────────────────────── resolve email ───────────────────────────── */

const email = (emailArg ? emailArg.slice("--email=".length) : process.env.SUPER_ADMIN_EMAIL || "")
  .trim()
  .toLowerCase();

if (!email) {
  fail("No email. Pass --email=you@example.com or set SUPER_ADMIN_EMAIL in .env.");
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  fail(`"${email}" is not a valid email address.`);
}

/* ───────────────────────────── resolve password ──────────────────────────── */

let password;

if (shouldGenerate) {
  password = generatePassword();
} else if (process.stdin.isTTY) {
  console.log(`\nSetting super-admin credentials for: ${email}`);
  console.log(`Minimum length: ${MIN_LENGTH} characters. Input is hidden.\n`);
  password = (await askHidden("Password: ")).trim();
  const confirm = (await askHidden("Confirm password: ")).trim();
  if (!password) fail("No password entered.");
  if (password !== confirm) fail("The two entries did not match. Nothing was changed.");
} else {
  const lines = await readPipedLines();
  password = (lines[0] ?? "").trim();
}

if (!password) fail("No password provided.");
if (password.length < MIN_LENGTH) {
  fail(
    `Refusing to store a ${password.length}-character password. ` +
      `Use at least ${MIN_LENGTH} characters: this is the only access control in the app.`,
  );
}

/* ──────────────────────────────── write to DB ────────────────────────────── */

const prisma = new PrismaClient();
let created = false;

try {
  const existing = await prisma.superAdmin.findUnique({ where: { email } });
  created = !existing;

  await prisma.superAdmin.upsert({
    where: { email },
    update: { passwordHash: hashPassword(password) },
    create: { email, passwordHash: hashPassword(password) },
  });

  // Read back and verify, so success is proven rather than assumed.
  const saved = await prisma.superAdmin.findUnique({ where: { email } });
  if (!saved || !verifyScrypt(password, saved.passwordHash)) {
    fail("The stored digest did not verify. The credentials were NOT set correctly.");
  }

  console.log(`\n✓ ${created ? "Created" : "Updated"} SuperAdmin row for ${email}`);
  console.log("✓ scrypt digest stored and verified against the database");
} catch (error) {
  fail(
    `Database write failed (${error.code || error.name || "unknown"}). ` +
      `${String(error.message).split("\n").slice(-1)[0].slice(0, 200)}`,
  );
} finally {
  await prisma.$disconnect();
}

/* ───────────────────────── hand the password back ────────────────────────── */

if (shouldGenerate) {
  const target = path.resolve(process.cwd(), CREDENTIALS_FILE);
  await fs.writeFile(
    target,
    [
      "MediaDocks super-admin credentials",
      `Generated: ${new Date().toISOString()}`,
      "",
      `URL:      /superadmin`,
      `Email:    ${email}`,
      `Password: ${password}`,
      "",
      "Stored in the database as a scrypt digest; this file is the only plaintext copy.",
      "Move it into a password manager and delete this file.",
      "",
    ].join("\n"),
    { encoding: "utf8", mode: 0o600 },
  );
  console.log(`✓ password written to ${CREDENTIALS_FILE} (gitignored)`);
  console.log("\n  Open that file, save the password somewhere safe, then delete it.");
}

console.log("\nSign in at /superadmin. Restart the server if it is running.\n");
