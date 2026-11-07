"use client";

/**
 * An explicit in-article ad slot. Rendered only by the guide page, only between
 * two paragraphs of the same section (see placeSlots), and only when
 * decideAds() permits. It never loads the ad script: AdRuntime does.
 *
 * Initial render is null on server and client, so there is no hydration
 * mismatch and the slot never exists before consent is known.
 */
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import {
  ADSENSE_CLIENT_ID,
  getArticleSlotId,
  isValidSlotId,
} from "@/lib/ads/config";
import { getConsent, subscribe } from "@/lib/ads/consent";
import { decideAds } from "@/lib/ads/eligibility";
import { subscribeRuntime } from "@/components/ads/AdRuntime";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function ArticleAd() {
  const pathname = usePathname();
  const pathRef = useRef<string | null>(pathname);
  pathRef.current = pathname;

  const [show, setShow] = useState(false);
  const pushed = useRef(false);

  useEffect(() => {
    let frame: number | null = null;

    const check = () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const marker = document.querySelector("[data-ad-deny]");
        const decision = decideAds({
          pathname: pathRef.current,
          consent: getConsent(),
          denyMarkerPresent: marker !== null,
        });
        setShow(decision.eligible && isValidSlotId(getArticleSlotId()));
      });
    };

    check();
    const offConsent = subscribe(check);
    const offRuntime = subscribeRuntime(check);
    return () => {
      if (frame !== null) window.cancelAnimationFrame(frame);
      offConsent();
      offRuntime();
    };
  }, [pathname]);

  useEffect(() => {
    if (!show) {
      pushed.current = false;
      return;
    }
    if (pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blockers or duplicate pushes leave the slot empty.
    }
  }, [show]);

  const slot = getArticleSlotId();
  if (!show || !isValidSlotId(slot)) return null;

  return (
    <ins
      className="adsbygoogle"
      aria-label="Advertisement"
      style={{ display: "block", minHeight: 280 }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
