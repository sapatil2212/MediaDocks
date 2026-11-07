import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { describe, expect, it, vi } from "vitest";
import { adStateCopy, getAdState } from "@/src/lib/ads/ad-state";
import { ALL_FAQ_ITEMS } from "@/src/lib/faq-data";
import { FAQ_ITEMS } from "@/src/components/sections/FAQSection";

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

const sourceFiles = [...walk("app"), ...walk("src"), ...walk("lib")];

describe("privacy policy contract", () => {
  const privacy = read("app/privacy/page.tsx");

  it("discloses Google and third-party ad cookies, web beacons, IP addresses and device data", () => {
    expect(privacy).toMatch(/third-party vendor, uses cookies, including the DoubleClick cookie/);
    expect(privacy).toMatch(/web beacons/i);
    expect(privacy).toMatch(/IP address/);
    expect(privacy).toMatch(/browser and device\s+details/);
  });

  it("explains personalized and non-personalized ads, consent and withdrawal", () => {
    expect(privacy).toMatch(/personalized/);
    expect(privacy).toMatch(/non-personalized/);
    expect(privacy).toMatch(/consent/i);
    expect(privacy).toMatch(/withdraw consent/);
  });

  it("links to how Google uses data and to every opt-out", () => {
    for (const href of [
      "https://policies.google.com/technologies/partner-sites",
      "https://adssettings.google.com",
      "https://www.aboutads.info/choices/",
      "https://www.youronlinechoices.com/",
    ]) {
      expect(privacy, href).toContain(href);
    }
  });

  it("has an ad-choices section and states the cookies and processors that exist", () => {
    expect(privacy).toContain('id="ad-choices"');
    expect(privacy).toContain("sidebar_state");
    expect(privacy).toContain("Gemini");
    expect(privacy).toContain("Hugging Face");
    expect(privacy).toMatch(/SHA-256/);
    expect(privacy).toMatch(/Effective date: \d{1,2} [A-Z][a-z]+ \d{4}/);
  });

  it("derives the ad state sentence from the build, not a fixed claim", () => {
    expect(privacy).toContain("adStateCopy(getAdState())");
    expect(privacy).not.toMatch(/ads are (currently )?off|off by default/i);
  });

  it("does not claim ads appear anywhere but guide pages", () => {
    expect(privacy).toMatch(/only on long-form guide pages/);
  });

  it("words the three build states (off, no consent tool, with consent tool) distinctly", () => {
    const off = adStateCopy("off");
    const noCmp = adStateCopy("enabled-no-cmp");
    const withCmp = adStateCopy("enabled-with-cmp");
    expect(off.summary).toMatch(/does not request any ads/);
    expect(off.choices).toMatch(/no ad consent control/);
    expect(noCmp.summary).toMatch(/no consent tool is installed/);
    expect(noCmp.choices).toMatch(/nothing to withdraw/);
    expect(withCmp.summary).toMatch(/only on long-form guide pages, and only after the consent tool reports your choice/);
    expect(withCmp.choices).toMatch(/accept, decline or change your choice/);
    expect(withCmp.choices).toMatch(/withdrawing consent/);
    expect(withCmp.choices).toContain("Privacy choices");
    expect(new Set([off.summary, noCmp.summary, withCmp.summary]).size).toBe(3);
    expect(new Set([off.choices, noCmp.choices, withCmp.choices]).size).toBe(3);
  });

  it("the build state comes from the flag, the slot and the shipped consent adapter", () => {
    try {
      expect(getAdState()).toBe("off");
      vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", "1234567890");
      expect(getAdState()).toBe("off");
      vi.stubEnv("NEXT_PUBLIC_ADS_ENABLED", "true");
      expect(getAdState()).toBe("enabled-with-cmp");
      vi.stubEnv("NEXT_PUBLIC_ADSENSE_ARTICLE_SLOT", "abc");
      expect(getAdState()).toBe("off");
    } finally {
      vi.unstubAllEnvs();
    }
  });

  it("each ad state keeps the unconditional disclosures out of the state text", () => {
    for (const state of ["off", "enabled-no-cmp", "enabled-with-cmp"] as const) {
      const copy = adStateCopy(state);
      expect(copy.summary + copy.choices).not.toMatch(/DoubleClick|web beacon/i);
    }
  });
});

describe("removed claims stay removed", () => {
  const banned: Array<[RegExp, string]> = [
    [/no personal ip tracking/i, "No Personal IP Tracking"],
    [/no session or authentication cookies/i, "no session cookies claim"],
    [/no cross-site/i, "no cross-site claim"],
    [/tested against live/i, "tested against live links"],
    [/checked against live public links/i, "checked against live links"],
    [/24[\s-]*(to|-)[\s-]*48/i, "24 to 48 hour response"],
    [/zero permanent/i, "zero permanent"],
    [/100% lawful/i, "100% lawful"],
    [/real (software )?engineers respond/i, "real engineers respond"],
    [/Privacy Officer|Data Protection Team|Legal Department/i, "invented officer or department"],
    [/our designated agent|contacting our designated agent/i, "designated agent claim"],
    [/files deleted after sending/i, "files deleted after sending"],
    [/Lossless Quality|Zero Server Logs/i, "old marketing claims"],
  ];
  const targets = sourceFiles.filter(
    (f) => !f.startsWith("src/lib/ads/") && !f.endsWith("platform-pages.ts") && !f.includes("/downloader/"),
  );
  const noPlatform = targets.filter(
    (f) => !/^app\/(yt|insta|fb|x|pinterest)-downloader\//.test(f) && !f.startsWith("app/youtube-to-mp3/") && !f.includes("PlatformLanding"),
  );

  it.each(banned)("%s is absent", (pattern, label) => {
    const offenders = noPlatform.filter((f) => pattern.test(read(f)));
    expect(offenders, label).toEqual([]);
  });

  it("no page metadata mentions AdSense", () => {
    const offenders = sourceFiles.filter(
      (f) =>
        f.startsWith("app/") &&
        f !== "app/layout.tsx" &&
        /adsense/i.test(read(f)),
    );
    expect(offenders).toEqual([]);
  });

  it("no mojibake sequences in source", () => {
    const bad = String.fromCharCode(0x00e2, 0x20ac);
    const bad2 = String.fromCharCode(0x00c3, 0x00a2);
    const offenders = sourceFiles.filter((f) => {
      const text = readFileSync(path.join(root, f), "utf8");
      return text.includes(bad) || text.includes(bad2);
    });
    expect(offenders).toEqual([]);
  });
});

describe("trust pages and footer", () => {
  const footer = read("src/components/Footer.tsx");

  it("the footer links every trust page", () => {
    for (const href of ["/about", "/contact", "/privacy", "/terms", "/copyright", "/editorial-standards", "/guides"]) {
      expect(footer, href).toContain(`href="${href}"`);
    }
  });

  it("the footer has a Privacy choices control that falls back to the ad-choices section", () => {
    expect(footer).toContain("Privacy choices");
    expect(footer).toContain('href="/privacy#ad-choices"');
    expect(footer).toContain("reopenConsent()");
    expect(footer).toContain("useEffect(");
  });

  it("the reopen button falls back to the ad-choices section when the consent tool has nothing to show", () => {
    expect(footer).toMatch(/if \(!reopenConsent\(\)\) window\.location\.assign\("\/privacy#ad-choices"\)/);
  });

  it("the contact form does not pretend to send a message", () => {
    const form = read("src/components/contact/ContactForm.tsx");
    expect(form).not.toMatch(/setTimeout|Message Sent|queued for/);
    expect(form).toContain("mailto:");
  });

  it("the contact page makes no response-time promise", () => {
    const contact = read("app/contact/page.tsx");
    expect(contact).not.toMatch(/Response Window|business hours|within 24/i);
  });

  it("the copyright page does not claim a registered designated agent", () => {
    const copyright = read("app/copyright/page.tsx");
    expect(copyright).toMatch(/does not state that a designated agent/);
  });

  it("the editorial page names no person and no AI-use claim", () => {
    const editorial = read("app/editorial-standards/page.tsx");
    expect(editorial).toMatch(/No individual author is named/);
    expect(editorial).not.toMatch(/AI-generated|AI tooling/);
  });

  it("emits Organization and WebSite JSON-LD only from the root layout", () => {
    const users = sourceFiles.filter(
      (f) => f !== "src/lib/seo.ts" && /organizationJsonLd\(|webSiteJsonLd\(/.test(read(f)),
    );
    expect(users).toEqual(["app/layout.tsx"]);
  });
});

describe("structured data matches visible content", () => {
  it("the home FAQ JSON-LD uses the visible FAQ items", () => {
    const home = read("app/page.tsx");
    expect(home).toContain("faqJsonLd(FAQ_ITEMS)");
    expect(home).not.toMatch(/howToJsonLd/);
    expect(FAQ_ITEMS.length).toBeGreaterThan(3);
  });
  it("the /faq FAQ JSON-LD uses the visible FAQ items", () => {
    const faq = read("app/faq/page.tsx");
    expect(faq).toContain("faqJsonLd(ALL_FAQ_ITEMS)");
    expect(ALL_FAQ_ITEMS.length).toBeGreaterThan(10);
  });
  it("FAQ answers repeat no sentence across the home and /faq lists", () => {
    const sentences = (text: string) => text.split(/(?<=[.!?])\s+/).map((s) => s.trim().toLowerCase()).filter((s) => s.length > 40);
    const home = new Set(FAQ_ITEMS.flatMap((i) => sentences(i.a)));
    const dupes = ALL_FAQ_ITEMS.flatMap((i) => sentences(i.a)).filter((s) => home.has(s));
    expect(dupes).toEqual([]);
  });
});

describe("health endpoint source", () => {
  it("returns only a status", () => {
    const route = read("app/api/health/route.ts");
    expect(route).toContain("NextResponse.json({ status }");
    expect(route).not.toMatch(/describeEngineTools\(\)\)\s*,|engineNotes|ytdlp/);
  });
});
