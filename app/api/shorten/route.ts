import { NextRequest, NextResponse } from "next/server";
import {
  createShortUrl,
  getShortUrl,
  isAliasAvailable,
  validateTargetUrl,
} from "@/lib/shortener/store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    let { url, customAlias, provider = "mediadocks", utm } = body;

    if (!url || typeof url !== "string") {
      return NextResponse.json(
        { success: false, error: "Target URL is required." },
        { status: 400 }
      );
    }

    // 1. Append UTM tags if provided
    let targetWithUtm = url.trim();
    if (utm && typeof utm === "object") {
      try {
        const parsed = new URL(
          /^https?:\/\//i.test(targetWithUtm) ? targetWithUtm : `https://${targetWithUtm}`
        );
        if (utm.source) parsed.searchParams.set("utm_source", utm.source.trim());
        if (utm.medium) parsed.searchParams.set("utm_medium", utm.medium.trim());
        if (utm.campaign) parsed.searchParams.set("utm_campaign", utm.campaign.trim());
        if (utm.term) parsed.searchParams.set("utm_term", utm.term.trim());
        if (utm.content) parsed.searchParams.set("utm_content", utm.content.trim());
        targetWithUtm = parsed.toString();
      } catch {
        // Fall back to original URL if parsing fails
      }
    }

    // 2. Validate URL & SSRF
    const validation = validateTargetUrl(targetWithUtm);
    if (!validation.valid || !validation.normalized) {
      return NextResponse.json(
        { success: false, error: validation.error || "Invalid destination URL." },
        { status: 400 }
      );
    }

    const finalTargetUrl = validation.normalized;

    // 3. Handle Public Provider Fallbacks if requested
    if (provider === "tinyurl") {
      try {
        const response = await fetch(
          `https://tinyurl.com/api-create.php?url=${encodeURIComponent(finalTargetUrl)}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (response.ok) {
          const tinyUrl = (await response.text()).trim();
          if (tinyUrl.startsWith("http")) {
            return NextResponse.json({
              success: true,
              shortUrl: tinyUrl,
              slug: tinyUrl.split("/").pop() || "",
              targetUrl: finalTargetUrl,
              clicks: 0,
              provider: "tinyurl",
            });
          }
        }
      } catch {
        // Fall back to MediaDocks native shortening if external provider fails
      }
    }

    if (provider === "isgd") {
      try {
        const response = await fetch(
          `https://is.gd/create.php?format=simple&url=${encodeURIComponent(finalTargetUrl)}`,
          { signal: AbortSignal.timeout(5000) }
        );
        if (response.ok) {
          const isgdUrl = (await response.text()).trim();
          if (isgdUrl.startsWith("http")) {
            return NextResponse.json({
              success: true,
              shortUrl: isgdUrl,
              slug: isgdUrl.split("/").pop() || "",
              targetUrl: finalTargetUrl,
              clicks: 0,
              provider: "isgd",
            });
          }
        }
      } catch {
        // Fall back to MediaDocks native
      }
    }

    // 4. MediaDocks Native Direct Shortening
    const record = await createShortUrl({
      targetUrl: finalTargetUrl,
      customAlias: customAlias ? String(customAlias) : undefined,
    });

    // Determine current base origin
    const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
    const proto = req.headers.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");
    const origin = host ? `${proto}://${host}` : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const shortUrl = `${origin}/s/${record.slug}`;

    return NextResponse.json({
      success: true,
      shortUrl,
      slug: record.slug,
      targetUrl: record.targetUrl,
      clicks: record.clicks,
      createdAt: record.createdAt,
      customAlias: record.customAlias,
      provider: "mediadocks",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to shorten URL." },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");
  const checkAlias = searchParams.get("checkAlias");

  if (checkAlias) {
    const available = await isAliasAvailable(checkAlias);
    return NextResponse.json({ success: true, alias: checkAlias, available });
  }

  if (slug) {
    const record = await getShortUrl(slug);
    if (!record) {
      return NextResponse.json({ success: false, error: "Link not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true, record });
  }

  return NextResponse.json({ success: false, error: "Missing query parameters." }, { status: 400 });
}
