import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { DOWNLOADER_PATHS } from "@/src/lib/ads/allowlist-data";
import { REDIRECT_ALIASES } from "@/src/lib/redirect-aliases";
import { GUIDE_ARTICLES } from "@/src/lib/guides-data";
import { classifyPath } from "@/src/lib/ads/eligibility";

const root = path.resolve(__dirname, "..");

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(path.join(root, dir))) {
    const rel = `${dir}/${entry}`;
    if (statSync(path.join(root, rel)).isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(entry)) out.push(rel);
  }
  return out;
}

const norm = (file: string) => readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");

/**
 * Files that may mention a downloader path. Everything else is an indexable
 * page, a shared component or navigation, and must not link to a downloader.
 */
const MAY_MENTION = [
  /^app\/(yt|insta|fb|x|pinterest)-downloader\//,
  /^app\/youtube-to-mp3\//,
  /^src\/lib\/ads\//,
  /^src\/lib\/redirect-aliases\.ts$/,
  /^src\/lib\/platform-pages\.ts$/,
  /^app\/sitemap\.ts$/,
  /^src\/lib\/page-dates\.ts$/,
  /^app\/api\/analytics\/collect\/route\.ts$/,
  /^src\/components\/(sections\/PlatformLanding|downloader\/.*)\.tsx?$/,
  /^src\/components\/sections\/Troubleshooting\.tsx$/,
];

describe("downloader link graph", () => {
  const needles = [...DOWNLOADER_PATHS.filter((p) => p !== "/downloader"), ...REDIRECT_ALIASES.map(([s]) => s)];

  it("no indexable page, shared component or navigation links to a downloader path", () => {
    const offenders: string[] = [];
    for (const file of [...walk("app"), ...walk("src")]) {
      if (MAY_MENTION.some((re) => re.test(file))) continue;
      const source = norm(file);
      for (const needle of needles) {
        if (new RegExp(`["'\`]${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["'\`#?/]`).test(source)) {
          offenders.push(`${file}: ${needle}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it("no guide points at a downloader as its related tool", () => {
    for (const guide of GUIDE_ARTICLES) {
      if (!guide.relatedTool) continue;
      expect(classifyPath(guide.relatedTool.path).category, guide.slug).not.toBe("downloader");
      expect(classifyPath(guide.relatedTool.path).category, guide.slug).not.toBe("redirect");
    }
  });

  it("navigation and footer no longer mention downloading platform media", () => {
    for (const file of ["src/components/Navbar.tsx", "src/components/Footer.tsx", "src/components/sections/Hero.tsx"]) {
      const source = norm(file);
      expect(source, file).not.toMatch(/Start Downloading|Universal Downloader|scrollToDownloader|<Downloader\b/);
      expect(source, file).not.toMatch(/YouTube to MP3/);
    }
  });

  it("the home page does not render the downloader", () => {
    const home = norm("app/page.tsx");
    expect(home).not.toMatch(/Downloader/);
  });
});
