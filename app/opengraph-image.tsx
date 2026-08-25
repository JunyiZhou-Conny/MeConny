import { ImageResponse } from "next/og";
import { site } from "@/content/site";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#071318",
          color: "#e6eef0",
          padding: "72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 16 }}>
          <span style={{ fontSize: 48, color: "#5ec8b8" }}>{site.identity.seal}</span>
          <span style={{ fontSize: 22, letterSpacing: "0.18em", color: "#8a9ea3" }}>
            MECONNY
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, lineHeight: 1.05, maxWidth: 960 }}>
            {site.identity.name}
          </div>
          <div style={{ fontSize: 28, color: "#8a9ea3", maxWidth: 880 }}>
            {site.identity.oneLiner}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
