import { existsSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { ADSENSE_CLIENT_ID } from "@/src/lib/ads/config";

const file = path.resolve(__dirname, "..", "public", "ads.txt");
const present = existsSync(file);

// public/ads.txt is not tracked in git (owner decision pending), so a clean
// checkout skips this. The check never prints the publisher ID.
describe.skipIf(!present)("ads.txt", () => {
  it("has a valid Google line whose publisher ID matches the site config", () => {
    const lines = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    const google = lines.filter((l) => l.toLowerCase().startsWith("google.com,"));
    expect(google.length, "no google.com line").toBeGreaterThan(0);
    for (const line of google) {
      const [domain, pub, relation, certId] = line.split(",").map((s) => s.trim());
      expect(domain).toBe("google.com");
      expect(/^pub-\d{10,20}$/.test(pub), "format").toBe(true);
      expect(relation, "relationship").toBe("DIRECT");
      expect(certId, "certification id").toBe("f08c47fec0942fa0");
      expect(`ca-${pub}` === ADSENSE_CLIENT_ID, "mismatch").toBe(true);
    }
  });
});

it.skipIf(present)("ads.txt not present, check skipped", () => {
  expect(present).toBe(false);
});
