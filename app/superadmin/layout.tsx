import type { Metadata } from "next";

/**
 * The admin area deliberately renders without the public navbar, footer or
 * marketing chrome: it is an operational tool, and it should not offer the site
 * navigation or appear to be part of the public product. It is never indexed and
 * declares no canonical, so it cannot inherit the home page's.
 */
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-background">{children}</div>;
}