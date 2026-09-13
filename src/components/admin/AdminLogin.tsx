"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Super-admin sign-in form.
 *
 * Credentials are posted to the server and verified there; nothing is compared
 * client-side and no token is ever placed in localStorage, so the session cannot
 * be read or forged by page scripts.
 */
export function AdminLogin({ configured }: { configured: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const res = await fetch("/api/superadmin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = (await res.json()) as { success?: boolean; error?: string };

      if (!res.ok || !body.success) {
        setError(body.error ?? "Sign in failed.");
        setPassword("");
        return;
      }

      // Reload as a server render so the dashboard is fetched with the session.
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="section-shell flex min-h-[80vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="mb-7 flex flex-col items-center text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl border border-border bg-surface shadow-soft">
            <Lock className="h-5 w-5 text-primary" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Super admin</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Restricted area. Authorised access only.
          </p>
        </div>

        {!configured ? (
          <div className="mb-4 flex gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm">
            <AlertCircle
              className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
            <p className="min-w-0 text-muted-foreground">
              Admin credentials are not configured. Set{" "}
              <code className="figure-mono text-xs">SUPER_ADMIN_EMAIL</code> and{" "}
              <code className="figure-mono text-xs">SUPER_ADMIN_PASS_HASH</code> in the
              environment, then restart.
            </p>
          </div>
        ) : null}

        <form onSubmit={submit} className="panel p-6">
          <label htmlFor="admin-email" className="text-xs font-semibold">
            Email
          </label>
          <input
            id="admin-email"
            type="email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={busy}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60 disabled:opacity-60"
          />

          <label htmlFor="admin-password" className="mt-5 block text-xs font-semibold">
            Password
          </label>
          <input
            id="admin-password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={busy}
            className="mt-2 h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm outline-none focus:border-primary/60 disabled:opacity-60"
          />

          {error ? (
            <p
              role="alert"
              className="mt-4 rounded-xl border border-destructive/40 bg-destructive/5 px-3 py-2.5 text-xs text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={busy}
            className="mt-6 h-11 w-full rounded-xl text-sm font-semibold"
          >
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Checking
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          Sign-in attempts are limited to 5 per 15 minutes.
        </p>
      </div>
    </div>
  );
}
