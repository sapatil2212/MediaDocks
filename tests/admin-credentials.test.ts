import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Credential resolution is the part that repeatedly locked the operator out of
 * /superadmin, so the contract is pinned here: either source may grant access,
 * and neither may veto the other.
 *
 * The config and prisma modules are mocked so no database or .env is involved.
 */

const dbState: { row: { email: string; passwordHash: string } | null; count: number; throws: boolean } =
  { row: null, count: 0, throws: false };

const envState = { superAdminEmail: "", superAdminPass: "", superAdminPassHash: "" };

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    superAdmin: {
      findUnique: vi.fn(async ({ where }: { where: { email: string } }) => {
        if (dbState.throws) throw new Error("database unreachable");
        return dbState.row && dbState.row.email === where.email ? dbState.row : null;
      }),
      count: vi.fn(async () => {
        if (dbState.throws) throw new Error("database unreachable");
        return dbState.count;
      }),
    },
  },
}));

vi.mock("@/lib/config", () => ({
  get config() {
    return {
      ...envState,
      adminSessionSecret: "test-secret-for-signing-sessions",
      adminSessionHours: 8,
    };
  },
}));

const { hashPassword, verifyCredentials } = await import("@/lib/admin/auth");

const EMAIL = "admin@example.com";
const PASSWORD = "a-strong-admin-password";

beforeEach(() => {
  dbState.row = null;
  dbState.count = 0;
  dbState.throws = false;
  envState.superAdminEmail = "";
  envState.superAdminPass = "";
  envState.superAdminPassHash = "";
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

describe("verifyCredentials — database source", () => {
  it("accepts the stored password", async () => {
    dbState.row = { email: EMAIL, passwordHash: hashPassword(PASSWORD) };
    dbState.count = 1;
    await expect(verifyCredentials(EMAIL, PASSWORD)).resolves.toEqual({ ok: true });
  });

  it("rejects a wrong password", async () => {
    dbState.row = { email: EMAIL, passwordHash: hashPassword(PASSWORD) };
    dbState.count = 1;
    await expect(verifyCredentials(EMAIL, "wrong")).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("ignores surrounding whitespace and casing in the submitted email", async () => {
    dbState.row = { email: EMAIL, passwordHash: hashPassword(PASSWORD) };
    dbState.count = 1;
    await expect(verifyCredentials(`  ${EMAIL.toUpperCase()}  `, PASSWORD)).resolves.toEqual({
      ok: true,
    });
  });
});

describe("verifyCredentials — env source", () => {
  it("accepts a plaintext SUPER_ADMIN_PASS", async () => {
    envState.superAdminEmail = EMAIL;
    envState.superAdminPass = PASSWORD;
    await expect(verifyCredentials(EMAIL, PASSWORD)).resolves.toEqual({ ok: true });
  });

  it("accepts a hashed SUPER_ADMIN_PASS_HASH", async () => {
    envState.superAdminEmail = EMAIL;
    envState.superAdminPassHash = hashPassword(PASSWORD);
    await expect(verifyCredentials(EMAIL, PASSWORD)).resolves.toEqual({ ok: true });
  });

  it("prefers the hash when both are set", async () => {
    envState.superAdminEmail = EMAIL;
    envState.superAdminPassHash = hashPassword(PASSWORD);
    envState.superAdminPass = "a-different-password";
    await expect(verifyCredentials(EMAIL, "a-different-password")).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
    await expect(verifyCredentials(EMAIL, PASSWORD)).resolves.toEqual({ ok: true });
  });

  it("rejects a wrong email", async () => {
    envState.superAdminEmail = EMAIL;
    envState.superAdminPass = PASSWORD;
    await expect(verifyCredentials("someone@else.com", PASSWORD)).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});

describe("verifyCredentials — neither source vetoes the other", () => {
  /** This is the regression that locked the operator out twice. */
  it("accepts .env credentials even when a non-matching database row exists", async () => {
    dbState.row = { email: EMAIL, passwordHash: hashPassword("the-database-password") };
    dbState.count = 1;
    envState.superAdminEmail = EMAIL;
    envState.superAdminPass = PASSWORD;

    await expect(verifyCredentials(EMAIL, PASSWORD)).resolves.toEqual({ ok: true });
  });

  it("accepts the database password even when .env holds a different one", async () => {
    dbState.row = { email: EMAIL, passwordHash: hashPassword("the-database-password") };
    dbState.count = 1;
    envState.superAdminEmail = EMAIL;
    envState.superAdminPass = PASSWORD;

    await expect(verifyCredentials(EMAIL, "the-database-password")).resolves.toEqual({ ok: true });
  });

  it("still rejects a password that neither source knows", async () => {
    dbState.row = { email: EMAIL, passwordHash: hashPassword("the-database-password") };
    dbState.count = 1;
    envState.superAdminEmail = EMAIL;
    envState.superAdminPass = PASSWORD;

    await expect(verifyCredentials(EMAIL, "neither-of-them")).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });

  it("falls back to .env when the database is unreachable", async () => {
    dbState.throws = true;
    envState.superAdminEmail = EMAIL;
    envState.superAdminPass = PASSWORD;

    await expect(verifyCredentials(EMAIL, PASSWORD)).resolves.toEqual({ ok: true });
  });
});

describe("verifyCredentials — nothing configured", () => {
  it("reports not-configured when no source has credentials", async () => {
    await expect(verifyCredentials(EMAIL, PASSWORD)).resolves.toEqual({
      ok: false,
      reason: "not-configured",
    });
  });

  it("reports not-configured when the database is down and .env is empty", async () => {
    dbState.throws = true;
    await expect(verifyCredentials(EMAIL, PASSWORD)).resolves.toEqual({
      ok: false,
      reason: "not-configured",
    });
  });

  it("reports invalid, not not-configured, when accounts exist but none match", async () => {
    dbState.row = { email: "other@example.com", passwordHash: hashPassword("x") };
    dbState.count = 1;
    await expect(verifyCredentials(EMAIL, PASSWORD)).resolves.toEqual({
      ok: false,
      reason: "invalid",
    });
  });
});
