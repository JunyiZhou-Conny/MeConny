import { readFile, writeFile } from 'node:fs/promises';
import { FloatType } from 'three';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

const [source, destination] = process.argv.slice(2);
if (!source || !destination || source === destination) throw new Error('Usage: node downsample-hdr.mjs source.hdr destination.hdr');
const input = await readFile(source);
const loader = new HDRLoader().setDataType(FloatType);
const original = loader.parse(input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength));
const width = original.width / 2;
const height = original.height / 2;
if (!Number.isInteger(width) || !Number.isInteger(height)) throw new Error('HDR dimensions must be even');
const pixels = new Float32Array(width * height * 4);
const chunks = [Buffer.from(`#?RADIANCE\nFORMAT=32-bit_rle_rgbe\n\n-Y ${height} +X ${width}\n`)];
const encodeChannel = (channel) => {
  const bytes = [];
  let i = 0;
  while (i < channel.length) {
    let run = 1;
    while (run < 127 && i + run < channel.length && channel[i + run] === channel[i]) run++;
    if (run >= 4) { bytes.push(128 + run, channel[i]); i += run; continue; }
    const start = i;
    i += run;
    while (i < channel.length && i - start < 128) {
      let next = 1;
      while (next < 4 && i + next < channel.length && channel[i + next] === channel[i]) next++;
      if (next >= 4) break;
      i += Math.min(next, 128 - (i - start));
    }
    bytes.push(i - start, ...channel.subarray(start, i));
  }
  return Buffer.from(bytes);
};
for (let y = 0; y < height; y++) {
  const channels = Array.from({ length: 4 }, () => new Uint8Array(width));
  for (let x = 0; x < width; x++) {
    const index = (y * width + x) * 4;
    for (let c = 0; c < 3; c++) {
      let total = 0;
      for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) total += original.data[((y * 2 + dy) * original.width + x * 2 + dx) * 4 + c];
      pixels[index + c] = total / 4;
    }
    const peak = Math.max(...pixels.subarray(index, index + 3));
    if (peak < 1e-32) continue;
    const exponent = Math.floor(Math.log2(peak)) + 1;
    const scale = 256 / 2 ** exponent;
    for (let c = 0; c < 3; c++) channels[c][x] = Math.min(255, Math.floor(pixels[index + c] * scale));
    channels[3][x] = exponent + 128;
  }
  chunks.push(Buffer.from([2, 2, width >> 8, width & 255]), ...channels.map(encodeChannel));
}
const output = Buffer.concat(chunks);
const decoded = loader.parse(output.buffer.slice(output.byteOffset, output.byteOffset + output.byteLength));
let total = 0, error = 0, peak = 0;
for (let i = 0; i < pixels.length; i++) if (i % 4 !== 3) {
  total += pixels[i]; error += Math.abs(decoded.data[i] - pixels[i]); peak = Math.max(peak, decoded.data[i]);
}
if (decoded.width !== width || decoded.height !== height || error / total > 0.015) throw new Error('HDR round-trip failed');
await writeFile(destination, output);
console.log(JSON.stringify({ width, height, sourceBytes: input.length, bytes: output.length, relativeLinearError: error / total, peakLinearIntensity: peak }));
