import crypto from "crypto";
import { cookies } from "next/headers";
import { config } from "@/lib/config";
import { prisma } from "@/lib/db/prisma";

/**
 * Authentication for the super-admin account behind /superadmin.
 *
 * Design notes, since this is the only access control in the app:
 *
 *   * Credentials can be stored in the database `SuperAdmin` table or configured in `.env`.
 *   * Credentials are compared in constant time. A naive `===` leaks the length
 *     and prefix of the secret through response timing.
 *   * The session cookie carries an HMAC over its own payload. Without a
 *     signature a cookie like `admin=true` could simply be forged in devtools.
 *   * The cookie is httpOnly (no script access), sameSite=strict (not sent on
 *     cross-site requests, which also blocks CSRF on the logout route) and
 *     Secure in production.
 *   * A hashed password (scrypt) is preferred. Plaintext still works so the
 *     documented env vars keep functioning, but it warns on use.
 *   * Login attempts are throttled per client to make guessing impractical.
 */

const COOKIE_NAME = "mf_admin_session";
const SCRYPT_KEYLEN = 64;

let warnedAboutPlaintext = false;
let warnedAboutSecret = false;
let fallbackSecret: string | undefined;

/**
 * Secret for signing sessions.
 *
 * A random per-process fallback is safe (it only invalidates sessions on
 * restart) and is far better than shipping a hardcoded default, which would let
 * anyone forge a session cookie.
 */
function sessionSecret(): string {
  if (config.adminSessionSecret) return config.adminSessionSecret;

  if (!warnedAboutSecret) {
    warnedAboutSecret = true;
    console.warn(
      "[admin] ADMIN_SESSION_SECRET is not set. Using a random per-process secret, so " +
        "admin sessions end whenever the server restarts. Set it to a long random string.",
    );
  }
  return (fallbackSecret ??= crypto.randomBytes(32).toString("hex"));
}

/** Length-safe constant-time string comparison. */
function timingSafeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  // timingSafeEqual throws on length mismatch, which would itself leak length.
  // Hashing first gives both sides a fixed width.
  const digestA = crypto.createHash("sha256").update(bufA).digest();
  const digestB = crypto.createHash("sha256").update(bufB).digest();
  return crypto.timingSafeEqual(digestA, digestB);
}

/** Produces the `scrypt:<salt>:<hash>` value for SUPER_ADMIN_PASS_HASH. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function verifyHashedPassword(password: string, stored: string): boolean {
  const [scheme, salt, expected] = stored.split(":");
  if (scheme !== "scrypt" || !salt || !expected) return false;
  try {
    const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN).toString("hex");
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export type CredentialCheck =
  | { ok: true }
  | { ok: false; reason: "not-configured" | "invalid" };

/** Why a single credential source did not accept the attempt. */
type SourceOutcome =
  | "match"
  | "password-mismatch"
  | "email-mismatch"
  | "absent" // source holds no credentials for this address
  | "unavailable"; // source could not be consulted at all

async function checkDatabase(email: string, password: string): Promise<SourceOutcome> {
  try {
    const admin = await prisma.superAdmin.findUnique({ where: { email } });
    if (admin) {
      return verifyHashedPassword(password, admin.passwordHash) ? "match" : "password-mismatch";
    }
    // Distinguish "no accounts exist yet" (a setup problem worth reporting as
    // such) from "that address is not one of the accounts that do exist".
    return (await prisma.superAdmin.count()) === 0 ? "absent" : "email-mismatch";
  } catch {
    return "unavailable";
  }
}

function checkEnvironment(email: string, password: string): SourceOutcome {
  const configuredEmail = config.superAdminEmail.trim().toLowerCase();
  const hasSecret = Boolean(config.superAdminPassHash || config.superAdminPass);
  if (!configuredEmail || !hasSecret) return "absent";

  // Both halves are always evaluated, even when the email is already wrong, so
  // response timing does not reveal whether the address exists.
  const emailMatches = timingSafeEqual(email, configuredEmail);

  let passwordMatches: boolean;
  if (config.superAdminPassHash) {
    passwordMatches = verifyHashedPassword(password, config.superAdminPassHash);
  } else {
    if (!warnedAboutPlaintext) {
      warnedAboutPlaintext = true;
      console.warn(
        "[admin] Using plaintext SUPER_ADMIN_PASS. Generate a hash with " +
          "`npm run admin:hash` and set SUPER_ADMIN_PASS_HASH instead, then remove " +
          "SUPER_ADMIN_PASS from the environment.",
      );
    }
    passwordMatches = timingSafeEqual(password, config.superAdminPass);
  }

  if (!emailMatches) return "email-mismatch";
  return passwordMatches ? "match" : "password-mismatch";
}

/**
 * Explains a rejection on the server console.
 *
 * The HTTP response is deliberately vague — it must not tell an attacker which
 * half was wrong — but that same vagueness makes a legitimate misconfiguration
 * impossible to debug. The detail goes here, to the operator's terminal, and
 * never includes the password or the address.
 */
function explainFailure(database: SourceOutcome, environment: SourceOutcome): void {
  const describe = (source: string, outcome: SourceOutcome) => {
    switch (outcome) {
      case "password-mismatch":
        return `${source}: account found, password did not match`;
      case "email-mismatch":
        return `${source}: no account for that email address`;
      case "absent":
        return `${source}: no credentials configured`;
      case "unavailable":
        return `${source}: could not be reached`;
      default:
        return `${source}: accepted`;
    }
  };

  console.warn(
    "[admin] Sign-in rejected.\n" +
      `        ${describe("database", database)}\n` +
      `        ${describe(".env", environment)}\n` +
      "        Run `npm run admin:test-password` to test a password against both.",
  );
}

/**
 * Verifies an email/password pair against the database `SuperAdmin` table and
 * the env-configured credentials.
 *
 * Either source may grant access. Neither is allowed to veto the other: a
 * database row that does not match must not mask valid `.env` credentials (and
 * vice versa), because that silently locks the operator out of the only admin
 * surface in the app with no way back in.
 *
 * Both sources are always evaluated before returning, so the response time does
 * not reveal which one holds an account.
 */
export async function verifyCredentials(email: string, password: string): Promise<CredentialCheck> {
  const normalizedEmail = email.trim().toLowerCase();

  const database = await checkDatabase(normalizedEmail, password);
  const environment = checkEnvironment(normalizedEmail, password);

  if (database === "match" || environment === "match") return { ok: true };

  // Nothing anywhere to compare against is an operator problem, not a failed
  // login, and the route reports it differently.
  const databaseHasNothing = database === "absent" || database === "unavailable";
  if (databaseHasNothing && environment === "absent") {
    return { ok: false, reason: "not-configured" };
  }

  explainFailure(database, environment);
  return { ok: false, reason: "invalid" };
}

/* ────────────────────────────── session cookie ───────────────────────────── */

interface SessionPayload {
  /** Subject: the admin email. */
  sub: string;
  /** Issued at, epoch ms. */
  iat: number;
  /** Expires at, epoch ms. */
  exp: number;
}

function sign(value: string): string {
  return crypto.createHmac("sha256", sessionSecret()).update(value).digest("base64url");
}

function serializeSession(payload: SessionPayload): string {
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  return `${body}.${sign(body)}`;
}

/** Returns the payload only when the signature is valid and it has not expired. */
export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  // Verify before parsing, so untrusted bytes are never JSON.parse'd.
  if (!timingSafeEqual(signature, sign(body))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.exp !== "number" || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

const cookieOptions = () =>
  ({
    httpOnly: true,
    sameSite: "strict" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/superadmin",
    maxAge: config.adminSessionHours * 60 * 60,
  }) as const;

export async function createSession(email?: string): Promise<void> {
  const now = Date.now();
  const sub = email?.trim().toLowerCase() || config.superAdminEmail || "admin";
  const token = serializeSession({
    sub,
    iat: now,
    exp: now + config.adminSessionHours * 60 * 60 * 1000,
  });
  const store = await cookies();
  store.set(COOKIE_NAME, token, cookieOptions());
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.set(COOKIE_NAME, "", { ...cookieOptions(), maxAge: 0 });
}

/** True when the current request carries a valid admin session. */
export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  return readSessionToken(store.get(COOKIE_NAME)?.value) !== null;
}

export interface ActiveSession {
  /** The signed-in address, taken from the verified session payload. */
  email: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * The verified current session, for displaying who is signed in and how long
 * the session has left. Returns null rather than throwing when absent, so a
 * caller can treat it as optional detail rather than an auth check.
 */
export async function getActiveSession(): Promise<ActiveSession | null> {
  const store = await cookies();
  const payload = readSessionToken(store.get(COOKIE_NAME)?.value);
  if (!payload) return null;
  return { email: payload.sub, issuedAt: payload.iat, expiresAt: payload.exp };
}

/* ────────────────────────── login attempt throttling ─────────────────────── */

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const attempts = new Map<string, number[]>();

function attemptKey(ip: string): string {
  // Same reasoning as the public rate limiter: never key on a raw IP.
  return crypto.createHash("sha256").update(`admin|${ip}`).digest("hex").slice(0, 16);
}

export interface ThrottleState {
  blocked: boolean;
  retryAfterSeconds: number;
  remaining: number;
}

export function checkLoginThrottle(ip: string): ThrottleState {
  const now = Date.now();
  const key = attemptKey(ip);
  const recent = (attempts.get(key) ?? []).filter((at) => now - at < LOCKOUT_MS);
  attempts.set(key, recent);

  if (recent.length >= MAX_ATTEMPTS) {
    const oldest = recent[0] ?? now;
    return {
      blocked: true,
      retryAfterSeconds: Math.max(1, Math.ceil((LOCKOUT_MS - (now - oldest)) / 1000)),
      remaining: 0,
    };
  }
  return { blocked: false, retryAfterSeconds: 0, remaining: MAX_ATTEMPTS - recent.length };
}

export function recordFailedLogin(ip: string): void {
  const key = attemptKey(ip);
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((at) => now - at < LOCKOUT_MS);
  recent.push(now);
  attempts.set(key, recent);
}

export function clearLoginAttempts(ip: string): void {
  attempts.delete(attemptKey(ip));
}

/** Test helper. */
export function resetLoginThrottle(): void {
  attempts.clear();
}

/** True when the credentials are configured at all, used to render a setup hint. */
export async function isAdminConfigured(): Promise<boolean> {
  try {
    if ((await prisma.superAdmin.count()) > 0) return true;
  } catch {
    // Fall through to the env check when the database cannot be reached.
  }
  return Boolean(config.superAdminEmail && (config.superAdminPassHash || config.superAdminPass));
}

/** Whether the weaker plaintext credential is in use, surfaced on the dashboard. */
export function isUsingPlaintextPassword(): boolean {
  return Boolean(!config.superAdminPassHash && config.superAdminPass);
}
