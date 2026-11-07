import { existsSync, readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { ADSENSE_CLIENT_ID, ADSENSE_PUBLISHER_ID } from "@/src/lib/ads/config";

const file = path.resolve(__dirname, "..", "public", "ads.txt");

// public/ads.txt is tracked so every deploy ships it. The checks compare as
// booleans so a failure never prints the publisher ID.
describe("ads.txt", () => {
  it("is present in public/", () => {
    expect(existsSync(file)).toBe(true);
  });

  it("has a valid Google line whose publisher ID matches the site config", () => {
    const lines = readFileSync(file, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    const google = lines.filter((l) => l.toLowerCase().startsWith("google.com,"));
    expect(google.length, "no google.com line").toBeGreaterThan(0);
    for (const line of google) {
      const fields = line.split(",").map((s) => s.trim());
      const [domain, pub, relation, certId] = fields;
      expect(fields.length, "field count").toBe(4);
      expect(domain).toBe("google.com");
      expect(/^pub-\d{10,20}$/.test(pub), "format").toBe(true);
      expect(relation, "relationship").toBe("DIRECT");
      expect(certId, "certification id").toBe("f08c47fec0942fa0");
      expect(pub === ADSENSE_PUBLISHER_ID, "mismatch").toBe(true);
      expect(`ca-${pub}` === ADSENSE_CLIENT_ID, "mismatch").toBe(true);
    }
  });
});
