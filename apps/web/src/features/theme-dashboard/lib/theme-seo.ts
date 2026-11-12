/**
 * テーマのページの題・説明文・FAQ (構造化データ) を、地域の単位 (日本・都道府県・県別・市区町村) に関係なく 1 か所で作る。
 *
 * 2026-11-12 オーナー決定: テーマは 1 つのページの種類で、地域の単位は横串の分類。検索対策も単位ごとに書き分けず、ここだけで決める。
 * 背景 (GSC 2026-W44): テーマは 61 ページで週 2,817 表示 (1 ページあたり 46。ランキングは 120)。平均順位は 8.5 位でランキング (6.1 位) と
 * 大差なく、題が「全国の少子高齢化」のような概念の名前で、検索語に多い「都道府県」「ランキング」や指標の名前を含まないのが主な原因と見ている
 * (「ランキング」「1位」「最も少ない」などを含む検索語が全表示の 44%)。効果は 4 週間後の表示回数で確かめる。
 */
import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";
import { filterOutNationalArea, getRankingTitle, type RankingItem, type RankingValue } from "@stats47/ranking";
import { readRankingItemFromR2, readRankingValuesFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";

/**
 * テーマを見る地域の単位。national = `/themes/<テーマ>` (全国の値と県の選択。47 都道府県を比べる図は置かない)、
 * area = `/areas/<県>/<テーマ>`、japan = `/japan/<テーマ>` (公式の全国の推移)、municipalities = `/municipalities/themes/<テーマ>`
 */
export type ThemeScope = "national" | "area" | "japan" | "municipalities";

/** 題の本体 (サイト名を除く) の長さの目安。超えるときは指標名を 1 つに減らす */
const TITLE_MAX_CHARS = 40;
/** 題と説明文に入れる主な指標の数 */
const LEAD_LABEL_COUNT = 2;

/** 「老年化指数（15歳未満人口100人あたり）」→「老年化指数」 (題では括弧の補足を落とす) */
function stripNote(label: string): string {
  return label.replace(/[（(].*$/, "").trim();
}

/** カタログの主な指標 (role = primary) の短い名前。主な指標が無いテーマはカタログの先頭の指標から取る */
export function themeLeadLabels(themeKey: string, max = LEAD_LABEL_COUNT): string[] {
  const metrics = THEME_CATALOGS[themeKey]?.metrics ?? [];
  const primary = metrics.filter((m) => m.role === "primary");
  const pool = primary.length > 0 ? primary : metrics;
  const labels = pool.map((m) => stripNote(m.shortLabel ?? "")).filter((l) => l.length > 0);
  return [...new Set(labels)].slice(0, max);
}

/** 主な指標の rankingKey (先頭から max 件)。FAQ と説明文の数字に使う */
export function themeLeadRankingKeys(themeKey: string, max = LEAD_LABEL_COUNT): string[] {
  const metrics = THEME_CATALOGS[themeKey]?.metrics ?? [];
  const primary = metrics.filter((m) => m.role === "primary");
  return (primary.length > 0 ? primary : metrics).slice(0, max).map((m) => m.rankingKey);
}

function titleFor(scope: ThemeScope, themeTitle: string, labels: string[], areaName?: string): string {
  const list = labels.join("・");
  switch (scope) {
    case "national":
      return list ? `全国の${themeTitle}｜${list}の推移と都道府県ランキング` : `全国の${themeTitle}｜推移と都道府県ランキング`;
    case "area":
      return list ? `${areaName}の${themeTitle}｜${list}の全国順位` : `${areaName}の${themeTitle}｜全国順位と推移`;
    case "japan":
      return list ? `日本の${themeTitle}の推移｜${list}` : `日本の${themeTitle}の推移`;
    case "municipalities":
      return list ? `${themeTitle}を市区町村で比較｜${list}のランキング` : `${themeTitle}を市区町村で比較｜市区町村ランキング`;
  }
}

/**
 * テーマのページの題 (サイト名を除く)。検索語に合わせ、地域の単位と主な指標の名前を入れる。
 * 長すぎるときは指標名を 1 つにし、それでも長ければ指標名を外す。
 */
export function buildThemeTitle(args: {
  scope: ThemeScope;
  themeTitle: string;
  labels: string[];
  areaName?: string;
}): string {
  const { scope, themeTitle, labels, areaName } = args;
  for (const n of [labels.length, 1, 0]) {
    const title = titleFor(scope, themeTitle, labels.slice(0, n), areaName);
    if (title.length <= TITLE_MAX_CHARS || n === 0) return title;
  }
  return titleFor(scope, themeTitle, [], areaName);
}

/** 主な指標の最新年の 1 位・最下位 (都道府県) */
export interface ThemeLeadFact {
  itemName: string;
  unit: string;
  yearName: string;
  top: { areaName: string; value: number };
  bottom: { areaName: string; value: number };
  /** 1 位 ÷ 最下位 (どちらかが 0 以下なら null) */
  ratio: string | null;
}

function formatValue(value: number): string {
  return value.toLocaleString("ja-JP", { maximumFractionDigits: 2 });
}

/** 指標の項目と最新年の値から 1 位・最下位を作る。値が 2 県未満なら null */
export function leadFactFromValues(item: RankingItem, values: RankingValue[]): ThemeLeadFact | null {
  const prefValues = filterOutNationalArea(values).filter(
    (v): v is RankingValue & { value: number } => typeof v.value === "number" && Number.isFinite(v.value),
  );
  if (prefValues.length < 2) return null;
  const sorted = [...prefValues].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
  const top = sorted[0];
  const bottom = sorted[sorted.length - 1];
  const ratio = top.value > 0 && bottom.value > 0 ? (top.value / bottom.value).toFixed(1) : null;
  return {
    itemName: getRankingTitle(item),
    unit: item.unit ?? "",
    yearName: item.latestYear?.yearName ?? "",
    top: { areaName: top.areaName, value: top.value },
    bottom: { areaName: bottom.areaName, value: bottom.value },
    ratio,
  };
}

/** 題を作る段階 (generateMetadata) で、主な指標 1 つの最新年の値を読む (2 回の R2 読み込み)。読めなければ null */
export async function readThemeLeadFact(themeKey: string): Promise<ThemeLeadFact | null> {
  const [key] = themeLeadRankingKeys(themeKey, 1);
  if (!key) return null;
  try {
    const itemResult = await readRankingItemFromR2(key, "prefecture");
    const item = isOk(itemResult) ? itemResult.data : null;
    const yearCode = item?.latestYear?.yearCode;
    if (!item || !yearCode) return null;
    const valuesResult = await readRankingValuesFromR2(key, "prefecture", yearCode);
    return isOk(valuesResult) ? leadFactFromValues(item, valuesResult.data) : null;
  } catch {
    return null;
  }
}

/** 説明文。テーマの説明に、比べられる指標と主な指標の 1 位・最下位を足す (検索結果で中身が分かるように) */
export function buildThemeDescription(args: {
  scope: ThemeScope;
  base: string;
  labels: string[];
  fact?: ThemeLeadFact | null;
  areaName?: string;
}): string {
  const { scope, base, labels, fact, areaName } = args;
  const list = labels.join("・");
  const what =
    scope === "national"
      ? list && `${list}などの全国の推移と、都道府県ごとの値を確認できます。`
      : scope === "area"
        ? list && `${areaName}の${list}などの全国順位と推移を確認できます。`
        : scope === "japan"
          ? list && `${list}などの全国の推移を確認できます。`
          : list && `${list}などを市区町村のランキングで比較できます。`;
  const factText =
    fact && scope === "national"
      ? `${fact.yearName ? `${fact.yearName}の` : ""}${fact.itemName}は1位${fact.top.areaName}（${formatValue(fact.top.value)}${fact.unit}）、最下位${fact.bottom.areaName}（${formatValue(fact.bottom.value)}${fact.unit}）${fact.ratio ? `で${fact.ratio}倍の差` : ""}。`
      : "";
  return [base, what, factText].filter(Boolean).join("");
}

/** 全国のページの Q&A: 主な指標ごとの「1 位はどこか・最下位はどこか」 (詳しい比較はランキングのページへ案内する) */
export function buildThemeFaqItems(facts: ThemeLeadFact[]): { q: string; a: string }[] {
  return facts.flatMap((f) => {
    const year = f.yearName ? `${f.yearName}の` : "";
    const top = `${f.top.areaName}（${formatValue(f.top.value)}${f.unit}）`;
    const bottom = `${f.bottom.areaName}（${formatValue(f.bottom.value)}${f.unit}）`;
    return [
      { q: `${f.itemName}が最も高い都道府県はどこですか？`, a: `${year}${f.itemName}の1位は${top}です。` },
      {
        q: `${f.itemName}が最も低い都道府県はどこですか？`,
        a: `${year}${f.itemName}の最下位は${bottom}です。${f.ratio ? `1位とは約${f.ratio}倍の差があります。` : ""}`,
      },
    ];
  });
}

/** 県のページの Q&A: 主な指標ごとの「この県は全国何位か」 */
export function buildAreaThemeFaqItems(
  areaName: string,
  rows: { itemName: string; unit: string; yearName: string; value: number; rank: number; total: number }[],
): { q: string; a: string }[] {
  return rows.map((r) => ({
    q: `${areaName}の${r.itemName}は全国何位ですか？`,
    a: `${r.yearName ? `${r.yearName}の` : ""}${areaName}の${r.itemName}は${formatValue(r.value)}${r.unit}で、${r.total}都道府県中${r.rank}位です。`,
  }));
}

/** FAQPage の構造化データ。Q&A が無ければ null */
export function buildFaqStructuredData(items: { q: string; a: string }[]): object | null {
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}
