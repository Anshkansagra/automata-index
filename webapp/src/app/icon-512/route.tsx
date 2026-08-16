import { ImageResponse } from "next/og";

export const runtime = "edge";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 55%, #ec4899 100%)",
          borderRadius: 106,
        }}
      >
        <span style={{ fontSize: 290, fontWeight: 700, color: "white", fontFamily: "sans-serif" }}>
          C
        </span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
