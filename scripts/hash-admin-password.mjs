#!/usr/bin/env node
/**
 * Generates the SUPER_ADMIN_PASS_HASH value.
 *
 *   npm run admin:hash -- "your-password"
 *
 * Storing the admin password in plaintext means anyone who can read .env — a
 * backup, a log, a screenshot, a leaked container image — has full access to the
 * report. A scrypt digest cannot be reversed, so a leaked .env no longer hands
 * over the password itself.
 *
 * Reads from argv, or from stdin when no argument is given so the password does
 * not end up in your shell history.
 */
import crypto from "crypto";
import readline from "readline";

const SCRYPT_KEYLEN = 64;

function hash(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function emit(password) {
  if (!password) {
    console.error("No password provided.");
    process.exit(1);
  }
  if (password.length < 10) {
    console.error(
      `Refusing to hash a ${password.length}-character password. Use at least 10 characters.`,
    );
    process.exit(1);
  }

  console.log("\nAdd this to your .env (and delete SUPER_ADMIN_PASS):\n");
  console.log(`SUPER_ADMIN_PASS_HASH="${hash(password)}"\n`);
}

const fromArgv = process.argv[2];

if (fromArgv) {
  console.warn(
    "\nNote: passing the password as an argument leaves it in your shell history.\n" +
      "      Run `npm run admin:hash` with no argument to type it instead.",
  );
  emit(fromArgv);
} else {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  rl.question("Password: ", (answer) => {
    rl.close();
    emit(answer.trim());
  });
}
