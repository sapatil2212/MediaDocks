"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Reports a page view once per navigation.
 *
 * Sets no cookie and reads no storage — the server derives an anonymous daily
 * visitor digest from the request itself. Deliberately silent: a blocked request
 * (ad blocker, offline, analytics disabled) must not produce console noise or
 * affect the page.
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    // The admin area is not part of public usage measurement.
    if (pathname.startsWith("/superadmin") || pathname.startsWith("/dev")) return;

    const body = JSON.stringify({ path: pathname });

    // keepalive lets the request survive a fast navigation away from the page.
    void fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  }, [pathname]);

  return null;
}
