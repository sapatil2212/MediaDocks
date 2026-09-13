import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  checkLoginThrottle,
  clearLoginAttempts,
  createSession,
  recordFailedLogin,
  verifyCredentials,
} from "@/lib/admin/auth";
import { clientIpFrom } from "@/lib/rate-limiter";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const schema = z.object({
  email: z.string().min(3).max(320),
  password: z.string().min(1).max(200),
});

/**
 * Super-admin sign in.
 *
 * Failure responses are deliberately uniform: the same status and the same
 * message whether the email is unknown or the password is wrong. Distinguishing
 * them would let an attacker confirm the admin address before attacking it.
 */
export async function POST(req: NextRequest) {
  const ip = clientIpFrom(req.headers);

  const throttle = checkLoginThrottle(ip);
  if (throttle.blocked) {
    return NextResponse.json(
      {
        success: false,
        error: `Too many attempts. Try again in ${Math.ceil(throttle.retryAfterSeconds / 60)} minute(s).`,
      },
      { status: 429, headers: { "Retry-After": String(throttle.retryAfterSeconds) } },
    );
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    recordFailedLogin(ip);
    return NextResponse.json(
      { success: false, error: "Email and password are required." },
      { status: 400 },
    );
  }

  const result = await verifyCredentials(parsed.data.email, parsed.data.password);

  if (!result.ok) {
    // A missing configuration is an operator problem, not a credential problem,
    // so it is reported plainly rather than as a failed login.
    if (result.reason === "not-configured") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Admin access is not configured. Set superadmin credentials in the database or environment.",
        },
        { status: 503 },
      );
    }

    recordFailedLogin(ip);
    const remaining = checkLoginThrottle(ip).remaining;
    return NextResponse.json(
      {
        success: false,
        error:
          remaining > 0
            ? `Incorrect email or password. ${remaining} attempt(s) left.`
            : "Incorrect email or password.",
      },
      { status: 401 },
    );
  }

  clearLoginAttempts(ip);
  await createSession(parsed.data.email);

  return NextResponse.json({ success: true });
}
