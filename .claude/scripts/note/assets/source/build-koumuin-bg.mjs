#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ASSET_DIR = path.resolve(__dirname, "..");

// 引数対応 (デフォルト無指定 = 記事共通背景 koumuin-cover-bg.png と完全同一を保つ)。
//   --seed <n>   乱数シード (構図が変わる)。既定 20260709 = 記事背景。
//   --out <path> PNG 出力先。既定 assets/koumuin-cover-bg.png
//   --src <path> 中間 SVG 出力先。既定 source/koumuin-cover-bg.svg
//   --hue <deg>  出力全体の色相回転 (別背景を作る)。既定 0
//   --sat <mult> 彩度倍率。既定 1
// マガジン別背景の例 (flagship 感の色相ずらし):
//   node build-koumuin-bg.mjs --seed 20260731 --hue 58 --sat 1.12 \
//     --out ../koumuin-magazine-bg.png --src ./koumuin-magazine-bg.svg
function parseArgs() {
  const a = process.argv.slice(2);
  const get = (k, d) => {
    const i = a.indexOf(k);
    return i >= 0 ? a[i + 1] : d;
  };
  return {
    seed: Number(get("--seed", 20260709)),
    outPng: path.resolve(get("--out", path.join(ASSET_DIR, "koumuin-cover-bg.png"))),
    outSvg: path.resolve(get("--src", path.join(__dirname, "koumuin-cover-bg.svg"))),
    hue: Number(get("--hue", 0)),
    sat: Number(get("--sat", 1)),
  };
}
const ARGS = parseArgs();

const W = 2560;
const H = 1340;

function mulberry32(seed) {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rnd = mulberry32(ARGS.seed);
const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
const f = (n) => Number(n).toFixed(2).replace(/\.00$/, "");

function circles(count, region, palette, opacityRange, radiusRange) {
  const out = [];
  for (let i = 0; i < count; i++) {
    const x = region.x + rnd() * region.w;
    const y = region.y + rnd() * region.h;
    const r = radiusRange[0] + rnd() * (radiusRange[1] - radiusRange[0]);
    const opacity = opacityRange[0] + rnd() * (opacityRange[1] - opacityRange[0]);
    out.push(
      `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${pick(palette)}" opacity="${f(opacity)}"/>`,
    );
  }
  return out.join("\n");
}

function circuit(region, rows, cols, color, opacity) {
  const dx = region.w / cols;
  const dy = region.h / rows;
  const out = [];
  for (let r = 0; r <= rows; r++) {
    for (let c = 0; c <= cols; c++) {
      if (rnd() < 0.38) continue;
      const x = region.x + c * dx + (rnd() - 0.5) * 16;
      const y = region.y + r * dy + (rnd() - 0.5) * 16;
      const dir = rnd() < 0.55 ? "h" : "v";
      const len = dir === "h" ? dx * (0.7 + rnd() * 1.35) : dy * (0.7 + rnd() * 1.35);
      const x2 = dir === "h" ? Math.min(region.x + region.w, x + len) : x;
      const y2 = dir === "v" ? Math.min(region.y + region.h, y + len) : y;
      out.push(
        `<path d="M${f(x)} ${f(y)} L${f(x2)} ${f(y2)}" fill="none" stroke="${color}" stroke-width="${f(1 + rnd() * 1.5)}" opacity="${f(opacity * (0.45 + rnd() * 0.65))}"/>`,
      );
      if (rnd() < 0.32) {
        out.push(
          `<circle cx="${f(x)}" cy="${f(y)}" r="${f(2.4 + rnd() * 3.4)}" fill="${color}" opacity="${f(opacity * (0.7 + rnd() * 0.9))}"/>`,
        );
      }
    }
  }
  return out.join("\n");
}

function dataRibbons() {
  const out = [];
  const colors = ["#6ea8d6", "#8fb7c7", "#667d99"];
  for (let i = 0; i < 18; i++) {
    const y = -180 + i * 86 + rnd() * 28;
    const x0 = -240 + rnd() * 80;
    const x1 = W + 220;
    const c1x = 620 + rnd() * 420;
    const c1y = y + 160 + rnd() * 170;
    const c2x = 1540 + rnd() * 420;
    const c2y = y + 10 + rnd() * 210;
    const opacity = 0.025 + rnd() * 0.04;
    out.push(
      `<path d="M${f(x0)} ${f(y)} C${f(c1x)} ${f(c1y)} ${f(c2x)} ${f(c2y)} ${f(x1)} ${f(y + 500)}" fill="none" stroke="${pick(colors)}" stroke-width="${f(1.1 + rnd() * 2.2)}" opacity="${f(opacity)}"/>`,
    );
  }
  return out.join("\n");
}

function buildingMotif() {
  const cols = Array.from({ length: 9 }, (_, i) => {
    const x = 150 + i * 44;
    const h = 178 + (i % 3) * 16;
    return `<rect x="${x}" y="${304 - h}" width="20" height="${h}" fill="#7f95b1" opacity="0.14"/>`;
  }).join("\n");

  const steps = Array.from({ length: 4 }, (_, i) => {
    return `<rect x="${102 + i * 34}" y="${330 + i * 20}" width="${482 - i * 68}" height="12" fill="#9db4cf" opacity="${f(0.15 - i * 0.018)}"/>`;
  }).join("\n");

  return `<g transform="translate(90 64) skewX(-8)" filter="url(#softGlow)">
    <path d="M72 228 L302 84 L536 228 Z" fill="#91a6c3" opacity="0.12"/>
    <path d="M96 228 H512" stroke="#b7c8dd" stroke-width="3" opacity="0.18"/>
    ${cols}
    ${steps}
    <path d="M20 430 H610" stroke="#7ea2c4" stroke-width="2" opacity="0.12"/>
  </g>`;
}

function documentMotif() {
  const pages = [];
  for (let i = 0; i < 5; i++) {
    const x = 88 + i * 48;
    const y = 824 + i * 18;
    pages.push(`<g transform="rotate(-10 ${x + 86} ${y + 112})">
      <rect x="${x}" y="${y}" width="188" height="244" rx="10" fill="#d8e4f0" opacity="${f(0.045 + i * 0.012)}"/>
      <rect x="${x + 30}" y="${y + 42}" width="116" height="5" rx="2.5" fill="#9db4cf" opacity="0.16"/>
      <rect x="${x + 30}" y="${y + 78}" width="134" height="4" rx="2" fill="#9db4cf" opacity="0.12"/>
      <rect x="${x + 30}" y="${y + 106}" width="98" height="4" rx="2" fill="#9db4cf" opacity="0.11"/>
    </g>`);
  }
  return `<g filter="url(#softGlow)">${pages.join("\n")}</g>`;
}

function terminalMotif() {
  const bars = Array.from({ length: 13 }, (_, i) => {
    const w = 86 + rnd() * 188;
    const x = 2048 + (i % 3) * 18;
    const y = 96 + i * 32;
    return `<rect x="${f(x)}" y="${y}" width="${f(w)}" height="5" rx="2.5" fill="#8eb8cf" opacity="${f(0.06 + rnd() * 0.06)}"/>`;
  }).join("\n");
  return `<g transform="rotate(5 2220 270)" filter="url(#softGlow)">
    <rect x="1958" y="54" width="444" height="468" rx="22" fill="#07101d" opacity="0.58" stroke="#91b7cf" stroke-opacity="0.12"/>
    <circle cx="2000" cy="94" r="8" fill="#8fb7c7" opacity="0.14"/>
    <circle cx="2028" cy="94" r="8" fill="#8fb7c7" opacity="0.11"/>
    <circle cx="2056" cy="94" r="8" fill="#8fb7c7" opacity="0.09"/>
    <path d="M1998 176 L2042 204 L1998 232" fill="none" stroke="#a9c3d9" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.12"/>
    ${bars}
  </g>`;
}

function japanLikeCoast() {
  const dots = [
    [2100, 782, 8], [2124, 806, 5], [2148, 836, 7], [2166, 870, 11],
    [2198, 902, 7], [2224, 940, 10], [2258, 976, 8], [2290, 1012, 12],
    [2312, 1060, 7], [2348, 1096, 10], [2388, 1134, 8], [2420, 1178, 12],
    [2058, 1072, 6], [2018, 1118, 9], [1986, 1160, 6], [1948, 1202, 9],
  ];
  const links = dots
    .slice(0, -1)
    .map(([x, y], i) => {
      const [x2, y2] = dots[i + 1];
      return `<path d="M${x} ${y} L${x2} ${y2}" stroke="#78a7c0" stroke-width="1.5" opacity="0.11"/>`;
    })
    .join("\n");
  const nodes = dots
    .map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#a9c3d9" opacity="0.12"/>`)
    .join("\n");
  return `<g filter="url(#softGlow)">${links}\n${nodes}</g>`;
}

function svg() {
  const cool = ["#5d7f9b", "#7fa6bd", "#9bb6ca", "#c1d2df"];
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="base" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#050813"/>
      <stop offset="35%" stop-color="#08111f"/>
      <stop offset="68%" stop-color="#0b1321"/>
      <stop offset="100%" stop-color="#02050b"/>
    </linearGradient>
    <radialGradient id="topLeft" cx="10%" cy="10%" r="52%">
      <stop offset="0%" stop-color="#2c5f83" stop-opacity="0.46"/>
      <stop offset="48%" stop-color="#16324c" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#050813" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="bottomRight" cx="91%" cy="91%" r="46%">
      <stop offset="0%" stop-color="#587086" stop-opacity="0.38"/>
      <stop offset="58%" stop-color="#1a2d42" stop-opacity="0.16"/>
      <stop offset="100%" stop-color="#02050b" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="edgeHalo" cx="50%" cy="50%" r="70%">
      <stop offset="0%" stop-color="#0b1321" stop-opacity="0"/>
      <stop offset="64%" stop-color="#0b1321" stop-opacity="0.02"/>
      <stop offset="100%" stop-color="#b4c8d8" stop-opacity="0.06"/>
    </radialGradient>
    <linearGradient id="flowShade" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#9dc3d5" stop-opacity="0.11"/>
      <stop offset="45%" stop-color="#9dc3d5" stop-opacity="0"/>
      <stop offset="100%" stop-color="#8a9fb7" stop-opacity="0.08"/>
    </linearGradient>
    <pattern id="grid" width="72" height="72" patternUnits="userSpaceOnUse">
      <path d="M72 0H0V72" fill="none" stroke="#a8bed4" stroke-opacity="0.035" stroke-width="1"/>
      <path d="M36 0V72 M0 36H72" fill="none" stroke="#a8bed4" stroke-opacity="0.017" stroke-width="1"/>
    </pattern>
    <pattern id="microGrid" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1" fill="#9bb6ca" opacity="0.055"/>
    </pattern>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="0.25" result="b"/>
      <feMerge>
        <feMergeNode in="b"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <filter id="blur28" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="28"/>
    </filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#base)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <rect width="${W}" height="${H}" fill="url(#microGrid)" opacity="0.55"/>
  <rect width="${W}" height="${H}" fill="url(#topLeft)"/>
  <rect width="${W}" height="${H}" fill="url(#bottomRight)"/>

  <g transform="rotate(-9 1280 670)" opacity="0.75">
    ${dataRibbons()}
  </g>

  <path d="M-120 1180 C520 910 1040 1010 1680 792 C2028 672 2300 484 2680 544 L2680 1450 L-120 1450 Z" fill="url(#flowShade)" opacity="0.46"/>
  <path d="M-180 204 C444 372 722 188 1198 278 C1704 372 2028 210 2740 326" fill="none" stroke="#a9c3d9" stroke-width="2" opacity="0.055"/>

  ${buildingMotif()}
  ${terminalMotif()}
  ${documentMotif()}
  ${japanLikeCoast()}

  <g opacity="0.95">
    ${circuit({ x: 46, y: 42, w: 760, h: 500 }, 7, 10, "#8bbbd1", 0.17)}
    ${circuit({ x: 1870, y: 760, w: 640, h: 520 }, 8, 8, "#91a6c3", 0.15)}
    ${circuit({ x: 34, y: 1076, w: 760, h: 230 }, 4, 11, "#768da8", 0.12)}
    ${circuit({ x: 1788, y: 38, w: 720, h: 238 }, 4, 9, "#7fa6bd", 0.11)}
  </g>

  <g filter="url(#softGlow)">
    ${circles(190, { x: 0, y: 0, w: 900, h: 520 }, cool, [0.035, 0.2], [1.2, 4.8])}
    ${circles(210, { x: 1740, y: 720, w: 820, h: 620 }, cool, [0.035, 0.18], [1.2, 5.8])}
    ${circles(90, { x: 0, y: 980, w: 820, h: 360 }, cool, [0.025, 0.12], [1.1, 3.8])}
    ${circles(72, { x: 1860, y: 0, w: 700, h: 260 }, cool, [0.025, 0.11], [1, 3.5])}
  </g>

  <ellipse cx="272" cy="198" rx="330" ry="150" fill="#9bc4da" opacity="0.08" filter="url(#blur28)"/>
  <ellipse cx="2288" cy="1122" rx="390" ry="170" fill="#90a8bd" opacity="0.085" filter="url(#blur28)"/>
  <ellipse cx="2264" cy="224" rx="270" ry="118" fill="#6f91aa" opacity="0.045" filter="url(#blur28)"/>

  <!-- Keep the title box zone calm and low contrast. -->
  <rect x="300" y="240" width="1960" height="860" rx="34" fill="#030712" opacity="0.48"/>
  <rect x="360" y="300" width="1840" height="740" rx="28" fill="#050915" opacity="0.38"/>
  <rect width="${W}" height="${H}" fill="url(#edgeHalo)"/>
  <rect width="${W}" height="${H}" fill="#02050b" opacity="0.08"/>
</svg>`;
}

const source = svg();
await fs.mkdir(path.dirname(ARGS.outSvg), { recursive: true });
await fs.mkdir(path.dirname(ARGS.outPng), { recursive: true });
await fs.writeFile(ARGS.outSvg, source);

let img = sharp(Buffer.from(source)).flatten({ background: "#050813" });
if (ARGS.hue !== 0 || ARGS.sat !== 1) {
  img = img.modulate({ hue: ARGS.hue, saturation: ARGS.sat });
}
await img
  .toColourspace("srgb")
  .png({ compressionLevel: 9, adaptiveFiltering: true })
  .toFile(ARGS.outPng);

const meta = await sharp(ARGS.outPng).metadata();
console.log(JSON.stringify({
  output: path.relative(process.cwd(), ARGS.outPng),
  source: path.relative(process.cwd(), ARGS.outSvg),
  width: meta.width,
  height: meta.height,
  channels: meta.channels,
  space: meta.space,
  hasAlpha: meta.hasAlpha,
}, null, 2));
