"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, Mail, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log unexpected errors
    console.error("[MediaDocks Runtime Error]:", error);
  }, [error]);

  return (
    <section className="flex min-h-[70vh] items-center justify-center py-20">
      <div className="section-shell max-w-lg text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-3xl border border-destructive/30 bg-destructive/10 text-destructive shadow-soft">
          <AlertTriangle className="h-8 w-8" />
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Something went wrong
        </h1>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          An unexpected processing error occurred while rendering this page. Our error monitoring
          system has recorded the issue.
        </p>

        {error?.digest ? (
          <p className="mt-2 font-mono text-[0.7rem] text-muted-foreground">
            Error Digest: {error.digest}
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-xl"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Try Again</span>
          </Button>

          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/" className="inline-flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span>Return Home</span>
            </Link>
          </Button>
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          Need help? Contact support at{" "}
          <a
            href="mailto:sapdigitechsolutions@gmail.com"
            className="text-primary underline underline-offset-4"
          >
            sapdigitechsolutions@gmail.com
          </a>
        </p>
      </div>
    </section>
  );
}
