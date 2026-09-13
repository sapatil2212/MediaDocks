#!/usr/bin/env node
/**
 * Automatically prepares the Next.js standalone directory after `next build`.
 *
 * Next.js standalone output does not automatically copy `public` or `.next/static`
 * into `.next/standalone`. Without this step, static assets, logos, and CSS/JS chunks
 * are missing when running `node .next/standalone/server.js`.
 *
 * This script runs automatically via the npm `postbuild` lifecycle hook or directly.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const standaloneDir = path.join(rootDir, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");
const standaloneStaticDir = path.join(standaloneNextDir, "static");
const standalonePublicDir = path.join(standaloneDir, "public");

const sourceStaticDir = path.join(rootDir, ".next", "static");
const sourcePublicDir = path.join(rootDir, "public");

console.log("\n[postbuild] Preparing Next.js standalone production assets...");

if (!fs.existsSync(standaloneDir)) {
  console.warn(
    "[postbuild] .next/standalone directory does not exist. Ensure `output: 'standalone'` is set in next.config.ts."
  );
  process.exit(0);
}

// 1. Sync public -> .next/standalone/public (clean wipe to eliminate stale files)
if (fs.existsSync(sourcePublicDir)) {
  console.log("  → Synchronizing public/ to .next/standalone/public/ ...");
  if (fs.existsSync(standalonePublicDir)) {
    fs.rmSync(standalonePublicDir, { recursive: true, force: true });
  }
  fs.mkdirSync(standalonePublicDir, { recursive: true });
  fs.cpSync(sourcePublicDir, standalonePublicDir, { recursive: true, force: true });
} else {
  console.warn("  ⚠ public/ directory not found in root.");
}

// 2. Sync .next/static -> .next/standalone/.next/static (clean wipe to eliminate stale files)
if (fs.existsSync(sourceStaticDir)) {
  console.log("  → Synchronizing .next/static/ to .next/standalone/.next/static/ ...");
  if (fs.existsSync(standaloneStaticDir)) {
    fs.rmSync(standaloneStaticDir, { recursive: true, force: true });
  }
  fs.mkdirSync(standaloneStaticDir, { recursive: true });
  fs.cpSync(sourceStaticDir, standaloneStaticDir, { recursive: true, force: true });
} else {
  console.warn("  ⚠ .next/static/ directory not found in root.");
}

// 3. Verification of required assets
const requiredChecks = [
  { path: path.join(standaloneDir, "server.js"), label: "Standalone server.js" },
  { path: standaloneStaticDir, label: "Static chunks (.next/static)" },
  { path: path.join(standalonePublicDir, "logo", "logo-light.png"), label: "Logo light (public/logo/logo-light.png)" },
  { path: path.join(standalonePublicDir, "logo", "logo-dark.png"), label: "Logo dark (public/logo/logo-dark.png)" },
  { path: path.join(standalonePublicDir, "logo", "favicon.png"), label: "Favicon (public/logo/favicon.png)" },
];

let allPassed = true;
console.log("\n[postbuild] Verifying standalone structure:");
for (const check of requiredChecks) {
  const exists = fs.existsSync(check.path);
  console.log(`  ${exists ? "✓" : "✗"} ${check.label}`);
  if (!exists) allPassed = false;
}

if (!allPassed) {
  console.error("\n[postbuild] ERROR: Standalone preparation incomplete!");
  process.exit(1);
}

console.log("\n✓ Standalone build successfully prepared for production.\n");
