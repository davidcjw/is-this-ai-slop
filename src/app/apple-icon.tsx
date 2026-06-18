import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// Apple touch icon — the brand mark: ink ring with a vermillion core on bone paper.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f3ede1",
        }}
      >
        <div
          style={{
            width: 116,
            height: 116,
            borderRadius: "50%",
            border: "14px solid #17140f",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: "50%",
              background: "#e8431c",
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
