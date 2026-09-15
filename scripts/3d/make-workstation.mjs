// Writes the Job Search workstation textures to public/3d/workstation/.
// Four square tool tiles on a transparent background, plus one laptop screen.
// The glyphs are generic drawings, not vendor logos; the wordmark names the
// tool. Rerun after an edit:
//
//     node scripts/3d/make-workstation.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "../../public/3d/workstation");

const ink = "#1A1613";
const cream = "#FAF6EF";
const muted = "#6A6058";
const sans =
  "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

const line = (width = 16, color = ink) =>
  `fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

const tiles = {
  cursor: {
    label: "Cursor",
    accent: "#E8492A",
    glyph: `
      <path d="M186 122 L186 318 L240 274 L272 342 L299 329 L270 262 L334 255 Z" fill="${ink}"/>
      <path d="M378 110 L390 138 L418 150 L390 162 L378 190 L366 162 L338 150 L366 138 Z" fill="#E8492A"/>`,
  },
  polar: {
    label: "Polar",
    accent: "#7A5CF5",
    glyph: `
      <rect x="112" y="104" width="288" height="216" rx="28" ${line()}/>
      <path d="M112 156 H400" ${line()}/>
      <circle cx="146" cy="130" r="9" fill="${muted}"/>
      <circle cx="174" cy="130" r="9" fill="${muted}"/>
      <circle cx="202" cy="130" r="9" fill="${muted}"/>
      <path d="M232 202 L302 240 L232 278 Z" fill="#7A5CF5"/>`,
  },
  github: {
    label: "GitHub",
    accent: "#1A1613",
    glyph: `
      <path d="M180 124 V320" ${line()}/>
      <path d="M180 216 C238 216 262 192 292 166" ${line()}/>
      <circle cx="180" cy="124" r="24" fill="${cream}" stroke="${ink}" stroke-width="16"/>
      <circle cx="180" cy="320" r="24" fill="${cream}" stroke="${ink}" stroke-width="16"/>
      <circle cx="310" cy="152" r="24" fill="${cream}" stroke="${ink}" stroke-width="16"/>
      <circle cx="180" cy="222" r="14" fill="${ink}"/>`,
  },
  sheets: {
    label: "Sheets",
    accent: "#1FB7A6",
    glyph: `
      <rect x="120" y="104" width="272" height="216" rx="24" ${line()}/>
      <path d="M120 162 H392 M120 226 H392 M210 104 V320 M302 104 V320" ${line(13)}/>
      <path d="M320 254 l20 22 l38 -48" ${line(20, "#1FB7A6")}/>`,
  },
};

const tile = ({ label, accent, glyph }) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="30" y="30" width="452" height="452" rx="78" fill="${cream}"/>
  <rect x="38" y="38" width="436" height="436" rx="70" fill="none" stroke="${ink}" stroke-opacity="0.16" stroke-width="7"/>
  ${glyph.trim()}
  <text x="256" y="408" text-anchor="middle" font-family="${sans}" font-size="62" font-weight="600" fill="${ink}">${label}</text>
  <rect x="196" y="432" width="120" height="12" rx="6" fill="${accent}"/>
</svg>
`;

// The laptop lid. Four code rows, a caret, and a status strip, so the screen
// reads as a working editor at 3 percent of the frame.
const row = (y, width, color, opacity = 1) =>
  `<rect x="150" y="${y}" width="${width}" height="18" rx="9" fill="${color}" fill-opacity="${opacity}"/>`;

const screen = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400">
  <rect width="640" height="400" fill="#221D19"/>
  <rect x="0" y="0" width="118" height="400" fill="#1A1613"/>
  ${[80, 122, 164, 206, 248].map((y) => `<rect x="26" y="${y}" width="${y === 164 ? 68 : 52}" height="14" rx="7" fill="${cream}" fill-opacity="${y === 164 ? 0.55 : 0.2}"/>`).join("\n  ")}
  <rect x="0" y="352" width="640" height="48" fill="#1A1613"/>
  <circle cx="34" cy="376" r="9" fill="#1FB7A6"/>
  <rect x="58" y="369" width="96" height="14" rx="7" fill="${cream}" fill-opacity="0.3"/>
  ${row(72, 300, cream, 0.82)}
  ${row(114, 214, "#F2A93B", 0.85)}
  ${row(156, 356, cream, 0.5)}
  ${row(198, 262, "#7A5CF5", 0.85)}
  ${row(240, 180, cream, 0.5)}
  ${row(282, 190, cream, 0.62)}
  <rect x="352" y="278" width="20" height="26" rx="4" fill="#E8492A"/>
</svg>
`;

mkdirSync(outDir, { recursive: true });
for (const [id, def] of Object.entries(tiles)) {
  writeFileSync(join(outDir, `${id}.svg`), tile(def));
}
writeFileSync(join(outDir, "screen.svg"), screen);
console.log(`wrote ${Object.keys(tiles).length + 1} textures to ${outDir}`);
