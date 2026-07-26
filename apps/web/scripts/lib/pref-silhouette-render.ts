/**
 * 都道府県シルエットカード レンダラー。
 *
 * 参照デザイン: 新聞系ニュースサイトの県カード (淡青の海 + ドットテクスチャ、
 * 周辺県 = ハーフトーンの水色、対象県 = ソリッド + フチ、県名ピル)。
 *
 * パイプライン (環境非依存・決定的):
 *   1. apps/remotion/public/prefecture.topojson → d3-geo (Mercator) で
 *      「テキストなし地図 SVG」を組む (パターン fill は librsvg が解釈)
 *   2. sharp で PNG 化 → data URI
 *   3. satori で 県名ピル + ブランド行 を合成 (Noto Sans JP TTF がグリフをパス化
 *      するため CI ubuntu に日本語フォントが無くても豆腐にならない)
 *   4. sharp で最終 PNG
 *
 * 県名ピルは候補 8 アンカーを「陸地との重なり面積」でスコアリングして自動配置
 * (対象県は重み 4 倍、ブランド行の帯は回避)。地図と重ならない。
 *
 * トークン SSOT: ../data/pref-silhouette-tokens.ts
 * 正典: .claude/rules/ogp-image-standards.md §5
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";

import { geoMercator, geoPath } from "d3-geo";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";
import { createElement as h } from "react";
import satori from "satori";
import sharp from "sharp";
import { feature } from "topojson-client";
import type { Topology, GeometryCollection } from "topojson-specification";

import {
  PREF_CARD_BRAND_TEXT,
  PREF_CARD_RATIOS,
  PREF_CARD_THEMES,
  type PrefCardRatioKey,
  type PrefCardThemeKey,
} from "../data/pref-silhouette-tokens";

import type { SatoriFont } from "./satori-image-render";

// ─── topojson ロード (module cache) ───

interface PrefProps {
  N03_007: string; // 2桁県コード "01".."47"
  N03_001: string; // 県名
}

type PrefFeature = Feature<Polygon | MultiPolygon, PrefProps>;

let prefFeaturesCache: PrefFeature[] | null = null;

function loadPrefFeatures(projectRoot: string): PrefFeature[] {
  if (prefFeaturesCache) return prefFeaturesCache;
  const raw = JSON.parse(
    readFileSync(join(projectRoot, "apps/remotion/public/prefecture.topojson"), "utf8"),
  ) as Topology<{ pref: GeometryCollection<PrefProps> }>;
  const fc = feature(raw, raw.objects.pref);
  prefFeaturesCache = fc.features as PrefFeature[];
  return prefFeaturesCache;
}

/** 47 都道府県の 2 桁コード一覧 ("01".."47")。 */
export function listPrefCodes(projectRoot: string): string[] {
  return loadPrefFeatures(projectRoot)
    .map((f) => f.properties.N03_007)
    .sort();
}

export function prefNameOf(projectRoot: string, code2: string): string | null {
  return (
    loadPrefFeatures(projectRoot).find((f) => f.properties.N03_007 === code2)?.properties
      .N03_001 ?? null
  );
}

// ─── フレーミング (対象県の主要部 = 最大ポリゴン) ───

/** Feature の各ポリゴンを個別 Polygon Feature に分解する。 */
function polygonsOf(f: PrefFeature): Feature<Polygon>[] {
  if (f.geometry.type === "Polygon") {
    return [{ type: "Feature", properties: {}, geometry: f.geometry }];
  }
  return f.geometry.coordinates.map((coords) => ({
    type: "Feature",
    properties: {},
    geometry: { type: "Polygon", coordinates: coords },
  }));
}

const D2R = Math.PI / 180;
function mercXY([lon, lat]: Position): [number, number] {
  return [lon * D2R, -Math.log(Math.tan(Math.PI / 4 + (lat * D2R) / 2))];
}

/** 外輪の Mercator bbox 面積 (投影不要の軽量比較用)。 */
function mercRingArea(ring: Position[]): number {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const p of ring) {
    const [x, y] = mercXY(p);
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return (x1 - x0) * (y1 - y0);
}

/**
 * 対象県の「主要部」= bbox 面積最大のポリゴン。
 * 東京 (小笠原)・鹿児島 (南西諸島) の遠隔離島でフレームが引き伸ばされるのを防ぐ。
 */
function mainPolygonOf(f: PrefFeature): Feature<Polygon> {
  const polys = polygonsOf(f);
  let best = polys[0];
  let bestArea = -1;
  for (const p of polys) {
    const area = mercRingArea(p.geometry.coordinates[0]);
    if (area > bestArea) {
      bestArea = area;
      best = p;
    }
  }
  return best;
}

// ─── 県名ピル自動配置 ───

interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

function rectOverlap(a: Rect, b: Rect): number {
  const w = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0);
  const hh = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0);
  return w > 0 && hh > 0 ? w * hh : 0;
}

/**
 * 候補 8 アンカー (四隅 + 上下左右中央) を陸地重なり面積でスコアリング。
 * 対象県は重み 4 倍。左下のブランド行の帯 (brandBandH) は回避。
 * タイブレークは候補順 (右下を最優先)。
 */
function placeLabel(opts: {
  W: number;
  H: number;
  lw: number;
  lh: number;
  landRects: { rect: Rect; isTarget: boolean }[];
  brandBandH: number;
}): { x: number; y: number } {
  const { W, H, lw, lh, landRects, brandBandH } = opts;
  const M = 40;
  const candidates = [
    { x: W - lw - M, y: H - lh - M },
    { x: W - lw - M, y: M },
    { x: W - lw - M, y: H / 2 - lh / 2 },
    { x: M, y: M },
    { x: M, y: H / 2 - lh / 2 },
    { x: W / 2 - lw / 2, y: H - lh - M },
    { x: W / 2 - lw / 2, y: M },
    { x: M, y: H - lh - M - brandBandH },
  ];
  let best = candidates[0];
  let bestScore = Infinity;
  candidates.forEach((c, order) => {
    const rect: Rect = { x0: c.x - 14, y0: c.y - 14, x1: c.x + lw + 14, y1: c.y + lh + 14 };
    let score = 0;
    for (const { rect: lr, isTarget } of landRects) {
      score += rectOverlap(rect, lr) * (isTarget ? 4 : 1);
    }
    score += order; // 弱いタイブレーク
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  });
  return best;
}

// ─── 地図 SVG (テキストなし) ───

interface MapBuild {
  svg: string;
  labelPos: { x: number; y: number };
  labelSize: { lw: number; lh: number };
  prefName: string;
}

function buildMapSvg(
  projectRoot: string,
  code2: string,
  ratio: PrefCardRatioKey,
  theme: PrefCardThemeKey,
): MapBuild {
  const { width: W, height: H, margin, labelFs, brandFs } = PREF_CARD_RATIOS[ratio];
  const C = PREF_CARD_THEMES[theme];
  const features = loadPrefFeatures(projectRoot);
  const target = features.find((f) => f.properties.N03_007 === code2);
  if (!target) throw new Error(`未知の県コード: ${code2}`);

  // 主要部 bbox を margin 倍に拡げて contain フィット
  // = サイズ (W/m, H/m) の中央矩形へ fitExtent (数学的に等価)
  const projection = geoMercator().fitExtent(
    [
      [(W - W / margin) / 2, (H - H / margin) / 2],
      [(W + W / margin) / 2, (H + H / margin) / 2],
    ],
    mainPolygonOf(target),
  );
  const path = geoPath(projection);

  // ラベル配置スコア用: 画面に掛かる全ポリゴンの投影 bbox
  const screen: Rect = { x0: 0, y0: 0, x1: W, y1: H };
  const landRects: { rect: Rect; isTarget: boolean }[] = [];
  for (const f of features) {
    const isTarget = f.properties.N03_007 === code2;
    for (const poly of polygonsOf(f)) {
      const b = path.bounds(poly);
      const rect: Rect = { x0: b[0][0], y0: b[0][1], x1: b[1][0], y1: b[1][1] };
      if (rectOverlap(rect, screen) > 0) landRects.push({ rect, isTarget });
    }
  }

  const neighborsD = features
    .filter((f) => f.properties.N03_007 !== code2)
    .map((f) => path(f) ?? "")
    .join("");
  const targetD = path(target) ?? "";

  // 県名ピルの寸法見積り (CJK 全角 = 1em 送り)
  const prefName = target.properties.N03_001;
  const padX = labelFs * 0.6;
  const lw = prefName.length * labelFs * 1.02 + padX * 2;
  const lh = labelFs * 1.66;
  const brandBandH = brandFs * 2.6 + 28;
  const labelPos = placeLabel({ W, H, lw, lh, landRects, brandBandH });

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <pattern id="seaDots" width="26" height="26" patternUnits="userSpaceOnUse">
      <circle cx="6" cy="6" r="2.2" fill="${C.seaDot}"/>
      <circle cx="19" cy="19" r="2.2" fill="${C.seaDot}"/>
    </pattern>
    <pattern id="landDots" width="13" height="13" patternUnits="userSpaceOnUse">
      <rect width="13" height="13" fill="${C.land}"/>
      <circle cx="3.5" cy="3.5" r="2.1" fill="${C.landDot}"/>
      <circle cx="10" cy="10" r="2.1" fill="${C.landDot}"/>
    </pattern>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="6" stdDeviation="10" flood-color="${C.shadow}"/>
    </filter>
  </defs>
  <rect width="${W}" height="${H}" fill="${C.sea}"/>
  <rect width="${W}" height="${H}" fill="url(#seaDots)"/>
  <path d="${neighborsD}" fill="url(#landDots)" stroke="${C.landStroke}" stroke-width="1.6" stroke-linejoin="round"/>
  <path d="${targetD}" fill="${C.target}" stroke="${C.targetStroke}" stroke-width="3" stroke-linejoin="round" filter="url(#soft)"/>
</svg>`;

  return { svg, labelPos, labelSize: { lw, lh }, prefName };
}

// ─── satori 合成 → PNG ───

export interface RenderPrefCardOptions {
  projectRoot: string;
  /** 2 桁県コード "01".."47" */
  code2: string;
  ratio: PrefCardRatioKey;
  theme: PrefCardThemeKey;
  fonts: SatoriFont[];
  outPath: string;
}

export async function renderPrefCardPng(opts: RenderPrefCardOptions): Promise<void> {
  const { projectRoot, code2, ratio, theme, fonts, outPath } = opts;
  const { width: W, height: H, labelFs, brandFs } = PREF_CARD_RATIOS[ratio];
  const C = PREF_CARD_THEMES[theme];

  const map = buildMapSvg(projectRoot, code2, ratio, theme);
  const mapPng = await sharp(Buffer.from(map.svg)).png().toBuffer();
  const mapUri = `data:image/png;base64,${mapPng.toString("base64")}`;

  const element = h(
    "div",
    { style: { display: "flex", width: "100%", height: "100%", position: "relative" } },
    h("img", {
      src: mapUri,
      width: W,
      height: H,
      style: { position: "absolute", top: 0, left: 0 },
    }),
    // 県名ピル (placeLabel の座標に固定寸で配置 = スコアリングとレイアウトが一致)
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: map.labelPos.x,
          top: map.labelPos.y,
          width: map.labelSize.lw,
          height: map.labelSize.lh,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: C.label,
          borderRadius: map.labelSize.lh / 2,
          boxShadow: `0 6px 18px ${C.shadow}`,
          color: C.labelText,
          fontSize: labelFs,
          fontWeight: 700,
          letterSpacing: "0.05em",
        },
      },
      map.prefName,
    ),
    // ブランド行 (左下ピル)
    h(
      "div",
      {
        style: {
          position: "absolute",
          left: 28,
          bottom: 28,
          display: "flex",
          alignItems: "center",
          padding: `${brandFs * 0.35}px ${brandFs * 0.8}px`,
          backgroundColor: C.brandBg,
          borderRadius: 999,
          color: C.brand,
          fontSize: brandFs,
          fontWeight: 700,
          letterSpacing: "0.02em",
        },
      },
      PREF_CARD_BRAND_TEXT,
    ),
  );

  const svg = await satori(element, { width: W, height: H, fonts });
  await sharp(Buffer.from(svg)).png().toFile(outPath);
}
