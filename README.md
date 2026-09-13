# MediaFlow — paste a link, get the media

MediaFlow is a single **Next.js (App Router) + TypeScript** application for resolving and
downloading **publicly accessible** media from Instagram, Pinterest, Facebook, X and YouTube.

No accounts, no logins, no dashboards, no stored history. The whole product is:

```text
Paste URL → Detect platform → Get media info → Preview → Download
```

---

## 1. What this is (and is not)

MediaFlow only resolves content that a platform publishes publicly. It does **not**:

- log in, store cookies, or use session credentials
- bypass private profiles, paywalls, CAPTCHA, DRM or any other access control
- invent a download URL when a platform does not expose one

When a platform will not serve the information publicly, the API returns a typed error
(`PLATFORM_ACCESS_UNAVAILABLE`, `MEDIA_NOT_AVAILABLE`, `MEDIA_NOT_FOUND`) and the UI says so
plainly instead of showing a download button that cannot work.

## Extraction engine

MediaFlow uses **[yt-dlp](https://github.com/yt-dlp/yt-dlp)** (open-source, self-hosted, no paid
API) as the primary extractor for every platform, with **FFmpeg** for muxing and audio extraction.
This is what makes YouTube downloads and selectable resolution / audio formats work. The built-in
HTTP resolvers remain as a no-dependency fallback when the engine is unavailable or can't handle a
URL.

- **Video:** a resolution ladder — 4320p / 2160p / 1440p / 1080p / 720p / 480p / 360p / 240p / 144p
  — limited to what the source actually offers. A progressive format is used when one exists;
  otherwise the best video-only stream is muxed with the best audio (FFmpeg) into MP4.
- **Audio:** the original audio track (M4A/Opus) plus MP3 at 320 / 192 / 128 kbps (capped at the
  source bitrate). MP3 needs FFmpeg.
- **Images / carousels:** streamed directly from the CDN.

The engine reads only public data — the same a browser would — and never bypasses login, private
accounts, CAPTCHA, DRM or any access control. When a source genuinely offers nothing public, the API
returns a typed error (`VIDEO_MEDIA_UNAVAILABLE`, `MEDIA_NOT_AVAILABLE`, ...) and the UI says so
instead of showing a download that can't work.

Requires `yt-dlp` (and `ffmpeg` for muxed video / MP3). Both are installed in the Docker image; for
local dev, `pip install -U yt-dlp` and install FFmpeg. Set `ENGINE_ENABLED=false` to run
resolver-only.

#### Tool discovery

The engine does **not** rely on the binaries being on `PATH`. Package managers (winget, scoop, choco,
homebrew, `pip --user`) routinely install a tool and then require a shell restart before it appears,
and a missing FFmpeg silently removes every muxed resolution and all MP3 options — which looks
exactly like "the platform publishes nothing". Discovery therefore tries, in order:

1. `FFMPEG_PATH` / `FFPROBE_PATH` / `YTDLP_PATH` when set
2. the bare name on `PATH`
3. the well-known install locations for the platform — winget packages and links, scoop shims,
   chocolatey bin, `%APPDATA%\Python\*\Scripts` on Windows; `/usr/bin`, `/usr/local/bin`,
   `/opt/homebrew/bin`, `/snap/bin`, `~/.local/bin` on Linux and macOS
4. for yt-dlp only, `python -m yt_dlp` (how pip installs it when no console script is exposed)

Results are cached per process. **Check what was found at any time:**

```bash
curl http://localhost:3000/api/health
```

```json
{
  "status": "ok",
  "database": "ok",
  "engine": { "ytdlp": "python -m yt_dlp", "ffmpeg": "/usr/bin/ffmpeg",
              "ffprobe": "/usr/bin/ffprobe", "ready": true, "muxCapable": true, "notes": [] }
}
```

`ready: false` means nothing can be extracted; `muxCapable: false` means metadata and progressive
formats still work but high-resolution video and MP3 do not. `notes` says how to fix it, and a
resolve that fails purely for lack of FFmpeg reports that reason rather than "no downloadable file".

#### Timeouts

`ENGINE_TIMEOUT_MS` (default 90s) bounds the metadata probe. Downloads use the separate
`ENGINE_DOWNLOAD_TIMEOUT_MS` (default 600s) because transferring a large file and remuxing it
legitimately takes minutes — a 10-minute 1080p video measured ~123s end to end here.

### Platform status

| Platform  | Metadata | Video download | Audio (MP3/M4A) | Notes |
|-----------|----------|----------------|-----------------|-------|
| YouTube   | yes | **yes** — full resolution ladder | **yes** | Video-only + audio streams muxed to MP4; MP3 via FFmpeg. |
| X (Twitter) | yes | **yes** — MP4 renditions | from video | Progressive MP4s; HLS manifests excluded. |
| Instagram | yes | **when public** | from video | Reels/videos when the file is publicly exposed; else image + poster. |
| Facebook  | yes | **when public** | from video | Public videos when exposed; else details only. |
| Pinterest | yes | **yes (video pins)** | from video | Image Pins give the image; video Pins give MP4. |

Every downloadable option is classified by its real container/MIME before it is offered, and a
thumbnail is never presented as the media. Direct CDN downloads stream straight through; engine
options are produced into a temporary file, streamed, and deleted immediately.

### Media types

Every media item carries a genuinely determined `kind`, `mimeType` and `extension`. Nothing defaults
to JPEG. Detection order:

1. a MIME type the platform itself published (e.g. an X video variant's `content_type`)
2. the media URL's real `Content-Type`, probed with a one-byte ranged request whenever the path has
   no extension or carries transform parameters
3. the extension in the URL path
4. a conservative platform hint

If none of those produce a supported type the item is dropped and `MEDIA_TYPE_UNKNOWN` is reported.

Supported for download: `image/jpeg`, `image/png`, `image/webp`, `image/gif`, `image/avif`,
`video/mp4`, `video/webm`, `video/quicktime`, `video/x-m4v`. HLS manifests are excluded because they
are not a single downloadable file.

The URL extension alone is never trusted: Instagram serves `image/jpeg` from URLs ending in `.webp`
because the `stp` transform decides the output format. At download time the live `Content-Type` is
authoritative, and HTML/JSON/text responses are rejected with `INVALID_MEDIA_RESPONSE` so an error
page can never be saved as media.

Filenames follow the real type — `mediaflow-instagram-post-image.jpg`,
`mediaflow-pinterest-pin-image.png`, `mediaflow-x-post-video.mp4` — with a position suffix when a
post has several items.

---

## 2. Architecture

```text
              USER
                │
                ▼
        Next.js frontend
                │
                ▼
        POST /api/resolve
                │
                ▼
        URL validation  (lib/validation/url.ts)
                │
                ▼
        Platform detection  (lib/platforms/detector.ts)
                │
                ▼
        SSRF / host checks  (lib/download/security.ts)
                │
                ▼
        Platform resolver  (lib/resolver/registry.ts → lib/platforms/*.ts)
                │
                ▼
        MediaResult  ─────────────►  MySQL: one short-lived MediaRequest row
                │
                ▼
        Result card
                │
                ▼
        POST /api/download  { mediaId, formatId }
                │
                ▼
        Temp file → stream to browser → temp file deleted
                │
                ▼
              USER
```

Everything is one Next.js process. No queue, no worker, no object storage, no Redis.

### Why MySQL is in the picture

Exactly one table, `MediaRequest`. It exists so `POST /api/download` can verify a
`{ mediaId, formatId }` reference the server itself issued, instead of accepting a URL from the
browser (which would make the route an open proxy). Rows carry the resolved formats, expire after
`MEDIA_TTL_MINUTES`, and are deleted by the cleanup routine. The full source URL is never stored —
only a sha256 hash of it.

No users, no history, no analytics, no media bytes in the database.

---

## 3. Stack

- **Framework** Next.js 15 (App Router), React 19, TypeScript strict mode
- **UI** Tailwind CSS v4, Radix primitives, Lucide, Sonner (already built, untouched)
- **Database** MySQL 8 + Prisma ORM
- **Validation** Zod schemas + structured URL validation
- **Tests** Vitest
- **Extraction** yt-dlp + FFmpeg as local subprocesses
- **No Redis, no job queue, no microservices** — none of them are needed for this flow

---

## 4. Quick start with Docker

```bash
docker compose up --build
```

Then create the table once (from the host, against the exposed MySQL port):

```bash
npm run prisma:push
```

- App: http://localhost:3000
- Health: http://localhost:3000/api/health
- MySQL: `localhost:3306` (user `root`, password `password`, database `mediaflow`)

The image is built with the real resolver enabled (`MOCK_RESOLVER=false`).

---

## 5. Local development

```bash
npm install
cp .env.example .env
```

```bash
npm run dev
```

The browser **always** calls `POST /api/resolve` — there is no client-side resolver. `MOCK_RESOLVER`
only changes what the server does, so the request/response path is identical in both modes.

- `MOCK_RESOLVER=false` (default) — real resolvers.
- `MOCK_RESOLVER=true` — demo results, no external request, marked `isMock: true` in the response and
  never given a `mediaId`, so demo data cannot be mistaken for a real resolution.

MySQL is optional for resolving: when it is unreachable, references are kept in memory for
`MEDIA_TTL_MINUTES` so a single instance still downloads end to end (ids are prefixed `m_`).

### Debugging a URL

Set `DEBUG_RESOLVER=true` and the server prints a step-by-step trace — received URL, validation,
platform, type hint, resolver, each request's status/content-type/size, which metadata sources
produced data, format count. It never prints page contents, headers or credentials.

```text
[VALIDATION] valid=true normalizedHost=www.instagram.com
[PLATFORM] detected=instagram
[FETCH] label=instagram:post host=www.instagram.com method=GET hop=0
[RESPONSE] label=instagram:post status=200 contentType=text/html bytes=643072 truncated=false
[PARSE] label=instagram:post sources=[opengraph,twitter-card] emptyShell=false
[MEDIA] platform=instagram sources=[opengraph,twitter-card] video=false image=true
```

There is also a development-only page at **`/dev/resolver-test`** that runs the real pipeline and
shows platform, media type, title, creator, thumbnail, dimensions, duration, formats, resolver
status, error code, processing time and the full trace. It and its `/api/dev/resolve` endpoint
return 404 in production.

### Enabling MySQL

1. Start MySQL and create the database:

   ```sql
   CREATE DATABASE mediaflow;
   ```

2. Point `DATABASE_URL` at it:

   ```env
   DATABASE_URL="mysql://root:yourpassword@localhost:3306/mediaflow"
   ```

3. Create the tables:

   ```bash
   npm run prisma:generate
   npm run prisma:push        # only when this database is exclusively MediaFlow's
   ```

   **On a shared database, do not use `prisma db push`.** It reconciles the entire
   schema and can drop objects it does not know about. Create only what is needed:

   ```bash
   mysql -h <host> -u <user> -p <database> < prisma/analytics-table.sql
   ```

4. Check the wiring:

   ```bash
   npm run db:check
   ```

### Diagnosing a database connection

`npm run db:check` separates the three failures that all look like "the database
is broken", because each has a different fix:

| Symptom | Meaning | Where to fix it |
|---|---|---|
| host/port unreachable (`ETIMEDOUT`) | packets dropped | firewall, or wrong host |
| `ECONNREFUSED` | host up, nothing listening | MySQL not running or not bound publicly |
| authentication refused | reachable but not authorised | IP allow-list, user, password or grant |
| tables missing | authorised, schema not created | step 3 above |

It also prints the machine's public IP, the exact `CREATE USER` / `GRANT` statements
for it, an inventory of existing tables, and a read/insert/delete test.

Two traps worth knowing about with managed/cPanel MySQL:

- **Remote access is IP allow-listed.** Add the connecting IP under *Databases →
  Remote MySQL*. A home IP rotates, and the machine you deploy to has a different
  one again, so this is usually the cause of "Access denied" on a server that is
  clearly reachable.
- **Prisma can misreport an access denial.** For an account it will not accept,
  MySQL runs a decoy authentication exchange, which Prisma surfaces as
  `Unknown authentication plugin 'sha256_password'`. That is not a plugin problem —
  it means the credentials were rejected for that host.
- **cPanel prefixes database names too.** If the user is `acct_someuser`, the
  database is probably `acct_mydb`, not `mydb`. `db:check` flags this mismatch.

---

## 6. Environment variables

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `mysql://root:password@localhost:3306/mediaflow` | MySQL connection. Percent-encode special characters in the password (`@`→`%40`). Verify with `npm run db:check` |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | Public app URL |
| `NEXT_PUBLIC_API_URL` | *(empty)* | API origin; empty means same origin |
| `MOCK_RESOLVER` | `false` | Server-side demo mode; no external request is made |
| `DEBUG_RESOLVER` | `false` | Print the resolver trace (development only) |
| `MEDIA_TTL_MINUTES` | `30` | Lifetime of a media reference and of temp files |
| `STORAGE_PATH` | `./storage/tmp` | Temporary download directory |
| `MAX_FILE_SIZE_MB` | `500` | Hard cap per download |
| `MAX_URL_LENGTH` | `2048` | Maximum accepted URL length |
| `REQUEST_TIMEOUT_MS` | `15000` | Outbound request timeout |
| `RESOLVE_LIMIT` / `RESOLVE_WINDOW_SECONDS` | `10` / `60` | Resolve rate limit per IP |
| `DOWNLOAD_LIMIT` / `DOWNLOAD_WINDOW_SECONDS` | `5` / `60` | Download rate limit per IP |

---

## 7. API

### `GET /api/health`

```json
{ "status": "ok", "database": "ok" }
```

Returns `200` when the database answers, `503` with `"database": "unavailable"` otherwise.

### `POST /api/resolve`

```json
// request
{ "url": "https://www.instagram.com/reel/Cxxxxxxxxxx/" }
```

```json
// response — a post with real downloadable media
{
  "success": true,
  "data": {
    "platform": "x",
    "postKind": "carousel",
    "kind": "Post image",
    "title": "...",
    "creator": "@example",
    "thumbnail": "https://pbs.twimg.com/media/AAA.jpg",
    "sourceUrl": "https://x.com/example/status/123",
    "mediaId": "clx1234567890",
    "media": [
      {
        "id": "x-image-1",
        "kind": "image",
        "mediaUrl": "https://pbs.twimg.com/media/AAA.jpg",
        "mimeType": "image/jpeg",
        "extension": "jpg",
        "label": "JPG",
        "quality": "Image 1",
        "width": 1125,
        "height": 669,
        "downloadable": true
      }
    ]
  }
}
```

```json
// response — media found, but no downloadable file exists
{
  "success": true,
  "data": {
    "platform": "instagram",
    "postKind": "video",
    "kind": "Reel",
    "title": "...",
    "creator": "@example",
    "thumbnail": "https://scontent.cdninstagram.com/...",
    "media": [],
    "unavailable": {
      "code": "VIDEO_MEDIA_UNAVAILABLE",
      "message": "Instagram does not publish a video file for this reel, so it cannot be downloaded."
    }
  }
}
```

`media` is empty whenever nothing downloadable exists, and `mediaId` is only present when a download
can actually be served. `mediaUrl` is a public CDN URL, included so the UI can preview a video inline;
downloads still go through the server reference, so the route is never an open proxy.

Failures use the same envelope:

```json
{
  "success": false,
  "error": { "code": "PLATFORM_ACCESS_UNAVAILABLE", "message": "This content could not be accessed." }
}
```

| Code | HTTP |
|---|---|
| `INVALID_URL`, `UNSUPPORTED_PLATFORM`, `INVALID_PLATFORM_URL` | 400 |
| `UNSAFE_URL` | 403 |
| `MEDIA_NOT_FOUND`, `MEDIA_NOT_AVAILABLE`, `FORMAT_NOT_AVAILABLE` | 404 |
| `MEDIA_REFERENCE_EXPIRED` | 410 |
| `FILE_TOO_LARGE` | 413 |
| `RATE_LIMITED` | 429 |
| `PLATFORM_ACCESS_UNAVAILABLE`, `DOWNLOAD_FAILED` | 502 |
| `REQUEST_TIMEOUT` | 504 |
| `INTERNAL_ERROR` | 500 |

### `POST /api/download`

```json
{ "mediaId": "clx1234567890", "itemId": "x-video-1-1" }
```

Responds with the file itself:

```http
Content-Type: video/mp4
Content-Disposition: attachment; filename="mediaflow-x-post-video.mp4"
```

The server looks the reference up, re-validates the stored URL against the CDN allow-list, reads the
real `Content-Type`, derives the matching extension and streams the bytes straight through — the body
is never buffered in memory, and a size guard enforces `MAX_FILE_SIZE_MB` even when the upstream omits
`Content-Length`. Any other body shape, including a raw URL, is rejected.

---

## 8. Security

- **Validation order** protocol → hostname → supported platform → literal IP → DNS-resolved IP.
  Nothing outbound happens before all of them pass.
- **Blocked** `localhost`, loopback, `10/8`, `172.16/12`, `192.168/16`, `169.254/16`, CGNAT,
  multicast, reserved ranges, IPv6 `::1`/`fc00::/7`/`fe80::/10`, dot-less hostnames,
  `.local` / `.internal` / `.lan`, and every scheme other than HTTP/HTTPS.
- **Redirects** followed manually, one hop at a time, each hop re-validated.
- **Downloads** restricted to an allow-list of platform CDNs and to references the server issued.
- **Logs** contain `requestId`, endpoint, platform, duration, success and error code. No URLs,
  IPs, cookies or tokens. The rate limiter keys on a truncated hash of the IP, held in memory.

---

## 9. Cleanup

Expired `MediaRequest` rows and stale temp files are removed by `lib/cleanup.ts`, triggered
opportunistically at most once every five minutes by normal `/api/resolve` traffic — no cron job
or worker needed. Downloaded temp files are deleted as soon as the response stream closes.

---

## 10. Tests

```bash
npm test
```

Covered:

- **Platform detection** every supported host and type hint, protocol-less input, unsupported
  domains, malformed input, non-HTTP schemes, URL normalization (tracking params stripped,
  identifying params kept)
- **Validation** non-string, empty, over-length, malformed, unsupported protocol and unsupported
  platform inputs
- **Security** private/loopback/link-local/reserved address detection, internal hostnames, the CDN
  allow-list, and a guarantee that unsafe URLs never reach a resolver (the `fetch` spy stays at
  zero calls)
- **API** `/api/resolve` validation and rate limiting (429 + `Retry-After`), `/api/download`
  refusing raw URLs and unknown references, `/api/health` shape
- **Mock mode** returns demo results, makes no network call, and never exposes a media URL
- **Database** `tests/db.test.ts` creates, reads, expires and deletes a `MediaRequest`, and checks
  reference resolution. It **skips automatically when MySQL is unreachable** and prints a note; run
  `npm run prisma:push` against a live MySQL to exercise it.

---

## 11. Adding a platform

1. Create `lib/platforms/<name>.ts` implementing `PlatformResolver` (`platform`, `canHandle`,
   `resolve`). Return only formats whose `downloadUrl` is real and on an allow-listed host.
2. Add the host to `detectPlatformFromUrl` in `lib/platforms/detector.ts`.
3. Add the instance to `lib/resolver/registry.ts`.
4. Add the CDN host to `ALLOWED_MEDIA_HOSTS` in `lib/download/security.ts`.
5. Add detection cases to `tests/detector.test.ts`.

---

## 12. Acceptable use

Use MediaFlow only for content you are authorized to download. Respect creators' rights and each
platform's terms of service.
