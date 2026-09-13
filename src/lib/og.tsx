import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

interface OgImageOptions {
  eyebrow: string;
  title: string;
  subtitle: string;
  badge?: string;
}

/**
 * Shared social preview image. Uses only the layout features satori supports
 * (flexbox, explicit sizes, no gap) and no custom fonts, so it renders at build
 * time without extra assets.
 */
export function renderOgImage({ eyebrow, title, subtitle, badge }: OgImageOptions) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "linear-gradient(135deg, #0b0d12 0%, #141a26 55%, #1b2436 100%)",
          padding: "72px",
          fontFamily: "sans-serif",
          color: "#f7f8fa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: "linear-gradient(135deg, #6366f1 0%, #22d3ee 100%)",
              marginRight: 18,
            }}
          />
          <div style={{ fontSize: 30, fontWeight: 700, letterSpacing: -0.5 }}>MediaDocks</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#8b95a8",
              marginBottom: 20,
            }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              maxWidth: 980,
            }}
          >
            {title}
          </div>
          <div
            style={{
              fontSize: 30,
              color: "#aeb7c6",
              marginTop: 26,
              maxWidth: 940,
              lineHeight: 1.35,
            }}
          >
            {subtitle}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 600,
              color: "#0b0d12",
              background: "#f7f8fa",
              borderRadius: 999,
              padding: "12px 26px",
              marginRight: 16,
            }}
          >
            {badge ?? "Free • No sign up"}
          </div>
          <div style={{ display: "flex", fontSize: 22, color: "#8b95a8" }}>
            Instagram · Pinterest · X · Facebook · YouTube
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
