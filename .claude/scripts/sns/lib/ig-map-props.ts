/**
 * Instagram「地図」カルーセル (日枠、正典 .claude/rules/sns-content-standards.md §2-3c) の
 * データ整形ロジック。ネットワーク I/O は build-ig-map-props.ts が担い、ここには
 * 「47都道府県の値をどう塗り分け・整形するか」を決める純粋関数だけを置く
 * (fixture でテストできるようにするため)。
 *
 * 塗り分けの区切りは d3-scale の scaleQuantile (等分位) で入力データから決定的に決める。
 * 手動の閾値は書かない — 同じ47件を渡せば毎回同じ breaks / bin 割当になる。
 */

import { scaleQuantile } from "d3-scale";

/** R2 から解決した1都道府県分の値 */
export interface TileCandidate {
  prefCode2: string;
  areaName: string;
  value: number;
  rank: number;
}

/** 塗り分けの階級数 (5区分の等分位) */
export const MAP_CLASS_COUNT = 5;

/**
 * 地図タイルの単色ランプ (薄い紫 → map シリーズの地色 #7C3AED)。
 * ig-series/tokens.ts の map パレット (bg:#7C3AED) と系統を合わせた固定5色。
 * バズ地図標準 (`buzz-map-standards.md` §1) と同じ「単色ランプ・虹色禁止」の方針に倣う。
 */
export const MAP_RAMP: readonly string[] = ["#F3E8FF", "#D8B4FE", "#B583F5", "#9333EA", "#5B21B6"];

// --- WCAG 相対輝度・コントラスト比 (ig-series/contrast.ts と同じ定義式のローカル実装) ---
// apps/remotion 配下のコードを .claude/scripts から import しない方針のため、
// ~15行の小さな計算はここに独立して持つ (二重実装ではなく App/Script 境界を越えないための複製)。

function srgbChannelToLinear(channel8bit: number): number {
  const c = channel8bit / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function parseHexColor(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "").trim();
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return [r, g, b];
}

function relativeLuminance(hex: string): number {
  const [r, g, b] = parseHexColor(hex);
  return 0.2126 * srgbChannelToLinear(r) + 0.7152 * srgbChannelToLinear(g) + 0.0722 * srgbChannelToLinear(b);
}

function contrastRatio(hexA: string, hexB: string): number {
  const lA = relativeLuminance(hexA);
  const lB = relativeLuminance(hexB);
  const lighter = Math.max(lA, lB);
  const darker = Math.min(lA, lB);
  return (lighter + 0.05) / (darker + 0.05);
}

/** 凡例・タイル文字 (32px未満想定なので 4.5:1 を要求) に使う黒/白を、実コントラスト計算で選ぶ */
export function pickTextColor(fillHex: string): string {
  const black = "#111111";
  const white = "#FFFFFF";
  return contrastRatio(fillHex, black) >= contrastRatio(fillHex, white) ? black : white;
}

export interface QuantileBins {
  binOf: (value: number) => number;
  /** 階級ごとの [min, max] (bin index 昇順) */
  ranges: { min: number; max: number }[];
}

/**
 * 47件の値から等分位 (quantile) で classCount 区分の閾値を決定的に算出する。
 * d3-scale の scaleQuantile はソート済みドメインの等分位で閾値を切るため、
 * 同じ入力なら常に同じ breaks / bin 割当になる (決定的)。
 */
export function computeQuantileBins(values: number[], classCount: number = MAP_CLASS_COUNT): QuantileBins {
  if (values.length === 0) throw new Error("computeQuantileBins: values が空です");
  const range = Array.from({ length: classCount }, (_, i) => i);
  const scale = scaleQuantile<number>().domain(values).range(range);
  const ranges = range.map((bin) => {
    const [min, max] = scale.invertExtent(bin);
    return { min, max };
  });
  return { binOf: (v: number) => scale(v), ranges };
}

export interface MapTileItem {
  prefCode2: string;
  areaName: string;
  value: number;
  rank: number;
  bin: number;
  fill: string;
  textColor: string;
}

export interface MapLegendEntry {
  bin: number;
  rangeLabel: string;
  fill: string;
  textColor: string;
  count: number;
}

function formatRangeValue(v: number, precision: number): string {
  return v.toFixed(precision);
}

/** 47件の候補から塗り分け済みタイル + 凡例を組み立てる */
export function buildMapTiles(
  candidates: TileCandidate[],
  precision: number,
): { tiles: MapTileItem[]; legend: MapLegendEntry[] } {
  const bins = computeQuantileBins(candidates.map((c) => c.value));
  const counts = new Array(MAP_CLASS_COUNT).fill(0);
  const tiles: MapTileItem[] = candidates.map((c) => {
    const bin = bins.binOf(c.value);
    counts[bin] += 1;
    const fill = MAP_RAMP[bin];
    return { prefCode2: c.prefCode2, areaName: c.areaName, value: c.value, rank: c.rank, bin, fill, textColor: pickTextColor(fill) };
  });
  const legend: MapLegendEntry[] = bins.ranges.map((r, bin) => {
    const fill = MAP_RAMP[bin];
    return {
      bin,
      rangeLabel: `${formatRangeValue(r.min, precision)}〜${formatRangeValue(r.max, precision)}`,
      fill,
      textColor: pickTextColor(fill),
      count: counts[bin],
    };
  });
  return { tiles, legend };
}

export interface TopBottom {
  top5: TileCandidate[];
  bottom5: TileCandidate[];
}

/** rank 昇順で上位5・下位5を切り出す (candidates は事前に47件そろっている前提) */
export function computeTopBottom(candidates: TileCandidate[]): TopBottom {
  const sorted = [...candidates].sort((a, b) => a.rank - b.rank);
  return { top5: sorted.slice(0, 5), bottom5: sorted.slice(-5).reverse() };
}

export function buildMapCoverQuestion(label: string): string {
  return `${label}\n47都道府県、値が高いのはどこ？`;
}

/** 家計調査由来の指標に付ける固定文言 (地図は特定の1県ではなく47県全体なので、都区部の注記を含めた一般形) */
export function buildMapScopeNote(isKakei: boolean): string | undefined {
  return isKakei ? "都道府県庁所在市（東京都は都区部）の値" : undefined;
}

/** fail-closed 判定: 47件そろっているか、source/year 欠落が無いかを検証する */
export function validateMapData(candidates: TileCandidate[], source: string, year: number): string[] {
  const errors: string[] = [];
  if (candidates.length !== 47) {
    errors.push(`47都道府県そろっていません (${candidates.length}件)`);
  }
  const seen = new Set<string>();
  for (const c of candidates) {
    if (seen.has(c.prefCode2)) errors.push(`都道府県コードが重複しています: ${c.prefCode2}`);
    seen.add(c.prefCode2);
    if (!Number.isFinite(c.value)) errors.push(`${c.areaName || c.prefCode2} の値が不正`);
  }
  if (!source) errors.push("source が空です");
  if (!Number.isInteger(year) || year <= 0) errors.push("year が不正です");
  return errors;
}

export interface MapCaptionInput {
  label: string;
  unit: string;
  year: number;
  source: string;
  top5: TileCandidate[];
  bottom5: TileCandidate[];
}

/**
 * caption.txt の本文 (sns-content-standards.md §2-3 の雛形に準拠)。
 * IG のキャプション内 URL はタップできないため雛形どおり載せず、
 * 「プロフィールのリンクから」で導線する。
 */
export function buildMapCaption(input: MapCaptionInput): string {
  const { label, unit, year, source, top5, bottom5 } = input;
  const lines: string[] = [];
  lines.push(`【都道府県ランキング】${label}`);
  lines.push("");
  // bottom5 は computeTopBottom の契約により 47位→43位の降順 (最下位が先頭)。
  lines.push(`1位: ${top5[0].areaName} ${top5[0].value}${unit}`);
  lines.push(`47位: ${bottom5[0].areaName} ${bottom5[0].value}${unit}`);
  lines.push("");
  lines.push(`出典: ${source}（${year}年）`);
  lines.push("");
  lines.push("保存して後で見返してね📌");
  lines.push("プロフィールのリンクから全47都道府県が見られます");
  lines.push("");
  lines.push(`#都道府県ランキング #${label} #日本地図 #統計 #都道府県 #地図 #ランキング #暮らし #雑学 #stats47`);
  return lines.join("\n");
}
