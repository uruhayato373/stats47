/**
 * データブック型 (S2/S4) の ranking 章生成。
 * R2 `app/ranking/<key>/values.json` の観測値を取得し、上位5+下位5 の横棒カード SVG (svg-builder) を
 * PNG 化して章に同梱、値から算出した factual な考察 (1位/最下位/格差/全国平均) を添える。
 * 考察は観測値からの決定的な算術のみで、県別数値の捏造は起きない (evidence-based-judgment.md)。
 */
import sharp from "sharp";
import { generateBarChartSvg, type BarItem } from "@stats47/svg-builder";
import { METRICS_REGISTRY } from "@stats47/data-configs";
import { fetchRankingValues } from "../../data/load-ranking-values";
import { PREFECTURE_BY_CODE5 } from "../../data/prefectures";

export interface RankingSection {
  readonly rankingKey: string;
  readonly title: string;
  /** markdown 断片 (画像参照 + 考察)。 */
  readonly bodyMd: string;
  readonly image?: { readonly fileName: string; readonly png: Buffer };
}

const nameOf = (code5: string): string => PREFECTURE_BY_CODE5.get(code5)?.name ?? code5;
const fmt = (n: number): string =>
  Math.abs(n) >= 100 ? Math.round(n).toLocaleString("ja-JP") : n.toLocaleString("ja-JP", { maximumFractionDigits: 2 });

async function svgToPng(svg: string): Promise<Buffer> {
  const m = svg.match(/viewBox="0 0 (\d+(?:\.\d+)?) /);
  const logicalW = m ? parseFloat(m[1]) : 960;
  const density = logicalW < 1280 ? 288 : 144;
  return sharp(Buffer.from(svg), { density }).png().toBuffer();
}

export interface RankingSectionOpts {
  /** S3 地域別: この地域の県を考察で強調する。 */
  readonly highlightRegionLabel?: string;
  readonly highlightCodes?: readonly string[];
}

/**
 * 1 ranking キーからデータブック章を組む。R2 に無い / 47 県フルが無い / データが薄いキーは null を返す
 * (呼び出し側でスキップ)。palette は指標の善悪が不明なため中立の "blue" 固定。
 */
export async function buildRankingSection(rankingKey: string, opts: RankingSectionOpts = {}): Promise<RankingSection | null> {
  const cfg = (METRICS_REGISTRY as Record<string, { title?: string; unit?: string } | undefined>)[rankingKey];
  const title = cfg?.title ?? rankingKey;
  const unit = cfg?.unit ?? "";

  let fetched;
  try {
    fetched = await fetchRankingValues(rankingKey);
  } catch {
    return null;
  }
  const rows = fetched.values
    .filter((v): v is { code5: string; value: number } => v.value !== null)
    .map((v) => ({ name: nameOf(v.code5), value: v.value }));
  if (rows.length < 20) return null; // 薄いデータは載せない
  rows.sort((a, b) => b.value - a.value);

  const n = rows.length;
  const top5 = rows.slice(0, 5);
  const bottom5 = rows.slice(-5);
  const items: BarItem[] = [
    ...top5.map((r, i) => ({ label: `${i + 1}位 ${r.name}`, name: r.name, rank: i + 1, value: r.value })),
    { label: "", value: 0, isSeparator: true },
    ...bottom5.map((r, i) => ({ label: `${n - 4 + i}位 ${r.name}`, name: r.name, rank: n - 4 + i, value: r.value })),
  ];
  const svg = generateBarChartSvg(items, {
    title,
    subtitle: `${fetched.year}年 / 単位: ${unit}`,
    source: "e-Stat（政府統計の総合窓口）",
    unit,
    layout: "columns",
    palette: "blue",
  });
  const png = await svgToPng(svg);
  const fileName = `rk-${rankingKey}.png`;

  const top = rows[0];
  const bot = rows[n - 1];
  const avg = rows.reduce((s, r) => s + r.value, 0) / n;
  const ratio = bot.value !== 0 && top.value / bot.value > 0 ? top.value / bot.value : null;
  let 考察 =
    `${title}（${fetched.year}年）の1位は${top.name}で${fmt(top.value)}${unit}、最下位は${bot.name}で${fmt(bot.value)}${unit}です。` +
    (ratio ? `上位と下位の差は約${ratio.toFixed(1)}倍で、` : "") +
    `全国平均は約${fmt(avg)}${unit}です。`;

  // S3 地域別: この地域内で最上位の県が全国何位かを添える。
  if (opts.highlightRegionLabel && opts.highlightCodes && opts.highlightCodes.length > 0) {
    const codeSet = new Set(opts.highlightCodes);
    const rankByCode = new Map<string, { name: string; rank: number }>();
    fetched.values
      .filter((v): v is { code5: string; value: number } => v.value !== null)
      .slice()
      .sort((a, b) => b.value - a.value)
      .forEach((v, i) => rankByCode.set(v.code5, { name: nameOf(v.code5), rank: i + 1 }));
    let best: { name: string; rank: number } | null = null;
    for (const code of codeSet) {
      const r = rankByCode.get(code);
      if (r && (!best || r.rank < best.rank)) best = r;
    }
    if (best) {
      考察 += `${opts.highlightRegionLabel}の中では、${best.name}が全国${best.rank}位で最も上位に位置しています。`;
    }
  }

  return {
    rankingKey,
    title,
    bodyMd: `![${title}](images/${fileName})\n\n${考察}`,
    image: { fileName, png },
  };
}

/**
 * ranking キー列から、有効な章を最大 limit 件生成する (R2 不在/薄いキーはスキップ)。
 * S2 (テーマ別データブック) は pack の全キーを渡し、先頭から有効な N 件を採る。
 */
export async function buildRankingSections(
  rankingKeys: readonly string[],
  limit: number,
  opts: RankingSectionOpts = {},
): Promise<RankingSection[]> {
  const out: RankingSection[] = [];
  for (const key of rankingKeys) {
    if (out.length >= limit) break;
    const sec = await buildRankingSection(key, opts);
    if (sec) out.push(sec);
  }
  return out;
}
