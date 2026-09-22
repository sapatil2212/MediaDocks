"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

/**
 * Public site chrome, omitted from operational surfaces.
 *
 * The root layout must own <html>/<body>, fonts and providers, so a nested
 * /superadmin layout cannot remove a navbar/footer already rendered above it.
 * Keeping this tiny pathname-aware boundary here gives the admin area a true
 * application shell without moving every public route into a route group.
 */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/superadmin");

  if (isAdmin) {
    return <div className="min-w-0 flex-1">{children}</div>;
  }

  return (
    <>
      <Navbar />
      <main className="min-w-0 flex-1">{children}</main>
      <Footer />
    </>
  );
}
