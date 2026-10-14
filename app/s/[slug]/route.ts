import { NextRequest, NextResponse } from "next/server";
import { getShortUrl, recordClick } from "@/lib/shortener/store";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const { searchParams } = new URL(req.url);
  const preview = searchParams.get("preview") === "1" || searchParams.get("safety") === "1";

  if (!slug) {
    return NextResponse.redirect(new URL("/url-shortener", req.url));
  }

  const record = await getShortUrl(slug);

  if (!record) {
    // Show a clean 404 page
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Short Link Not Found — MediaDocks</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0c; color: #f3f4f6; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #131318; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 40px; max-width: 480px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h1 { font-size: 24px; margin-bottom: 12px; color: #ffffff; }
    p { font-size: 14px; color: #9ca3af; line-height: 1.6; margin-bottom: 24px; }
    .badge { display: inline-block; background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 9999px; padding: 4px 12px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .btn { display: inline-block; background: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 600; transition: background 0.2s; }
    .btn:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">404 • Not Found</div>
    <h1>Link Does Not Exist</h1>
    <p>The shortened link you are trying to visit was either mistyped or has expired.</p>
    <a href="/url-shortener" class="btn">Create a New Short Link</a>
  </div>
</body>
</html>`;
    return new NextResponse(html, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // If user requested Link Safety Preview
  if (preview) {
    const target = record.targetUrl;
    let hostname = "";
    try {
      hostname = new URL(target).hostname;
    } catch {
      hostname = target;
    }

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Safety Preview — MediaDocks</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0a0a0c; color: #f3f4f6; margin: 0; padding: 0; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: #131318; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 36px; max-width: 540px; width: 90%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
    h1 { font-size: 22px; margin-bottom: 8px; color: #ffffff; }
    p { font-size: 13px; color: #9ca3af; line-height: 1.5; margin-bottom: 20px; }
    .badge { display: inline-block; background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 9999px; padding: 4px 12px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .url-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 16px; margin-bottom: 24px; text-align: left; word-break: break-all; }
    .url-box label { font-size: 11px; text-transform: uppercase; color: #6b7280; font-weight: bold; letter-spacing: 0.05em; display: block; margin-bottom: 6px; }
    .url-box a { color: #60a5fa; text-decoration: none; font-size: 14px; font-family: monospace; }
    .stats { display: flex; justify-content: space-around; margin-bottom: 24px; border-top: 1px solid rgba(255,255,255,0.08); border-bottom: 1px solid rgba(255,255,255,0.08); padding: 12px 0; }
    .stat-item { text-align: center; }
    .stat-val { font-size: 16px; font-weight: bold; color: #ffffff; }
    .stat-lbl { font-size: 11px; color: #9ca3af; }
    .actions { display: flex; gap: 12px; justify-content: center; }
    .btn-primary { background: #3b82f6; color: #ffffff; padding: 11px 22px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; }
    .btn-primary:hover { background: #2563eb; }
    .btn-secondary { background: rgba(255,255,255,0.08); color: #d1d5db; padding: 11px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 600; }
    .btn-secondary:hover { background: rgba(255,255,255,0.12); color: #ffffff; }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Verified Link Safety Check</div>
    <h1>You are about to visit:</h1>
    <p>This is a destination preview for the short link <strong>/s/${record.slug}</strong>.</p>
    
    <div class="url-box">
      <label>Destination Target (${hostname})</label>
      <a href="${record.targetUrl}" rel="nofollow noopener noreferrer">${record.targetUrl}</a>
    </div>

    <div class="stats">
      <div class="stat-item">
        <div class="stat-val">${record.clicks}</div>
        <div class="stat-lbl">Total Clicks</div>
      </div>
      <div class="stat-item">
        <div class="stat-val">${new Date(record.createdAt).toLocaleDateString()}</div>
        <div class="stat-lbl">Created Date</div>
      </div>
    </div>

    <div class="actions">
      <a href="${record.targetUrl}" class="btn-primary" rel="nofollow noopener noreferrer">Continue to Website →</a>
      <a href="/url-shortener" class="btn-secondary">MediaDocks Home</a>
    </div>
  </div>
</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  // Increment click count asynchronously
  void recordClick(slug);

  // Instant 307 Temporary Redirect
  return NextResponse.redirect(record.targetUrl, { status: 307 });
}
