import { beforeEach, describe, expect, it } from "vitest";
import {
  checkLoginThrottle,
  clearLoginAttempts,
  hashPassword,
  readSessionToken,
  recordFailedLogin,
  resetLoginThrottle,
} from "@/lib/admin/auth";

/**
 * The admin gate is the only access control in the app, so its behaviour is
 * pinned here rather than left to manual checks.
 */

describe("hashPassword", () => {
  it("produces a verifiable scrypt digest", () => {
    const stored = hashPassword("correct-horse-battery");
    const [scheme, salt, digest] = stored.split(":");
    expect(scheme).toBe("scrypt");
    expect(salt).toMatch(/^[0-9a-f]{32}$/);
    expect(digest).toMatch(/^[0-9a-f]{128}$/);
  });

  it("salts each hash, so the same password never yields the same digest", () => {
    expect(hashPassword("same-password")).not.toBe(hashPassword("same-password"));
  });
});

describe("readSessionToken", () => {
  it("rejects a missing token", () => {
    expect(readSessionToken(undefined)).toBeNull();
    expect(readSessionToken("")).toBeNull();
  });

  it("rejects a token with no signature", () => {
    const body = Buffer.from(JSON.stringify({ sub: "a", exp: Date.now() + 1000 })).toString(
      "base64url",
    );
    expect(readSessionToken(body)).toBeNull();
  });

  it("rejects a forged signature", () => {
    // The whole point of signing: a hand-written payload must not be accepted.
    const body = Buffer.from(
      JSON.stringify({ sub: "attacker@example.com", exp: Date.now() + 86_400_000 }),
    ).toString("base64url");
    expect(readSessionToken(`${body}.not-a-real-signature`)).toBeNull();
  });

  it("rejects a tampered payload even when a signature is attached", () => {
    const body = Buffer.from(JSON.stringify({ sub: "x", exp: 9_999_999_999_999 })).toString(
      "base64url",
    );
    expect(readSessionToken(`${body}.${body}`)).toBeNull();
  });

  it("rejects non-base64 junk without throwing", () => {
    expect(() => readSessionToken("%%%.%%%")).not.toThrow();
    expect(readSessionToken("%%%.%%%")).toBeNull();
  });
});

describe("login throttling", () => {
  beforeEach(() => resetLoginThrottle());

  it("allows the first attempts and then blocks", () => {
    const ip = "203.0.113.10";
    for (let i = 0; i < 5; i += 1) {
      expect(checkLoginThrottle(ip).blocked).toBe(false);
      recordFailedLogin(ip);
    }
    const state = checkLoginThrottle(ip);
    expect(state.blocked).toBe(true);
    expect(state.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts down the remaining attempts", () => {
    const ip = "203.0.113.11";
    expect(checkLoginThrottle(ip).remaining).toBe(5);
    recordFailedLogin(ip);
    expect(checkLoginThrottle(ip).remaining).toBe(4);
  });

  it("throttles each client independently", () => {
    const attacker = "203.0.113.12";
    for (let i = 0; i < 5; i += 1) recordFailedLogin(attacker);
    expect(checkLoginThrottle(attacker).blocked).toBe(true);
    // A blocked attacker must not lock out everybody else.
    expect(checkLoginThrottle("203.0.113.13").blocked).toBe(false);
  });

  it("clears attempts after a successful sign in", () => {
    const ip = "203.0.113.14";
    for (let i = 0; i < 4; i += 1) recordFailedLogin(ip);
    clearLoginAttempts(ip);
    expect(checkLoginThrottle(ip).remaining).toBe(5);
  });
});
