#!/usr/bin/env node

/**
 * note.com のプロフィール/マガジン用ブランドヘッダーを 1920x1006 PNG で生成する。
 * 文字は全表示面で残る中央 758x324 の安全領域へ限定する。
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(SCRIPT_DIR, "../../..");
const ASSET_DIR = join(SCRIPT_DIR, "assets/brand-headers");
const BACKGROUND = join(ASSET_DIR, "stats47-header-bg.png");
const OUTPUT_DIR = join(ASSET_DIR, "generated");
const WIDTH = 1920;
const HEIGHT = 1006;

const PALETTES = {
  "koumuin-gis": ["#0f766e", "#2dd4bf"],
  "s47-sports-culture": ["#7c3aed", "#c4b5fd"],
  "s47-fiscal": ["#b45309", "#fbbf24"],
  "s47-economy": ["#047857", "#6ee7b7"],
  "s47-population": ["#1d4ed8", "#60a5fa"],
  "s47-education": ["#be185d", "#f9a8d4"],
  "s47-health": ["#dc2626", "#fca5a5"],
  "s47-climate": ["#0369a1", "#7dd3fc"],
  "s47-agriculture": ["#4d7c0f", "#bef264"],
  "s47-safety": ["#c2410c", "#fdba74"],
  "s47-labor": ["#4338ca", "#a5b4fc"],
  "s47-tourism": ["#0f766e", "#5eead4"],
  "s47-industry": ["#475569", "#cbd5e1"],
  "s47-housing": ["#a21caf", "#e879f9"],
  "s47-infrastructure": ["#334155", "#94a3b8"],
  "s47-energy": ["#a16207", "#fde047"],
};

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function titleLines(name) {
  if (name.includes("｜")) {
    const [prefix, rest] = name.split("｜", 2);
    return [prefix, rest];
  }
  if (name === "自治体職員のための GIS 入門") return ["自治体職員のための", "GIS 入門"];
  const midpoint = Math.ceil([...name].length / 2);
  const characters = [...name];
  return [characters.slice(0, midpoint).join(""), characters.slice(midpoint).join("")];
}

function overlay({ lines, accent, accentSoft, eyebrow }) {
  const lineSize = (line) => {
    const units = [...line].reduce((sum, character) => {
      if (/\s/.test(character)) return sum + 0.35;
      if (/[\x00-\x7f]/.test(character)) return sum + 0.62;
      return sum + 1;
    }, 0);
    return Math.min(72, Math.floor(660 / Math.max(units, 1)));
  };
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}">
    <style>text { font-family: "Hiragino Sans", "Yu Gothic", "Noto Sans JP", sans-serif; }</style>
    <rect x="500" y="320" width="920" height="366" rx="34" fill="#03152f" fill-opacity="0.76" stroke="${accentSoft}" stroke-opacity="0.42" stroke-width="2"/>
    <rect x="500" y="320" width="12" height="366" rx="6" fill="${accent}"/>
    <text x="960" y="405" text-anchor="middle" font-size="22" font-weight="700" letter-spacing="4" fill="${accentSoft}">${escapeXml(eyebrow)}</text>
    <text x="960" y="505" text-anchor="middle" font-size="${lineSize(lines[0])}" font-weight="800" fill="#ffffff">${escapeXml(lines[0])}</text>
    <text x="960" y="590" text-anchor="middle" font-size="${lineSize(lines[1] || "")}" font-weight="800" fill="#ffffff">${escapeXml(lines[1] || "")}</text>
    <text x="960" y="646" text-anchor="middle" font-size="20" font-weight="600" letter-spacing="3" fill="#bfdbfe">stats47.jp</text>
  </svg>`);
}

async function render(filename, params) {
  const output = join(OUTPUT_DIR, filename);
  await sharp(BACKGROUND)
    .resize(WIDTH, HEIGHT, { fit: "cover", position: "centre" })
    .composite([{ input: overlay(params) }])
    .png({ compressionLevel: 9 })
    .toFile(output);
  const metadata = await sharp(output).metadata();
  if (metadata.width !== WIDTH || metadata.height !== HEIGHT) {
    throw new Error(`${filename}: size mismatch ${metadata.width}x${metadata.height}`);
  }
  return {
    file: filename,
    width: metadata.width,
    height: metadata.height,
    bytes: statSync(output).size,
    sha256: createHash("sha256").update(readFileSync(output)).digest("hex"),
  };
}

function catalog() {
  const raw = execFileSync(
    "npx",
    ["tsx", join(SCRIPT_DIR, "catalog/dump-magazines-json.ts")],
    { cwd: ROOT, encoding: "utf8" },
  );
  return JSON.parse(raw);
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });
  const outputs = [];
  outputs.push(await render("profile-header-1920x1006.png", {
    lines: ["統計で見る都道府県", "47 PREFECTURES × DATA"],
    accent: "#2563eb",
    accentSoft: "#7dd3fc",
    eyebrow: "PUBLIC DATA, CLEARLY VISUALIZED",
  }));

  const managed = new Set(Object.keys(PALETTES));
  for (const magazine of catalog().filter((item) => item.noteUrl && managed.has(item.key))) {
    const [accent, accentSoft] = PALETTES[magazine.key] || ["#2563eb", "#93c5fd"];
    outputs.push(await render(`magazine-${magazine.key}-1920x1006.png`, {
      lines: titleLines(magazine.name),
      accent,
      accentSoft,
      eyebrow: "47 PREFECTURES DATA MAGAZINE",
    }));
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: "stats47-header-bg.png (built-in image generation) + deterministic SVG typography",
    safeArea: { width: 758, height: 324, centered: true },
    outputs,
  };
  writeFileSync(join(OUTPUT_DIR, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`generated: ${outputs.length} files`);
  console.log(`output: ${OUTPUT_DIR}`);
}

await main();
