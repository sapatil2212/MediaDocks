import { notFound } from "next/navigation";
import { ResolverTester } from "./ResolverTester";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Resolver test — MediaDocks (development)",
  robots: { index: false, follow: false },
};

/** Development-only diagnostics page. Not reachable in production. */
export default function ResolverTestPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="font-display text-2xl font-semibold">Resolver test</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Development only. Runs the real pipeline (validate → detect → resolve) and shows exactly
        what each resolver returned.
      </p>
      <ResolverTester />
    </main>
  );
}
