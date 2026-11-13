/**
 * 競合の観測 (data/products/competitor-scan.csv・台帳 id products.competitor-scan) の読み取りと集計。React とファイル入出力に依存しない純モジュール。
 *
 * 関心の目安 (欲しいもの・評価数・スキ) は販売面ごとに数え方が違い、販売数でもない。だから順位は同じ販売面の中だけで付け、
 * 取れなかった値 (空のセル) は 0 に読み替えず null のまま持つ。再調査は同じ CSV に行を追記するので、同じ URL は最新の観測 1 行にまとめ、
 * 観測日が 2 つ以上あるときだけ 1 つ前の観測との差を出す。
 */

export type CompetitorCategory = "stats-data" | "map" | "commission" | "other" | "unclassified";

export type CompetitorObservation = {
  observedAt: string;
  platform: string;
  /** 観測に使った検索語 (販売面の検索画面に入れた語、または取得の手段) */
  query: string;
  seller: string;
  title: string;
  priceYen: number | null;
  interestMetric: string;
  interestValue: number | null;
  url: string;
  category: CompetitorCategory;
};

/** 出品 1 件 (同じ URL の最新の観測) と、1 つ前の観測との差 */
export type CompetitorListing = CompetitorObservation & {
  previousObservedAt: string | null;
  /** 最新 − 1 つ前。どちらかが未取得、または数え方 (interestMetric) が違うときは null */
  interestDelta: number | null;
};

export type CompetitorFilter = { platform?: string; query?: string; category?: string };
export type FilterOption = { id: string; label: string; count: number };

export type PlatformSummary = {
  id: string;
  label: string;
  count: number;
  byCategory: Record<CompetitorCategory, number>;
  /** 価格が取れた出品の数 (価格の幅はこの中だけで出す) */
  priced: number;
  priceMinYen: number | null;
  priceMaxYen: number | null;
  /** この販売面で使った関心の目安の名前 (未取得を含む) */
  interestMetrics: string[];
  /** 関心の目安が取れた出品の上位 */
  top: CompetitorListing[];
};

export type CompetitorView = {
  /** 観測日 (昇順) */
  observedDates: string[];
  hasTrend: boolean;
  /** 絞り込む前の出品の数 */
  total: number;
  filter: Required<{ [K in keyof CompetitorFilter]: string | null }>;
  listings: CompetitorListing[];
  platforms: PlatformSummary[];
  byCategory: Record<CompetitorCategory, number>;
  options: { platforms: FilterOption[]; queries: FilterOption[]; categories: FilterOption[] };
};

const PLATFORM_LABELS: Record<string, string> = { booth: "BOOTH", coconala: "ココナラ", note: "note", lancers: "ランサーズ" };
const PLATFORM_ORDER = Object.keys(PLATFORM_LABELS);

/** 分類は納品物で分ける (定義は config/datasets.mjs の products.competitor-scan と同じ) */
export const COMPETITOR_CATEGORIES: readonly { id: CompetitorCategory; label: string; description: string }[] = [
  { id: "stats-data", label: "統計データ", description: "公的統計や公開データの表・データセットが納品物 (既製のデータ集と、公開データを表にまとめる出品)" },
  { id: "map", label: "地図", description: "既製の地図データ・地図素材・地図ツールが納品物" },
  { id: "commission", label: "受注", description: "依頼ごとに作る作業 (地図作成・Excel 作業・集計・統計解析・可視化・商圏分析)" },
  { id: "other", label: "その他", description: "検索語に掛かったが、統計・地図・データ作業のどれでもない出品" },
  { id: "unclassified", label: "未分類", description: "CSV の category が空、または決めた値でない行" },
];
const KNOWN_CATEGORIES = new Set<string>(COMPETITOR_CATEGORIES.map((c) => c.id).filter((id) => id !== "unclassified"));
const DEFAULT_TOP = 5;

export const platformLabel = (id: string) => PLATFORM_LABELS[id] ?? id;
export const categoryLabel = (id: CompetitorCategory) => COMPETITOR_CATEGORIES.find((c) => c.id === id)?.label ?? id;

const REQUIRED_COLUMNS = ["observed_at", "platform", "query", "seller", "title", "price_yen", "interest_metric", "interest_value", "url", "category"] as const;

/** RFC 4180 の最小実装 (引用符の中のカンマ・改行と "" に対応)。state-io の readCsv は単純な分割で、題名のカンマを列の区切りにしてしまう */
function parseCsvTable(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i += 1) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => !(r.length === 1 && r[0] === ""));
}

/** 空のセルは未取得 (null)。数値でない文字も 0 にせず null にする */
function numberOrNull(cell: string): number | null {
  const trimmed = cell.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed);
  return Number.isFinite(value) ? value : null;
}

export function parseCompetitorScan(csv: string): CompetitorObservation[] {
  const [header = [], ...body] = parseCsvTable(csv);
  const missing = REQUIRED_COLUMNS.filter((column) => !header.includes(column));
  if (missing.length > 0) throw new Error(`競合の観測の CSV に列が無い: ${missing.join("・")}`);
  const at = (cells: string[], column: (typeof REQUIRED_COLUMNS)[number]) => (cells[header.indexOf(column)] ?? "").trim();
  return body.map((cells) => {
    const category = at(cells, "category");
    return {
      observedAt: at(cells, "observed_at"),
      platform: at(cells, "platform"),
      query: at(cells, "query"),
      seller: at(cells, "seller"),
      title: at(cells, "title"),
      priceYen: numberOrNull(at(cells, "price_yen")),
      interestMetric: at(cells, "interest_metric"),
      interestValue: numberOrNull(at(cells, "interest_value")),
      url: at(cells, "url"),
      category: KNOWN_CATEGORIES.has(category) ? (category as CompetitorCategory) : "unclassified",
    };
  });
}

/** 同じ URL の観測を日付順に並べ、最新の 1 行と 1 つ前との差にまとめる */
function toListings(observations: readonly CompetitorObservation[]): CompetitorListing[] {
  const byUrl = new Map<string, Map<string, CompetitorObservation>>();
  for (const observation of observations) {
    const dates = byUrl.get(observation.url) ?? new Map<string, CompetitorObservation>();
    dates.set(observation.observedAt, observation);
    byUrl.set(observation.url, dates);
  }
  return [...byUrl.values()].map((dates) => {
    const history = [...dates.values()].sort((a, b) => a.observedAt.localeCompare(b.observedAt));
    const latest = history[history.length - 1];
    const previous = history.length > 1 ? history[history.length - 2] : null;
    const comparable = previous !== null && latest.interestValue !== null && previous.interestValue !== null && latest.interestMetric === previous.interestMetric;
    return {
      ...latest,
      previousObservedAt: previous?.observedAt ?? null,
      interestDelta: comparable ? (latest.interestValue as number) - (previous.interestValue as number) : null,
    };
  });
}

const platformRank = (id: string) => (PLATFORM_ORDER.includes(id) ? PLATFORM_ORDER.indexOf(id) : PLATFORM_ORDER.length);
const comparePlatform = (a: string, b: string) => platformRank(a) - platformRank(b) || a.localeCompare(b);
/** 関心の目安の大きい順。未取得は末尾 */
const compareInterest = (a: CompetitorListing, b: CompetitorListing) => (b.interestValue ?? -1) - (a.interestValue ?? -1) || a.title.localeCompare(b.title, "ja");

function countBy<T>(rows: readonly T[], key: (row: T) => string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) counts.set(key(row), (counts.get(key(row)) ?? 0) + 1);
  return counts;
}

function categoryCounts(rows: readonly CompetitorListing[]): Record<CompetitorCategory, number> {
  const counts = countBy(rows, (row) => row.category);
  return Object.fromEntries(COMPETITOR_CATEGORIES.map((c) => [c.id, counts.get(c.id) ?? 0])) as Record<CompetitorCategory, number>;
}

function summarizePlatform(id: string, rows: readonly CompetitorListing[], topN: number): PlatformSummary {
  const prices = rows.flatMap((row) => (row.priceYen === null ? [] : [row.priceYen]));
  return {
    id,
    label: platformLabel(id),
    count: rows.length,
    byCategory: categoryCounts(rows),
    priced: prices.length,
    priceMinYen: prices.length > 0 ? Math.min(...prices) : null,
    priceMaxYen: prices.length > 0 ? Math.max(...prices) : null,
    interestMetrics: [...new Set(rows.map((row) => row.interestMetric))],
    top: rows.filter((row) => row.interestValue !== null).sort(compareInterest).slice(0, topN),
  };
}

export function buildCompetitorView(observations: readonly CompetitorObservation[], filter: CompetitorFilter, topN: number = DEFAULT_TOP): CompetitorView {
  const all = toListings(observations);
  const platformCounts = countBy(all, (row) => row.platform);
  const queryCounts = countBy(all, (row) => row.query);
  const allCategories = categoryCounts(all);

  // 選択肢に無い値は絞り込みに使わない (URL の打ち間違いで全件が消えたように見せない)
  const platform = filter.platform && platformCounts.has(filter.platform) ? filter.platform : null;
  const query = filter.query && queryCounts.has(filter.query) ? filter.query : null;
  const category = filter.category && (allCategories[filter.category as CompetitorCategory] ?? 0) > 0 ? filter.category : null;

  const listings = all
    .filter((row) => (platform === null || row.platform === platform) && (query === null || row.query === query) && (category === null || row.category === category))
    .sort((a, b) => comparePlatform(a.platform, b.platform) || compareInterest(a, b));
  const observedDates = [...new Set(observations.map((row) => row.observedAt))].sort();

  return {
    observedDates,
    hasTrend: observedDates.length >= 2,
    total: all.length,
    filter: { platform, query, category },
    listings,
    platforms: [...new Set(listings.map((row) => row.platform))].sort(comparePlatform).map((id) => summarizePlatform(id, listings.filter((row) => row.platform === id), topN)),
    byCategory: categoryCounts(listings),
    options: {
      platforms: [...platformCounts].sort(([a], [b]) => comparePlatform(a, b)).map(([id, count]) => ({ id, label: platformLabel(id), count })),
      queries: [...queryCounts].sort(([a, x], [b, y]) => y - x || a.localeCompare(b, "ja")).map(([id, count]) => ({ id, label: id, count })),
      categories: COMPETITOR_CATEGORIES.filter((c) => c.id !== "unclassified" || allCategories.unclassified > 0).map((c) => ({ id: c.id, label: c.label, count: allCategories[c.id] })),
    },
  };
}
