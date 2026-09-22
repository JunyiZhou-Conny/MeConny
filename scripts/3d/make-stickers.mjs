// Writes the placeholder sticker set for the /3d tour to public/3d/stickers/.
// Each sticker is a 512 by 512 SVG: a colored disc, a white die-cut border,
// and one flat glyph. Add an entry to `stickers` and rerun:
//
//     node scripts/3d/make-stickers.mjs

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const outDir = join(dirname(fileURLToPath(import.meta.url)), "../../public/3d/stickers");

const ink = "#1A1613";
const cream = "#FAF6EF";

const stroke = (width = 30) =>
  `fill="none" stroke="${cream}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"`;

const stickers = {
  coffee: {
    fill: "#F2A93B",
    glyph: `
      <path d="M152 216h188v96a72 72 0 0 1-72 72h-44a72 72 0 0 1-72-72z" ${stroke()}/>
      <path d="M340 236h24a40 40 0 0 1 0 80h-24" ${stroke()}/>
      <path d="M210 130c-14 18-14 34 0 52M256 118c-14 18-14 34 0 52M302 130c-14 18-14 34 0 52" ${stroke()}/>`,
  },
  camera: {
    fill: "#7A5CF5",
    glyph: `
      <rect x="120" y="180" width="272" height="188" rx="30" ${stroke()}/>
      <path d="M200 180l24-44h64l24 44" ${stroke()}/>
      <circle cx="256" cy="274" r="54" ${stroke()}/>
      <circle cx="350" cy="222" r="10" fill="${cream}"/>`,
  },
  bike: {
    fill: "#1FB7A6",
    glyph: `
      <circle cx="152" cy="330" r="66" ${stroke()}/>
      <circle cx="360" cy="330" r="66" ${stroke()}/>
      <path d="M152 330l70-130h100l38 130M222 200l-40-46h48M322 200l-44-70h60" ${stroke()}/>
      <path d="M222 200l38 130" ${stroke()}/>`,
  },
  headphones: {
    fill: "#FF6B5B",
    glyph: `
      <path d="M124 320v-56a132 132 0 0 1 264 0v56" ${stroke()}/>
      <rect x="104" y="284" width="70" height="108" rx="24" fill="${cream}"/>
      <rect x="338" y="284" width="70" height="108" rx="24" fill="${cream}"/>`,
  },
  dna: {
    fill: "#1FB7A6",
    glyph: `
      <path d="M180 120c0 68 152 68 152 136s-152 68-152 136" ${stroke()}/>
      <path d="M332 120c0 68-152 68-152 136s152 68 152 136" ${stroke()}/>
      <path d="M196 170h120M186 224h140M186 288h140M196 342h120" ${stroke(22)}/>`,
  },
  chip: {
    fill: "#14275A",
    glyph: `
      <rect x="156" y="156" width="200" height="200" rx="26" ${stroke()}/>
      <rect x="214" y="214" width="84" height="84" rx="14" fill="${cream}"/>
      <path d="M200 156v-52M256 156v-52M312 156v-52M200 356v52M256 356v52M312 356v52M156 200h-52M156 256h-52M156 312h-52M356 200h52M356 256h52M356 312h52" ${stroke(22)}/>`,
  },
  pulse: {
    fill: "#FF6B5B",
    glyph: `
      <path d="M256 392L124 262a74 74 0 0 1 104-104l28 28 28-28a74 74 0 0 1 104 104z" ${stroke()}/>
      <path d="M150 270h56l26-52 36 104 30-72 16 20h52" stroke="${ink}" stroke-width="22" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  hub: {
    fill: ink,
    glyph: `
      <rect x="108" y="150" width="296" height="212" rx="28" fill="#2A2420" stroke="${cream}" stroke-width="22"/>
      <circle cx="150" cy="188" r="11" fill="#FF6B5B"/>
      <circle cx="184" cy="188" r="11" fill="#F2A93B"/>
      <circle cx="218" cy="188" r="11" fill="#1FB7A6"/>
      <text x="142" y="292" font-family="ui-monospace, Menlo, Consolas, monospace" font-size="54" font-weight="700" fill="${cream}">$ ./hub</text>`,
  },
};

const svg = ({ fill, glyph }) => `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <circle cx="256" cy="256" r="236" fill="${cream}"/>
  <circle cx="256" cy="256" r="206" fill="${fill}"/>
  ${glyph.trim()}
</svg>
`;

mkdirSync(outDir, { recursive: true });
for (const [id, def] of Object.entries(stickers)) {
  writeFileSync(join(outDir, `${id}.svg`), svg(def));
}
console.log(`wrote ${Object.keys(stickers).length} stickers to ${outDir}`);
