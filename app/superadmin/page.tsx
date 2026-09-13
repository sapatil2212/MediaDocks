import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";
import { AdminLogin } from "@/components/admin/AdminLogin";
import { isAdminConfigured, isAuthenticated, isUsingPlaintextPassword } from "@/lib/admin/auth";
import { getAnalyticsReport, getSystemReport } from "@/lib/admin/metrics";

/**
 * Super-admin report.
 *
 * Rendered on the server on every request. The gate is here rather than in
 * middleware because verifying the HMAC session needs node crypto, which the edge
 * runtime does not provide — and because an unauthenticated request must never
 * receive the metrics payload at all, not merely be redirected away from it.
 */
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Super admin",
  // An admin surface must never be indexed, previewed or archived.
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default async function SuperAdminPage() {
  if (!(await isAuthenticated())) {
    // No metrics are fetched on this path, so nothing sensitive is computed or
    // shipped to an unauthenticated caller.
    return <AdminLogin configured={await isAdminConfigured()} />;
  }

  const [analytics, system] = await Promise.all([
    getAnalyticsReport(),
    getSystemReport(isUsingPlaintextPassword()),
  ]);

  return <AdminDashboard analytics={analytics} system={system} generatedAt={new Date()} />;
}
