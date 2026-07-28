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
          background: "#4f46e5",
          borderRadius: 40,
        }}
      >
        <span style={{ fontSize: 110, fontWeight: 700, color: "white", fontFamily: "sans-serif" }}>
          C
        </span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
