/**
 * blog-article-materials — 記事を書く前に機械で計算する材料 (純粋関数)。
 *
 * 2026-11-04 の 18 本で、初回の不合格の主因は順位の取り違え・地方のくくりの誤り・題の約束不足で、
 * 文章力ではなかった。どれもモデルに数えさせた結果なので、数える部分をコードへ移す。
 * ランキング解説の「地方別の順位」(ranking-content-prompt.ts) と同じ考え方で、表はそちらと共用する。
 *
 * 値の平均は出さない。率の指標で県の単純平均を地方の値のように書くと定義を取り違えるため、
 * 地方の比較は順位と県の数だけで行う。
 *
 * 正典: .claude/rules/blog-quality-standards.md「書く前の材料」
 */
import { REGIONS, fetchPrefectures } from "@stats47/area";

import { buildRegionRankText } from "./prompts/region-rank-text";
import type { GroundTruthMetric, GroundTruthRow } from "./prompts/blog-article-prompt";

/** 上位・下位の内訳を数える県の数 */
const EDGE_SIZE = 10;
/** 2 指標の順位の開きを出す県の数 */
const PAIR_GAP_COUNT = 3;

function decimalsOf(value: number): number {
  const text = String(value);
  const dot = text.indexOf(".");
  return dot < 0 ? 0 : text.length - dot - 1;
}

/** 浮動小数の誤差を、入力の桁数に丸めて表示する */
function formatComputed(value: number, decimals: number, unit: string): string {
  const fixed = Number(value.toFixed(decimals));
  return `${fixed.toLocaleString("ja-JP", { maximumFractionDigits: decimals })}${unit}`;
}

function formatRow(row: GroundTruthRow, unit: string): string {
  return `${row.areaName} ${row.value.toLocaleString("ja-JP")}${unit}`;
}

function byRank(rows: readonly GroundTruthRow[]): GroundTruthRow[] {
  return [...rows].sort((a, b) => a.rank - b.rank);
}

/** 最大と最小の比。最小が 0 以下なら比が意味を持たないので null */
export function topBottomRatio(rows: readonly GroundTruthRow[]): number | null {
  if (rows.length === 0) return null;
  const values = rows.map((r) => r.value);
  const min = Math.min(...values);
  return min > 0 ? Math.max(...values) / min : null;
}

function medianOf(rows: readonly GroundTruthRow[]): number {
  const values = rows.map((r) => r.value).sort((a, b) => a - b);
  const mid = Math.floor(values.length / 2);
  return values.length % 2 === 1 ? values[mid] : (values[mid - 1] + values[mid]) / 2;
}

/** 順位の並びの端 (上位 or 下位) を地方ごとに数える。県の数が多い地方から並べる */
export function regionBreakdown(rows: readonly GroundTruthRow[]): string {
  const codeToName = new Map(fetchPrefectures().map((p) => [p.prefCode, p.prefName]));
  const parts = REGIONS.map((region) => {
    const names = new Set(region.prefectures.map((code) => codeToName.get(code)));
    return { name: region.regionName, members: rows.filter((r) => names.has(r.areaName)) };
  })
    .filter((r) => r.members.length > 0)
    .sort((a, b) => b.members.length - a.members.length);
  return parts
    .map((p) => `${p.name} ${p.members.length}県 (${p.members.map((m) => m.areaName).join("、")})`)
    .join(" / ");
}

function metricMaterials(metric: GroundTruthMetric, heading: string): string {
  const rows = byRank(metric.rows);
  if (rows.length < 2) return "";
  const { unit } = metric;
  const decimals = Math.max(...rows.map((r) => decimalsOf(r.value)));
  const first = rows[0];
  const second = rows[1];
  const last = rows[rows.length - 1];
  const ratio = topBottomRatio(rows);
  const edge = Math.min(EDGE_SIZE, Math.floor(rows.length / 2));

  const lines = [
    `## ${heading}`,
    `- 1位と最下位: ${formatRow(first, unit)} と ${formatRow(last, unit)}`,
    `- 1位と最下位の差: ${formatComputed(first.value - last.value, decimals, unit)}`,
  ];
  if (ratio !== null) lines.push(`- 1位は最下位の ${ratio.toFixed(2)} 倍`);
  lines.push(
    `- 1位と2位の差: ${formatComputed(first.value - second.value, decimals, unit)} (2位は${formatRow(second, unit)})`,
    `- 中央値: ${formatComputed(medianOf(rows), decimals + 1, unit)}`,
  );
  const tied = new Map<number, string[]>();
  for (const row of rows) tied.set(row.rank, [...(tied.get(row.rank) ?? []), row.areaName]);
  const ties = [...tied].filter(([, names]) => names.length > 1);
  if (ties.length > 0) {
    lines.push(`- 同順位: ${ties.map(([rank, names]) => `${rank}位 ${names.join("、")}`).join(" / ")}`);
  }
  lines.push(
    `- 上位${edge}県の地方の内訳: ${regionBreakdown(rows.slice(0, edge))}`,
    `- 下位${edge}県の地方の内訳: ${regionBreakdown(rows.slice(-edge))}`,
  );
  const regionRanks = buildRegionRankText(rows);
  if (regionRanks) lines.push("", "地方別の順位 (順位の良い順):", regionRanks);
  return lines.join("\n");
}

/** 2 指標の記事で、両方の上位に入る県と順位の開きが大きい県を出す */
function pairMaterials(a: GroundTruthMetric, b: GroundTruthMetric): string {
  const bByName = new Map(b.rows.map((r) => [r.areaName, r]));
  const joined = a.rows.flatMap((r) => {
    const other = bByName.get(r.areaName);
    return other ? [{ areaName: r.areaName, rankA: r.rank, rankB: other.rank }] : [];
  });
  if (joined.length === 0) return "";
  const labelA = a.readerLabel ?? a.label;
  const labelB = b.readerLabel ?? b.label;
  const both = joined.filter((r) => r.rankA <= EDGE_SIZE && r.rankB <= EDGE_SIZE);
  const gaps = [...joined]
    .sort((x, y) => Math.abs(y.rankA - y.rankB) - Math.abs(x.rankA - x.rankB))
    .slice(0, PAIR_GAP_COUNT);
  return [
    "## 2 つの指標の重なり",
    `- 両方の上位${EDGE_SIZE}位に入る県: ${both.map((r) => r.areaName).join("、") || "なし"}`,
    `- 順位の開きが大きい県: ${gaps
      .map((r) => `${r.areaName} ${labelA} ${r.rankA}位・${labelB} ${r.rankB}位`)
      .join(" / ")}`,
  ].join("\n");
}

/** 記事の材料の節。指標ごとの材料と、2 指標なら重なりを返す */
export function buildArticleMaterials(metrics: readonly GroundTruthMetric[]): string {
  const sections = metrics.map((m) => metricMaterials(m, m.readerLabel ?? m.label));
  if (metrics.length >= 2) sections.push(pairMaterials(metrics[0], metrics[1]));
  return sections.filter(Boolean).join("\n\n");
}
