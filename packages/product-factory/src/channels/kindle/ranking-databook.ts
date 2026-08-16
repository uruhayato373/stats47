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
import { fetchRankingAiContent, composeChapterBody } from "./ai-content-composer";

export interface RankingSection {
  readonly rankingKey: string;
  readonly title: string;
  /** markdown 断片 (画像参照 + 考察 + ai-content 由来の解説)。 */
  readonly bodyMd: string;
  readonly image?: { readonly fileName: string; readonly png: Buffer };
  /** 採用した ai-content フィールド (レポート用)。 */
  readonly aiUsed?: readonly string[];
  /** 数値照合で落とした ai-content フィールドと理由 (黙って捨てない)。 */
  readonly aiDropped?: readonly { field: string; reason: string }[];
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
  /** S3 地域別: regionalAnalysis から抜き出す地方ブロックの見出し語 (例「北海道・東北」)。 */
  readonly regionBlockLabel?: string;
  /** 章に載せる FAQ の最大数 (既定 2)。 */
  readonly faqLimit?: number;
}

/**
 * 1 ranking キーからデータブック章を組む。R2 に無い / 47 県フルが無い / データが薄いキーは null を返す
 * (呼び出し側でスキップ)。palette は指標の善悪が不明なため中立の "blue" 固定。
 */
export async function buildRankingSection(rankingKey: string, opts: RankingSectionOpts = {}): Promise<RankingSection | null> {
  const cfg = (METRICS_REGISTRY as Record<string, { title?: string; unit?: string; subtitle?: string } | undefined>)[
    rankingKey
  ];
  const baseTitle = cfg?.title ?? rankingKey;
  const unit = cfg?.unit ?? "";
  // ★subtitle を章題に併記する (2026-08-12)。
  //   metric は title / subtitle / unit を分けて持ち、subtitle が対象や分母を担う
  //   (`metric-config-standards.md`)。章題が title だけだと「平均身長 141cm」のように
  //   **対象学年が落ちて意味の通らない章**になる。分母つき指標でも同じ問題が起きる。
  const title = cfg?.subtitle ? `${baseTitle}（${cfg.subtitle}）` : baseTitle;

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
  // ★「差は約1.0倍」を出さない (2026-08-12)。
  //   141cm と 139cm を「約1.0倍の差」と書いても読者に何も伝わらない。
  //   倍率が意味を持たない範囲では、代わりに県差の小ささを述べる。
  const gapPhrase =
    ratio === null
      ? ""
      : ratio < 1.1
        ? "県による差は小さく、どこでも大きくは変わりません。"
        : `上位と下位の差は約${ratio.toFixed(1)}倍あります。`;
  let 考察 =
    `${title}（${fetched.year}年）の1位は${top.name}で${fmt(top.value)}${unit}、最下位は${bot.name}で${fmt(bot.value)}${unit}です。` +
    `全国平均は約${fmt(avg)}${unit}です。` +
    gapPhrase;

  // 全国順位つきの行 (S3 の地域列挙と ai-content の数値ゲートの両方で使う)。
  const ranked = fetched.values
    .filter((v): v is { code5: string; value: number } => v.value !== null)
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((v, i) => ({ areaCode: v.code5, areaName: nameOf(v.code5), value: v.value, rank: i + 1 }));

  // ★S3 地域別: 地域内**全県**の全国順位を列挙する (2026-08-12)。
  //   旧実装は「地域内で最上位の 1 県」の 1 文だけで、8 冊の本文がほぼ同一になっていた。
  //   全県を並べれば、同じ指標でも地域ごとに別の本文になり、読者にとっても自分の県が見つかる。
  //   値は values.json から決定的に組むので AI も捏造も介在しない。
  if (opts.highlightRegionLabel && opts.highlightCodes && opts.highlightCodes.length > 0) {
    const codeSet = new Set(opts.highlightCodes);
    const inRegion = ranked.filter((r) => codeSet.has(r.areaCode));
    if (inRegion.length > 0) {
      const list = inRegion.map((r) => `${r.areaName}が全国${r.rank}位（${fmt(r.value)}${unit}）`).join("、");
      考察 += `\n\n${opts.highlightRegionLabel}の内訳を見ると、${list}となっています。`;
    }
  }

  // ai-content (サイト公開済みの解説) を採用前に数値照合してから合成する。
  const ai = await fetchRankingAiContent(rankingKey);
  const composed = composeChapterBody({
    ai,
    gate: { values: ranked, unit, yearCode: fetched.year },
    regionCodes: opts.highlightCodes,
    regionBlockLabel: opts.regionBlockLabel,
    // 節の選定は県名で行う (ai-content の見出しは固定の地方区分ではないため)。
    regionNames: (opts.highlightCodes ?? []).map((c) => nameOf(c)),
    faqLimit: opts.faqLimit,
  });

  const body = [`![${title}](images/${fileName})`, 考察, composed.md].filter((s) => s.trim().length > 0).join("\n\n");

  return {
    rankingKey,
    title,
    bodyMd: body,
    image: { fileName, png },
    aiUsed: composed.used,
    aiDropped: composed.dropped,
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
