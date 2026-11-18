import { rankingR2Key } from "@stats47/r2-storage/keys";
/**
 * データブック型 (S2/S4) の ranking 章生成。
 * R2 `app/ranking/<key>/values.json` の観測値を取得し、上位5+下位5 の横棒カード SVG (svg-builder) を
 * PNG 化して章に同梱、値から算出した factual な考察 (1位/最下位/格差/全国平均) を添える。
 * 考察は観測値からの決定的な算術のみで、県別数値の捏造は起きない (evidence-based-judgment.md)。
 */
import sharp from "sharp";
import { generateBarChartSvg, type BarItem } from "@stats47/svg-builder";
import { METRICS_REGISTRY, SITE } from "@stats47/data-configs";
import { fetchRankingValues } from "../../data/load-ranking-values";
import { productIndicatorLabel } from "../../data/product-indicator-label";
import { PREFECTURE_BY_CODE5 } from "../../data/prefectures";
import { yearSuffixOf } from "./full-tables";

export interface RankingSection {
  readonly rankingKey: string;
  readonly title: string;
  readonly source: RankingSource;
  /** markdown 断片 (画像参照 + 決定的集計 + 全県表)。未レビューのサイト解説は転載しない。 */
  readonly bodyMd: string;
  readonly image?: { readonly fileName: string; readonly png: Buffer };
  /** 採用した ai-content フィールド (レポート用)。 */
  readonly aiUsed?: readonly string[];
  /** 数値照合で落とした ai-content フィールドと理由 (黙って捨てない)。 */
  readonly aiDropped?: readonly { field: string; reason: string }[];
  /** S3 地域別: 地域内の県の全国順位 (第 2 章の扉で地域の全体像の表を組む)。 */
  readonly regionRows?: readonly { readonly areaName: string; readonly value: number; readonly rank: number }[];
}

export interface RankingSource {
  readonly rankingKey: string;
  readonly title: string;
  readonly year: string;
  /** 「2022年」「2024年度」。指標の定義 (yearFormat) で決める */
  readonly yearLabel: string;
  /** 収録年の値の出典名 (補助の出典で取った年はそちらの名前) */
  readonly sourceName: string;
  readonly unit: string;
  readonly rawUrl: string;
  readonly canonicalUrl: string;
  readonly source: Readonly<Record<string, unknown>>;
  readonly observedAreas: number;
  readonly missingAreas: number;
}

const nameOf = (code5: string): string => PREFECTURE_BY_CODE5.get(code5)?.name ?? code5;
const fmt = (n: number): string => n.toLocaleString("ja-JP", { maximumFractionDigits: 20 });

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
  /** S3 地域別: regionalAnalysis から抜き出す地方ブロックの見出し語 (例「北海道・東北」)。 */
  readonly regionBlockLabel?: string;
  /** 章に載せる FAQ の最大数 (既定 2)。 */
  readonly faqLimit?: number;
  readonly onMissing?: (rankingKey: string, reason: string) => void;
}

/** 出典の表示名。e-Stat は displayName、外部は config.source.name。 */
function sourceDisplayName(src: Record<string, unknown> | undefined): string | null {
  if (!src) return null;
  if (typeof src.displayName === "string" && src.displayName) return src.displayName;
  const nested = (src.config as { source?: { name?: unknown } } | undefined)?.source?.name;
  if (typeof nested === "string" && nested) return nested;
  if (typeof src.name === "string" && src.name) return src.name;
  return null;
}

/** 収録年の値を取った出典。supplementalSources がその年を持てばそちら (例: 物価地域差指数の 2025 年 = 小売物価統計調査)。 */
export function sourceForYear(cfg: Record<string, unknown>, year: string): Record<string, unknown> {
  const supp = (cfg.supplementalSources as { years?: number[]; source?: Record<string, unknown> }[] | undefined) ?? [];
  const hit = supp.find((s) => (s.years ?? []).map(String).includes(String(year)) && s.source);
  return (hit?.source ?? (cfg.source as Record<string, unknown> | undefined) ?? {}) as Record<string, unknown>;
}

/**
 * 1 ranking キーからデータブック章を組む。R2 に無い / 47 県フルが無い / データが薄いキーは null を返す
 * (呼び出し側でスキップ)。palette は指標の善悪が不明なため中立の "blue" 固定。
 */
export async function buildRankingSection(
  rankingKey: string,
  opts: RankingSectionOpts = {},
): Promise<RankingSection | null> {
  const cfg = (METRICS_REGISTRY as unknown as Record<string, Record<string, unknown> | undefined>)[rankingKey];
  if (!cfg) throw new Error(`Unknown ranking config: ${rankingKey}`);
  const unit = String(cfg.unit ?? "");
  // ★subtitle を章題に併記する (2026-08-12)。
  //   metric は title / subtitle / unit を分けて持ち、subtitle が対象や分母を担う
  //   (`metric-config-standards.md`)。章題が title だけだと「平均身長 141cm」のように
  //   **対象学年が落ちて意味の通らない章**になる。分母つき指標でも同じ問題が起きる。
  const title = productIndicatorLabel(rankingKey, cfg);

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
  // Competition ranking: identical observations share a rank (1, 2, 2, 4), not an ordinal position.
  const rankByValue = new Map<number, number>();
  rows.forEach((row, i) => { if (!rankByValue.has(row.value)) rankByValue.set(row.value, i + 1); });

  const n = rows.length;
  const top5 = rows.slice(0, 5);
  const bottom5 = rows.slice(-5);
  const items: BarItem[] = [
    ...top5.map((r) => ({
      label: `${rankByValue.get(r.value)!}位 ${r.name}`,
      name: r.name,
      rank: rankByValue.get(r.value)!,
      value: r.value,
    })),
    { label: "", value: 0, isSeparator: true },
    ...bottom5.map((r) => ({
      label: `${rankByValue.get(r.value)!}位 ${r.name}`,
      name: r.name,
      rank: rankByValue.get(r.value)!,
      value: r.value,
    })),
  ];
  // 年の数え方は指標の定義 (yearFormat) で決め、本文・全県表と図をそろえる (2026-11-18 K-S3 レビュー B1)。
  const yearLabel = `${fetched.year}${yearSuffixOf(rankingKey)}`;
  const yearSource = sourceForYear(cfg, String(fetched.year));
  const sourceName = sourceDisplayName(yearSource) ?? "e-Stat（政府統計の総合窓口）";
  const note = typeof cfg.note === "string" && cfg.note.trim() ? cfg.note.trim() : null;
  const svg = generateBarChartSvg(items, {
    title,
    subtitle: `${yearLabel} / 単位: ${unit}`,
    source: sourceName,
    // Unit is stated in the subtitle and full table; repeating it in each card overlaps long names.
    unit: "",
    layout: "columns",
    palette: "blue",
    showBars: false,
  });
  const png = await svgToPng(svg);
  const fileName = `rk-${rankingKey}.png`;

  const top = rows[0];
  const bot = rows[n - 1];
  const avg = rows.reduce((s, r) => s + r.value, 0) / n;
  const ratio = bot.value > 0 ? top.value / bot.value : null;
  // ★「差は約1.0倍」を出さない (2026-08-12)。
  //   141cm と 139cm を「約1.0倍の差」と書いても読者に何も伝わらない。
  //   倍率が意味を持たない範囲では、代わりに県差の小ささを述べる。
  const gapPhrase =
    ratio === null
      ? ""
      : ratio < 1.1
        ? "この指標の最大値と最小値の比は1.1未満です。地域内の違いや実務上の重要性を判定するものではありません。"
        : `上位と下位の差は約${ratio.toFixed(1)}倍あります。`;
  let 考察 =
    `${title}（収録年次: ${yearLabel}）の最大値は${fmt(top.value)}${unit}（${top.name}を含む${rows.filter(r => r.value === top.value).length}地域）、最小値は${fmt(bot.value)}${unit}（${bot.name}を含む${rows.filter(r => r.value === bot.value).length}地域）です。` +
    `値のある${n}地域の単純平均は約${avg.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}${unit}です（全国集計値・人口加重平均ではありません）。` +
    gapPhrase +
    "数値の大きい順で同値は同順位です。図は先頭・末尾の各5地域の数値カードで、長さを数値に対応させた棒グラフではありません。同順位の全地域を表示するものではありません。";

  // 全国順位つきの行 (S3 の地域列挙と ai-content の数値ゲートの両方で使う)。
  const ranked = fetched.values
    .filter((v): v is { code5: string; value: number } => v.value !== null)
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((v) => ({
      areaCode: v.code5,
      areaName: nameOf(v.code5),
      value: v.value,
      rank: rankByValue.get(v.value)!,
    }));

  // ★S3 地域別: 地域内**全県**の全国順位を列挙する (2026-08-12)。
  //   旧実装は「地域内で最上位の 1 県」の 1 文だけで、8 冊の本文がほぼ同一になっていた。
  //   全県を並べれば、同じ指標でも地域ごとに別の本文になり、読者にとっても自分の県が見つかる。
  //   値は values.json から決定的に組むので AI も捏造も介在しない。
  let regionRows: RankingSection["regionRows"];
  if (opts.highlightRegionLabel && opts.highlightCodes && opts.highlightCodes.length > 0) {
    const codeSet = new Set(opts.highlightCodes);
    const inRegion = ranked.filter((r) => codeSet.has(r.areaCode));
    regionRows = inRegion.map((r) => ({ areaName: r.areaName, value: r.value, rank: r.rank }));
    if (inRegion.length > 0) {
      const list = inRegion.map((r) => `${r.areaName}が全国${r.rank}位（${fmt(r.value)}${unit}）`).join("、");
      考察 += `\n\n${opts.highlightRegionLabel}の内訳を見ると、${list}となっています。`;
    }
  }

  // Numeric gates cannot verify denominator interpretation or causal claims in reused prose.
  // Keep source observations usable without silently presenting that prose as reviewed editorial.
  const table = [
    "### 全県の収録値",
    `単位: ${unit}。収録年次: ${yearLabel}。出典: ${sourceName}。${note ? `${note}` : ""}順位は観測値の降順であり、地域の良し悪しや施策の優先順位ではありません。`,
    "| 順位 | 都道府県 | 収録値 |\n| --- | --- | ---: |\n" + ranked.map(r =>
      `| ${r.rank} | ${r.areaName} | ${r.value.toLocaleString("ja-JP", { maximumFractionDigits: 20 })} |`,
    ).join("\n"),
    ...(n < 47 ? [`欠測: ${fetched.values.filter(v => v.value === null).map(v => nameOf(v.code5)).join("、")}。欠測をゼロや最下位として扱いません。`] : []),
    `[指標の出典・定義を確認する](${SITE.origin}/ranking/${rankingKey})。単一時点の地域差だけでは、個人の行動や差の原因は判定できません。`,
  ].join("\n\n");
  const body = [`![${title}](images/${fileName})`, 考察, table].join("\n\n");

  return {
    rankingKey,
    title,
    source: {
      rankingKey,
      title,
      year: fetched.year,
      yearLabel,
      sourceName,
      unit,
      rawUrl: `${process.env.R2_PUBLIC_FETCH_URL ?? SITE.r2PublicBaseUrl}/${rankingR2Key(rankingKey, "values")}`,
      canonicalUrl: `${SITE.origin}/ranking/${rankingKey}`,
      source: yearSource,
      observedAreas: n,
      missingAreas: fetched.values.length - n,
    },
    bodyMd: body,
    image: { fileName, png },
    aiUsed: [],
    aiDropped: [{ field: "all", reason: "unreviewed-site-prose-excluded-from-book-edition" }],
    regionRows,
  };
}

/**
 * ranking キー列から、有効な章を最大 limit 件生成する (R2 不在/薄いキーはスキップ)。
 * S2 (テーマ別データブック) は pack の全キーを渡し、先頭から有効な N 件を採る。
 */
export async function buildRankingSections(
  rankingKeys: readonly string[],
  limit: number = rankingKeys.length,
  opts: RankingSectionOpts = {},
): Promise<RankingSection[]> {
  const out: RankingSection[] = [];
  for (const key of rankingKeys) {
    if (out.length >= limit) {
      opts.onMissing?.(key, "explicit-ranking-limit");
      continue;
    }
    try {
      const sec = await buildRankingSection(key, opts);
      if (sec) out.push(sec);
      else opts.onMissing?.(key, "source-unavailable-or-insufficient-observations");
    } catch (error) {
      if (!opts.onMissing) throw error;
      opts.onMissing(key, error instanceof Error ? error.message : String(error));
    }
  }
  return out;
}
