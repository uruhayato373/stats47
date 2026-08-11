#!/usr/bin/env -S npx tsx
/**
 * 書籍カバー背景を **実際の日本地図 + 実データ** から決定的に生成する。
 *
 * 生成 AI が描く「列島っぽい塊」は形が日本ではなく、統計の本の表紙としては不正確
 * (2026-08-12 オーナー指摘)。ここでは国土数値情報由来の topojson を投影し、書籍の中核指標を
 * コロプレスとして塗る。**タイトルが文字どおり正しい絵**になり、再現性もある (AI の揺らぎが無い)。
 *
 * - 形状: `src/maps/prefecture-geometry.ts` の `loadPrefectureGeometry` (topojson → Mercator 投影)
 * - 値  : R2 SSOT `app/ranking/<key>/values.json` (捏造しない・取得できなければ失敗する)
 * - 文字: **一切描かない**。書名・著者は satori が実テキストで重ねる
 *   (家ルール `.claude/rules/ogp-image-standards.md` §5)
 *
 * Usage:
 *   npx tsx packages/product-factory/scripts/build-cover-background.mts \
 *     --book K-S1-01 --metric disposable-income-after-rent [--year 2024] [--out <path>]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as d3chromatic from "d3-scale-chromatic";
import sharp from "sharp";
import {
  JAPAN_CLIP,
  loadPrefectureGeometry,
  type PrefectureShape,
} from "../src/maps/prefecture-geometry";

const HERE = dirname(fileURLToPath(import.meta.url));
const PF_ROOT = resolve(HERE, "..");
const R2 = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";

/** カバーの実寸 (cover.ts の W/H と一致させる)。 */
const W = 1600;
const H = 2560;
/** 地図を置く帯 (上側はタイトル用に空ける)。 */
const MAP_TOP_RATIO = 0.34;

/**
 * 地 (海) のプリセット。**多数出版する前提では、地はシリーズの顔・地図の配色は指標で変える**
 * のが拡張しやすい (地が毎回変わると 30 冊並べたときに一貫性が無くなる)。
 */
const SEA_PRESETS: Record<string, { top: string; bottom: string }> = {
  /** ほぼ黒。地図の配色が何色でも受ける中立なキャンバス。 */
  black: { top: "#040a14", bottom: "#0a1830" },
  /** S1 シリーズ基調色 (cover.ts の SERIES_COLOR と同系)。 */
  navy: { top: "#0b1c33", bottom: "#123156" },
  /** 明るい紙。ストアの白地に溶ける懸念があるので実測で判断する。 */
  paper: { top: "#f3ece0", bottom: "#e2d8c6" },
  /** 中間のスレート。暗すぎず白でもない折衷。 */
  slate: { top: "#1c2733", bottom: "#2b3a4a" },
};
const RAMP = [
  { t: 0.0, c: [18, 42, 74] },
  { t: 0.35, c: [26, 96, 158] },
  { t: 0.7, c: [58, 176, 226] },
  { t: 1.0, c: [186, 240, 255] },
] as const;

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** 既定 (--scheme 未指定) の自前ランプ。夜景に寄せた濃紺→シアン。 */
function defaultRamp(t: number): string {
  const x = Math.max(0, Math.min(1, t));
  for (let i = 0; i < RAMP.length - 1; i++) {
    const a = RAMP[i];
    const b = RAMP[i + 1];
    if (x <= b.t) {
      const k = (x - a.t) / (b.t - a.t || 1);
      const ch = a.c.map((v, j) => Math.round(v + (b.c[j] - v) * k));
      return `rgb(${ch[0]},${ch[1]},${ch[2]})`;
    }
  }
  const last = RAMP[RAMP.length - 1].c;
  return `rgb(${last[0]},${last[1]},${last[2]})`;
}

/**
 * 配色を解決する。`--scheme Viridis` のように d3-scale-chromatic の短縮名を渡すと
 * カタログ (`packages/types/src/color-scheme.ts`) と同じ配色になる。
 * 暗い地の上に置くので、暗端が沈みすぎないよう下限 `tMin` から使う。
 */
function resolveRamp(scheme: string | undefined, tMin: number): (t: number) => string {
  if (!scheme) return defaultRamp;
  const fn = (d3chromatic as Record<string, unknown>)[`interpolate${scheme}`];
  if (typeof fn !== "function") {
    throw new Error(`未知の配色: ${scheme} (d3-scale-chromatic の interpolate<Name>)`);
  }
  const interp = fn as (t: number) => string;
  return (t: number) => interp(tMin + Math.max(0, Math.min(1, t)) * (1 - tMin));
}

interface ValueRow {
  areaCode: string;
  value: number;
  areaName: string;
  unit?: string;
}

/** SSOT から観測値を取る。取れなければ **失敗させる** (適当な値で描かない)。 */
async function fetchValues(
  metric: string,
  year?: string,
): Promise<{ rows: ValueRow[]; year: string; unit: string }> {
  const url = `${R2}/app/ranking/${metric}/values.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`SSOT を取得できない: ${url} (HTTP ${res.status})`);
  const json = (await res.json()) as {
    partitions?: Array<{ yearCode: string; values: ValueRow[] }>;
  };
  const parts = json.partitions ?? [];
  if (parts.length === 0) throw new Error(`partitions が空: ${metric}`);
  const picked = year
    ? parts.find((p) => p.yearCode === year)
    : [...parts].sort((a, b) => Number(b.yearCode) - Number(a.yearCode))[0];
  if (!picked) throw new Error(`年 ${year} が ${metric} に無い`);
  const rows = picked.values.filter((r) => Number.isFinite(r.value));
  if (rows.length < 40) throw new Error(`観測値が ${rows.length} 件しかない (47 県前提)`);
  return { rows, year: picked.yearCode, unit: rows[0]?.unit ?? "" };
}

function ringsToPath(shape: PrefectureShape, sx: number, sy: number, ox: number, oy: number): string {
  return shape.rings
    .map((ring) => {
      if (ring.length < 3) return "";
      const pts = ring.map((p) => `${(p.x * sx + ox).toFixed(1)},${(p.y * sy + oy).toFixed(1)}`);
      return `M${pts.join("L")}Z`;
    })
    .filter(Boolean)
    .join("");
}

async function main(): Promise<void> {
  const book = arg("book");
  const metric = arg("metric");
  if (!book || !metric) throw new Error("--book と --metric は必須");
  const out =
    arg("out") ?? resolve(PF_ROOT, "src/channels/kindle/assets/cover-backgrounds", `${book}.jpg`);

  const seaKey = arg("sea") ?? "black";
  const sea = SEA_PRESETS[seaKey];
  if (!sea) throw new Error(`未知の地: ${seaKey} (${Object.keys(SEA_PRESETS).join("/")})`);
  const scheme = arg("scheme");
  // 強調する県 (2桁コードのカンマ区切り)。未指定なら全県を通常表示。
  const highlightArg = arg("highlight");
  const highlight = highlightArg
    ? new Set(
        highlightArg.split(",").map((s) => {
          const c = s.trim().padStart(2, "0");
          if (!/^(0[1-9]|[1-3]\d|4[0-7])$/.test(c)) throw new Error(`不正な県コード: ${s}`);
          return c;
        }),
      )
    : null;
  const tMin = Number(arg("t-min") ?? 0.18);
  const ramp = resolveRamp(scheme, tMin);
  const { rows, year, unit } = await fetchValues(metric, arg("year"));
  const byCode = new Map(rows.map((r) => [r.areaCode.slice(0, 2), r.value]));
  const values = rows.map((r) => r.value);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // 地図は本土 + 沖縄のみ (南鳥島等の外れ島で bbox が伸びるのを防ぐ)
  const geo = loadPrefectureGeometry(1000, JAPAN_CLIP);
  const mapBandH = H * (1 - MAP_TOP_RATIO);
  // 日本列島は右上がりに伸びるので、幅いっぱいに使いつつ帯の高さに収める
  const scale = Math.min((W * 1.02) / geo.width, mapBandH / geo.height);
  const drawW = geo.width * scale;
  const drawH = geo.height * scale;
  const ox = (W - drawW) / 2;
  const oy = H * MAP_TOP_RATIO + (mapBandH - drawH) / 2;

  const paths = geo.shapes
    .map((s) => {
      const pref2 = s.code5.slice(0, 2);
      const v = byCode.get(pref2);
      const t = v === undefined ? null : (v - min) / (max - min || 1);
      const fill = t === null ? "#12233c" : ramp(t);
      const d = ringsToPath(s, scale, scale, ox, oy);
      if (!d) return "";
      // --highlight: 指定県だけを残し他を沈める。地域別データブック (北海道 / 東北 / …) は
      // 同じ指標だと 8 冊の表紙が **同一バイト**になり読者が区別できない
      // (2026-08-12 に check-asset-policy の DUPLICATE_IMAGE が検出)。
      // 指標を書名と無関係に散らすのではなく、書名どおり「その地域」を強調する。
      const dim = highlight && !highlight.has(pref2);
      const opacity = dim ? ' opacity="0.16"' : "";
      return `<path d="${d}" fill="${fill}" stroke="#071426" stroke-width="1.2" stroke-linejoin="round"${opacity}/>`;
    })
    .filter(Boolean)
    .join("\n");

  const mapSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="none"/>
${paths}
</svg>`;

  const seaSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs><linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${sea.top}"/>
<stop offset="55%" stop-color="${sea.top}"/>
<stop offset="100%" stop-color="${sea.bottom}"/>
</linearGradient></defs>
<rect width="${W}" height="${H}" fill="url(#sea)"/></svg>`;

  const mapPng = await sharp(Buffer.from(mapSvg)).png().toBuffer();
  // 発光は SVG filter に頼らず sharp のぼかしで作る (レンダラ依存を避ける)。
  // 明るい地では screen 合成が白飛びして地図が消えるので、影として落とす。
  const isLightSea = seaKey === "paper";
  const glow = await sharp(mapPng).blur(isLightSea ? 14 : 26).png().toBuffer();
  const glowLayers = isLightSea
    ? [{ input: glow, blend: "multiply" as const }]
    : [{ input: glow, blend: "screen" as const }, { input: glow, blend: "screen" as const }];

  mkdirSync(dirname(out), { recursive: true });
  await sharp(Buffer.from(seaSvg))
    .composite([...glowLayers, { input: mapPng, blend: "over" }])
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toFile(out);

  console.log(`✅ ${out}`);
  console.log(`   地図: 実 topojson (${geo.shapes.length} 県) / 値: ${metric} ${year} / 配色: ${scheme ?? "既定(濃紺→シアン)"} / 地: ${seaKey}`);
  console.log(`   範囲: ${min.toLocaleString()}〜${max.toLocaleString()}${unit}`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
