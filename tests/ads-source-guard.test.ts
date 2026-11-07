import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

const root = path.resolve(__dirname, "..");
const read = (p: string) => readFileSync(path.join(root, p), "utf8").replace(/\r\n/g, "\n");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(path.join(root, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(path.join(root, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(rel);
  }
  return out;
}

describe("ads source guard", () => {
  it("the root layout has no static ad script and renders the runtime", () => {
    const layout = read("app/layout.tsx");
    expect(layout).not.toMatch(/googlesyndication|adsbygoogle/i);
    expect(layout).toContain("<AdRuntime />");
    expect(layout).toContain("google-adsense-account");
  });

  it("the ad script origin appears only in the ads modules", () => {
    const files = [...walk("app"), ...walk("src"), ...walk("lib")];
    const offenders = files.filter(
      (f) =>
        !f.startsWith("src/lib/ads/") &&
        !f.startsWith("src/components/ads/") &&
        !f.startsWith("tests/") &&
        /googlesyndication/i.test(read(f)),
    );
    expect(offenders).toEqual([]);
  });

  it("AdRuntime defers to nextAction and holds no eligibility logic", () => {
    const src = read("src/components/ads/AdRuntime.tsx");
    expect(src).toContain("nextAction(");
    expect(src).toContain("needsSyncTeardown(");
    expect(src).not.toMatch(/decideAds\(|decideCmp\(|isAllowlistedGuide\(|classifyPath\(/);
    expect(src).toContain("[data-ad-deny]");
  });

  it("only the load-ad-script branch appends the ad script, only install-cmp installs the adapter", () => {
    const src = read("src/components/ads/AdRuntime.tsx");
    expect(src.match(/appendChild\(/g)?.length).toBe(1);
    expect(src.match(/\.install\(/g)?.length).toBe(1);
    const appendFn = src.slice(src.indexOf("function loadAdScript"), src.indexOf("function evaluate"));
    expect(appendFn).toContain("appendChild(");
    expect(src).toMatch(/case "load-ad-script":\s*loadAdScript\(\)/);
    expect(src).toMatch(/case "install-cmp":\s*installCmp\(\)/);
    expect(src).toContain("getConsentAdapter()");
  });

  it("the guarded teardown uses a time-boxed sessionStorage guard, the unguarded one never touches it", () => {
    const src = read("src/components/ads/AdRuntime.tsx");
    const fn = src.slice(src.indexOf("function teardown"), src.indexOf("function installCmp"));
    expect(src).toContain('"ads-teardown-at"');
    expect(fn).toContain("GUARD_KEY");
    expect(src).toContain("10_000");
    const guardedBlock = fn.slice(fn.indexOf('if (mode === "guarded")'), fn.indexOf("try {\n    reloading"));
    expect(guardedBlock).toContain("try {");
    expect(guardedBlock).toContain("catch");
    expect(guardedBlock).toContain("sessionStorage");
    const unguarded = fn.slice(fn.indexOf("try {\n    reloading"));
    expect(unguarded).not.toContain("sessionStorage");
  });

  it("leaving the allowlist is evaluated synchronously, not in a frame", () => {
    const src = read("src/components/ads/AdRuntime.tsx");
    const layoutEffect = src.slice(src.indexOf("useLayoutEffect(() => {"));
    const block = layoutEffect.slice(0, layoutEffect.indexOf("}, [pathname]);"));
    expect(block).toContain("needsSyncTeardown(");
    expect(block).not.toContain("requestAnimationFrame");
    expect(block).toContain("evaluate()");
  });

  it("halted blocks only marker-driven work", () => {
    const src = read("src/components/ads/AdRuntime.tsx");
    expect(src).toMatch(
      /halted &&\s*\(action === "install-cmp" \|\| action === "load-ad-script" \|\| action === "teardown-guarded"\)/,
    );
  });

  it("ArticleAd renders null first, uses rAF, reads the marker and the slot ID", () => {
    const src = read("src/components/ads/ArticleAd.tsx");
    expect(src).toContain("useState(false)");
    expect(src).toContain("requestAnimationFrame");
    expect(src).toContain("[data-ad-deny]");
    expect(src).toContain("getArticleSlotId()");
    expect(src).toContain("isValidSlotId(");
    expect(src).not.toMatch(/createElement\(["']script|appendChild\(/);
  });

  it("error, global-error and not-found render the deny marker", () => {
    for (const file of ["app/error.tsx", "app/global-error.tsx", "app/not-found.tsx"]) {
      expect(read(file), file).toContain("<AdDenyMarker />");
    }
  });

  it("the consent adapter loads only Google's consent tool tag, never the ad script, and only with the flag on", () => {
    const src = read("src/lib/ads/adapter.ts");
    expect(src).toContain("FUNDING_CHOICES_SCRIPT_URL");
    expect(src).not.toMatch(/ADSENSE_SCRIPT_URL|googlesyndication|adsbygoogle/);
    expect(src).toMatch(/if \(!adsEnabled\(\)\) return null;/);
    expect(src).not.toMatch(/ca-pub-|pub-\d/);
    const config = read("src/lib/ads/config.ts");
    expect(config).toMatch(/FUNDING_CHOICES_SCRIPT_URL = `https:\/\/fundingchoicesmessages\.google\.com\/i\/\$\{ADSENSE_PUBLISHER_ID\}\?ers=1`/);
  });

  it("the consent tool origin appears only in the ads config", () => {
    const files = [...walk("app"), ...walk("src"), ...walk("lib")];
    const offenders = files.filter((f) => f !== "src/lib/ads/config.ts" && /fundingchoicesmessages/i.test(read(f)));
    expect(offenders).toEqual([]);
  });

  it("the privacy page does not import ad components", () => {
    const files = walk("app/privacy");
    for (const f of files) expect(read(f), f).not.toMatch(/components\/ads/);
  });

  it("ads default to off in the example environment", () => {
    const example = read(".env.example");
    expect(example).toMatch(/^# NEXT_PUBLIC_ADS_ENABLED=true$/m);
    expect(example).not.toMatch(/^NEXT_PUBLIC_ADS_ENABLED=/m);
  });
});
