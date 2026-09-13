import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand marks, using the artwork in /public/logo.
 *
 * Two things worth knowing about how this is wired:
 *
 *  - The lockup image already contains the "MediaDocks" wordmark and tagline, so
 *    no text is rendered beside it. The previous version drew an inline SVG glyph
 *    plus a text label; keeping that alongside this artwork would print the name
 *    twice.
 *  - The light/dark swap is done with CSS rather than by reading the theme in JS.
 *    Theme state is only known after hydration, so a JS swap would flash the
 *    wrong logo on first paint. Both files ship and CSS picks one, which costs a
 *    few KB and is always correct.
 *
 * `logo-light.png` is the dark-ink version for light backgrounds;
 * `logo-dark.png` is the white-ink version for dark backgrounds.
 */

const LOCKUP_WIDTH = 1155;
const LOCKUP_HEIGHT = 253;

interface LogoProps {
  className?: string;
  /** Rendered height in pixels. Width follows the artwork's 4.57:1 ratio. */
  height?: number;
  /**
   * Set on the navbar instance, which is above the fold on every page. Leave off
   * elsewhere so the footer logo does not compete for early bandwidth.
   */
  priority?: boolean;
}

/** The square badge, for compact places where the full lockup will not fit. */
export function LogoMark({ className, size = 36 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/logo/favicon.png"
      alt=""
      width={size}
      height={size}
      aria-hidden="true"
      className={cn("shrink-0", className)}
    />
  );
}

/** The full lockup: illustration, wordmark and tagline. */
export function Logo({ className, height = 36, priority = false }: LogoProps) {
  const width = Math.round((height * LOCKUP_WIDTH) / LOCKUP_HEIGHT);

  const common = {
    width,
    height,
    priority,
    // The intrinsic file is much larger than any rendered size, so tell the
    // optimizer what is actually needed instead of shipping a 1155px asset.
    sizes: `${width}px`,
    className: "h-auto w-auto object-contain",
  } as const;

  return (
    <span className={cn("inline-flex shrink-0 items-center", className)} style={{ height }}>
      <Image
        {...common}
        src="/logo/logo-light.png"
        alt="MediaDocks"
        className={cn(common.className, "block dark:hidden")}
      />
      {/* Duplicate for dark mode. aria-hidden so the name is announced once. */}
      <Image
        {...common}
        src="/logo/logo-dark.png"
        alt=""
        aria-hidden="true"
        className={cn(common.className, "hidden dark:block")}
      />
    </span>
  );
}
