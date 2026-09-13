#!/usr/bin/env node
/**
 * Database connectivity diagnostic.
 *
 *   npm run db:check
 *
 * Separates the three failure modes that all surface as "the database doesn't
 * work", because each has a completely different fix:
 *
 *   1. the host/port cannot be reached      -> firewall, wrong host, server down
 *   2. reachable but authentication refused -> IP not allow-listed, or bad
 *                                              user/password/grant
 *   3. authenticated but schema missing     -> needs `npx prisma db push`
 *
 * Prisma's own error for case 2 can be misleading: for an account it does not
 * recognise, MySQL performs a decoy authentication exchange, which Prisma may
 * report as "Unknown authentication plugin `sha256_password`". That is not a
 * plugin problem — it means the account was not accepted from this host.
 */
import net from "net";
import process from "process";

const url = process.env.DATABASE_URL;

if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env first.");
  process.exit(2);
}

let parsed;
try {
  parsed = new URL(url);
} catch {
  console.error(`DATABASE_URL is not a valid URL: ${url}`);
  process.exit(2);
}

const host = parsed.hostname;
const port = Number(parsed.port || 3306);
const database = parsed.pathname.replace(/^\//, "");
const user = decodeURIComponent(parsed.username);

console.log("── Target\n");
console.log(`   host     ${host}`);
console.log(`   port     ${port}`);
console.log(`   database ${database}`);
console.log(`   user     ${user}`);
console.log(`   password ${parsed.password ? "(set)" : "(EMPTY)"}`);

/* ── 1. Reachability ─────────────────────────────────────────────────────── */

function readGreeting(timeoutMs = 8000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const started = Date.now();
    let settled = false;
    const done = (result) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve({ ...result, ms: Date.now() - started });
    };

    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      socket.once("data", (buf) => {
        // Handshake v10: version string is null-terminated after 1 version byte.
        const end = buf.indexOf(0, 5);
        done({ ok: true, version: buf.subarray(5, end).toString("latin1") });
      });
      setTimeout(() => done({ ok: true, version: "(no greeting)" }), 2500);
    });
    socket.once("timeout", () => done({ ok: false, code: "ETIMEDOUT" }));
    socket.once("error", (err) => done({ ok: false, code: err.code ?? err.message }));
    socket.connect(port, host);
  });
}

console.log("\n── 1. Network reachability\n");
const reach = await readGreeting();

if (!reach.ok) {
  console.log(`   ✗ cannot reach ${host}:${port} — ${reach.code} after ${reach.ms} ms`);
  console.log(
    reach.code === "ETIMEDOUT"
      ? "\n     Packets are being dropped. The port is firewalled, or the host is wrong.\n" +
          "     Nothing in this app can fix that — it is network configuration."
      : reach.code === "ECONNREFUSED"
        ? "\n     The host answered but nothing is listening on that port.\n" +
            "     Check the MySQL service is running and bound to a public interface."
        : "\n     Check the hostname and your network connection.",
  );
  process.exit(1);
}

console.log(`   ✓ ${host}:${port} reachable in ${reach.ms} ms`);
console.log(`   ✓ MySQL responded: ${reach.version}`);

/* ── 2. Authentication ───────────────────────────────────────────────────── */

console.log("\n── 2. Authentication\n");

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient({ log: [] });

let publicIp = null;
async function whatIsMyIp() {
  if (publicIp !== null) return publicIp;
  for (const endpoint of ["https://api.ipify.org", "https://ifconfig.me/ip"]) {
    try {
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(6000) });
      if (res.ok) return (publicIp = (await res.text()).trim());
    } catch {
      /* try next */
    }
  }
  return (publicIp = "(could not determine)");
}

try {
  await prisma.$queryRawUnsafe("SELECT 1");
  console.log("   ✓ authenticated");
} catch (err) {
  const message = String(err?.message ?? err);
  const denied = /Access denied|Authentication failed|authentication plugin/i.test(message);

  console.log("   ✗ authentication refused");
  console.log(`     ${message.split("\n").find((l) => l.trim() && !l.startsWith("Invalid")) ?? message}`);

  if (denied) {
    const ip = await whatIsMyIp();
    console.log("\n     This machine's public IP is: " + ip);
    console.log(
      "\n     The server is reachable and MySQL answered, so this is a permissions\n" +
        "     problem rather than a network one. Check, in order:\n" +
        `       1. Is ${ip} allow-listed for remote MySQL access?\n` +
        "          On cPanel this is Databases > Remote MySQL. A residential IP\n" +
        "          rotates, so it may need re-adding — and the IP of the machine you\n" +
        "          deploy to will be different again.\n" +
        `       2. Does the account exist for this host?\n` +
        `          CREATE USER '${user}'@'${ip}' IDENTIFIED BY '<password>';\n` +
        `       3. Is it granted on the database?\n` +
        `          GRANT ALL PRIVILEGES ON \`${database}\`.* TO '${user}'@'${ip}';\n` +
        "          FLUSH PRIVILEGES;\n" +
        "       4. Is the password correct, with special characters percent-encoded\n" +
        "          in the URL (@ becomes %40, # becomes %23, / becomes %2F)?",
    );

    // cPanel prefixes both usernames and database names with the account name.
    // A prefixed user beside an unprefixed database is a very common mismatch.
    const prefix = /^([a-z0-9]+)_/i.exec(user)?.[1];
    if (prefix && !database.startsWith(`${prefix}_`)) {
      console.log(
        `\n     Also worth checking: the user "${user}" is prefixed "${prefix}_",\n` +
          `     which is how cPanel names accounts. Database names get the same\n` +
          `     prefix, so the real name may be "${prefix}_${database}" rather than\n` +
          `     "${database}". That surfaces as "Unknown database" once the\n` +
          `     credentials themselves are accepted.`,
      );
    }
  }
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
}

/* ── 3. Schema ───────────────────────────────────────────────────────────── */

console.log("\n── 3. Server details\n");
for (const [label, sql] of [
  ["version", "SELECT VERSION() AS v"],
  ["database", "SELECT DATABASE() AS v"],
  ["effective user", "SELECT CURRENT_USER() AS v"],
  ["charset", "SELECT @@character_set_database AS v"],
  ["collation", "SELECT @@collation_database AS v"],
]) {
  try {
    const rows = await prisma.$queryRawUnsafe(sql);
    console.log(`   ${label.padEnd(16)} ${String(Object.values(rows[0])[0])}`);
  } catch {
    console.log(`   ${label.padEnd(16)} (unavailable)`);
  }
}

console.log("\n── 4. Schema\n");

const OURS = ["MediaRequest", "AnalyticsEvent", "SuperAdmin"];
const tables = await prisma.$queryRawUnsafe(
  `SELECT TABLE_NAME AS name, TABLE_ROWS AS approx_rows
     FROM information_schema.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
    ORDER BY TABLE_NAME`,
);

if (tables.length === 0) {
  console.log("   the database is empty");
} else {
  for (const t of tables) {
    const mine = OURS.includes(t.name);
    console.log(
      `   ${mine ? "•" : "·"} ${String(t.name).padEnd(30)} ~${String(t.approx_rows ?? 0).padStart(8)} rows${mine ? "  (MediaDocks)" : ""}`,
    );
  }
}

const present = OURS.filter((name) => tables.some((t) => t.name === name));
const missing = OURS.filter((name) => !present.includes(name));
const foreign = tables.filter((t) => !OURS.includes(t.name));

console.log("");
if (missing.length === 0) {
  console.log("   ✓ all MediaDocks tables exist");
} else {
  console.log(`   ✗ missing table(s): ${missing.join(", ")}`);
  console.log(
    foreign.length > 0
      ? "\n     This database also holds tables that are not MediaFlow's, so create the\n" +
          "     missing ones explicitly rather than reconciling the whole schema:\n" +
          "       mysql -h <host> -u <user> -p <db> < prisma/analytics-table.sql\n" +
          "     Avoid `prisma db push` here — it reconciles everything and can drop\n" +
          "     objects it does not know about."
      : "\n     Nothing else lives in this database, so it is safe to run:\n" +
          "       npx prisma db push",
  );
}

if (foreign.length > 0) {
  console.log(
    `\n   Note: ${foreign.length} table(s) in this database belong to another application.\n` +
      "   Treat it as shared and never run destructive schema commands against it.",
  );
}

/* ── 5. Write check ──────────────────────────────────────────────────────── */

if (missing.length === 0) {
  console.log("\n── 5. Read/write check\n");
  try {
    const before = await prisma.analyticsEvent.count();
    console.log(`   ✓ read AnalyticsEvent (${before} rows)`);
    const probe = await prisma.analyticsEvent.create({
      data: { type: "page_view", path: "/__db_check", visitorHash: "dbcheck", status: "ok" },
    });
    console.log("   ✓ insert succeeded");
    await prisma.analyticsEvent.delete({ where: { id: probe.id } });
    console.log("   ✓ delete succeeded — the app has full read/write access");
  } catch (err) {
    console.log(`   ✗ write failed: ${String(err?.message ?? err).split("\n")[0]}`);
    console.log("     The app can read but not write. Check the GRANT for this user.");
  }
}

await prisma.$disconnect();
console.log("\nDone.");
