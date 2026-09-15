import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { tour } from "@/content/tour";

export const alt = "Conny Zhou — clinical AI, computational biology, and agent systems";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const poster = await readFile(join(process.cwd(), "public", tour.model.poster));
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#F2ECE2", color: "#1A1613" }}>
        <img
          src={`data:image/jpeg;base64,${poster.toString("base64")}`}
          width={1008}
          height={630}
          alt=""
          style={{ position: "absolute", left: -100, top: 0 }}
        />
        <div style={{ position: "absolute", top: 64, left: 610, right: 54, bottom: 62, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={{ fontSize: 21, color: "#6A6058", marginBottom: 25 }}>Junyi (Conny) Zhou</div>
          <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: "-0.045em", lineHeight: 1.05 }}>{tour.stops[0].title}</div>
          <div style={{ fontSize: 28, lineHeight: 1.4, marginTop: 28 }}>Clinical AI. Computational biology. Systems that keep running.</div>
          <div style={{ fontSize: 19, color: "#6A6058", marginTop: 42 }}>Harvard / Wyss · Boston, MA</div>
          <div style={{ fontSize: 20, marginTop: 15 }}>connyzhou.com</div>
        </div>
      </div>
    ),
    size,
  );
}
