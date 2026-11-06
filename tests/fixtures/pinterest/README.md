# Pinterest fixtures

Saved Pinterest responses used by the offline unit and integration tests. All
live captures were fetched logged-out on 2026-11-06 and trimmed to the parts the
extractor reads (title, og/twitter tags, JSON-LD, Pin records). Sanitized: no
invite codes, sender ids, nonces, cookies or `__PWS_DATA__` client context.

| File | Pin | Shape |
|------|-----|-------|
| `image-pin-legacy-initial-props.html` | 311241024270560610 | Image Pin, legacy `__PWS_INITIAL_PROPS__` (snake_case `images.orig`) |
| `image-pin-relay.html` | 350295677252925156 | Image Pin, relay `v3GetPinQueryv2` (camelCase `images_orig`) |
| `video-pin-classic-videos-videolist.html` | 664281013778109217 | Classic video Pin, `videos.videoList` {vHLSV4 .m3u8, v720P .mp4} |
| `video-pin-story-separate-audio.html` | 873909502709617339 | Story video Pin, `storyPinData…videoDataV2` (HLS + `videoList720P` .mp4) |
| `video-pin-pinit-sent-page.html` | 32580797303002442 | `/sent/` page reached from a pin.it link; og:title "Check out this Pin from …" |
| `removed-pin-200-pinnotfound.html` | 824721750502199491 | Removed Pin: HTTP 200 empty shell, relay `PinNotFound` |
| `pinresource-image-311241024270560610.json` | 311241024270560610 | PinResource API, image (`images.orig`) |
| `pinresource-classic-video-664281013778109217.json` | 664281013778109217 | PinResource API, `videos.video_list` |
| `pinresource-story-video-hls-only-32580797303002442.json` | 32580797303002442 | PinResource API, story video with HLS only |
| `pinresource-removed-404-824721750502199491.json` | 824721750502199491 | PinResource API 404, `api_error_code: 50` |
| `ytdlp-J-664281013778109217.json` | 664281013778109217 | `yt-dlp -J` formats: muxed HLS + `V_720P` with unknown codecs |
| `ytdlp-J-32580797303002442.json` | 32580797303002442 | `yt-dlp -J` formats: video-only HLS + audio rendition without `acodec` |
| `ytdlp-J-1052575744158055904.json` | 1052575744158055904 | `yt-dlp -J` formats: same pattern plus `V_720P` |
| `carousel-relay-synthetic.html` | (synthetic) | Carousel in the relay shape, 3 slots. Not a live capture |
| `carousel-pinresource-synthetic.json` | (synthetic) | Carousel in the PinResource shape, 3 slots. Not a live capture |
