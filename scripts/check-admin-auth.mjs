#!/usr/bin/env node
/**
 * Diagnoses super-admin sign-in without revealing secrets.
 *
 *   npm run admin:check           report configuration + which source is used
 *   npm run admin:test-password  additionally test a password against every source
 *
 * (Two scripts rather than one flag because `npm run ... -- --password` silently
 * drops the flag on Windows.)
 *
 * Exists because a 401 is deliberately vague to the browser (it must not reveal
 * whether the email or the password was wrong). That vagueness is correct for
 * attackers and useless for operators, so the detail lives here instead.
 */
import crypto from "crypto";
import { PrismaClient } from "@prisma/client";

const SCRYPT_KEYLEN = 64;
const args = process.argv.slice(2);
const wantsPasswordTest = args.includes("--password");

function normalize(value) {
  // Mirrors lib/config.ts: tolerate stray quotes/whitespace from hand-edited .env
  return String(value ?? "")
    .trim()
    .replace(/^["'](.*)["']$/, "$1");
}

function verifyScrypt(password, stored) {
  const [scheme, salt, expected] = normalize(stored).split(":");
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
          process.exit(130);
        }
        if (char === "\u007f" || char === "\b") {
          if (value.length) {
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

const envEmail = normalize(process.env.SUPER_ADMIN_EMAIL).toLowerCase();
const envHash = normalize(process.env.SUPER_ADMIN_PASS_HASH);
const envPlain = normalize(process.env.SUPER_ADMIN_PASS);

const ok = (value) => (value ? "yes" : "no");

console.log("\n─── .env credentials ───────────────────────────────────────────");
console.log(`  SUPER_ADMIN_EMAIL      ${envEmail ? `set (${envEmail})` : "NOT SET"}`);
console.log(
  `  SUPER_ADMIN_PASS_HASH  ${envHash ? `set (${envHash.startsWith("scrypt:") ? "valid scrypt format" : "WRONG FORMAT — must be scrypt:<salt>:<hash>"})` : "not set"}`,
);
console.log(`  SUPER_ADMIN_PASS       ${envPlain ? `set (${envPlain.length} chars)` : "not set"}`);
if (envHash && envPlain) {
  console.log(
    `  hash matches plaintext ${ok(verifyScrypt(envPlain, envHash))}  ` +
      "(the hash wins when both are set)",
  );
}
const envUsable = Boolean(envEmail && (envHash || envPlain));
console.log(`  usable for login       ${ok(envUsable)}`);

console.log("\n─── database credentials ───────────────────────────────────────");
const prisma = new PrismaClient();
let dbRow = null;
let dbReachable = false;
let dbCount = 0;
try {
  dbCount = await prisma.superAdmin.count();
  dbReachable = true;
  if (envEmail) dbRow = await prisma.superAdmin.findUnique({ where: { email: envEmail } });
  console.log(`  reachable              yes (${dbCount} SuperAdmin row(s))`);
  console.log(`  row for .env email     ${ok(Boolean(dbRow))}`);
} catch (error) {
  console.log(`  reachable              NO (${error.code || error.name || "error"})`);
}

console.log("\n─── how a sign-in is resolved ──────────────────────────────────");
console.log("  • database credentials are checked independently");
console.log("  • .env credentials are checked independently");
console.log("  • a match in either source grants access; neither source masks the other");
if (!dbRow && !envUsable && dbCount === 0) {
  console.log("\n  ⚠ Nothing is configured. Run `npm run admin:create` or fill in .env.");
}

if (wantsPasswordTest) {
  let candidate;
  if (process.stdin.isTTY) {
    console.log("\nTesting a password against every source. Input is hidden.");
    candidate = (await askHidden("Password to test: ")).trim();
  } else {
    candidate = ((await readPipedLines())[0] ?? "").trim();
  }

  if (!candidate) {
    console.log("\nNo password entered; skipping the test.\n");
  } else {
    const dbAccepts = dbRow ? verifyScrypt(candidate, dbRow.passwordHash) : false;
    const envAccepts = envUsable
      ? envHash
        ? verifyScrypt(candidate, envHash)
        : candidate === envPlain
      : false;

    console.log("\n─── password test ──────────────────────────────────────────────");
    console.log(`  database row accepts it  ${dbRow ? ok(dbAccepts) : "n/a (no row)"}`);
    console.log(`  .env credentials accept  ${envUsable ? ok(envAccepts) : "n/a (not configured)"}`);

    if (dbAccepts || envAccepts) {
      console.log(
        `\n  ✓ This password WILL sign in (via ${dbAccepts ? "the database row" : ".env"}).`,
      );
      console.log("    If the browser still fails, the server is running stale env:");
      console.log("    restart it, and check you are on the port it printed.");
    } else {
      console.log("\n  ✗ This password will NOT sign in. No source accepts it.");
      console.log("    Fix with `npm run admin:create` (database) or set SUPER_ADMIN_PASS in .env.");
      console.log("    Either source is enough — neither one blocks the other.");
    }
  }
}

await prisma.$disconnect();
console.log("");
