import { ImageResponse } from "next/og";

export const alt = "Is This AI Generated? — paste a URL, get a 0–100 slop score";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Branded social card in the site's editorial/forensic palette.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3ede1",
          padding: "64px 72px",
          border: "16px solid #17140f",
          fontFamily: "Georgia, serif",
        }}
      >
        {/* top label row */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: "50%",
              border: "4px solid #17140f",
            }}
          >
            <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#e8431c" }} />
          </div>
          <div
            style={{
              fontSize: 24,
              letterSpacing: 6,
              color: "#4a4435",
              fontFamily: "monospace",
            }}
          >
            SLOP LAB · FORENSIC AUTHENTICITY REPORT
          </div>
        </div>

        {/* headline + score dial */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 760 }}>
            <div style={{ display: "flex", fontSize: 82, lineHeight: 1.04, color: "#17140f" }}>
              Is this website
            </div>
            <div style={{ display: "flex", fontSize: 82, lineHeight: 1.04, fontStyle: "italic", color: "#e8431c" }}>
              AI-generated?
            </div>
            <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#4a4435", fontFamily: "sans-serif" }}>
              Paste a link. Get a brutally honest 0–100 slop score.
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              width: 220,
              height: 220,
              borderRadius: "50%",
              border: "8px solid #e8431c",
            }}
          >
            <div style={{ display: "flex", fontSize: 120, color: "#e8431c" }}>?</div>
            <div style={{ display: "flex", fontSize: 22, letterSpacing: 3, color: "#4a4435", fontFamily: "monospace" }}>
              / 100
            </div>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#17140f",
            fontFamily: "monospace",
            letterSpacing: 2,
          }}
        >
          is-this-ai-slop.davidcjw.com
        </div>
      </div>
    ),
    { ...size }
  );
}
