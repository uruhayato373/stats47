/**
 * adsense-page-types — AdSense の収益をページ種別 (ランキング・ブログ記事…) ごとに読む週次記録の形 (pure)。
 *
 * 2026-11-12 オーナー依頼「広告のクリックをページの種別ごとに集計・分析できるように」。
 * AdSense のページ別レポート (PAGE_URL) はプライバシーの閾値で毎週 0 行なので使えない。AdSense と GA4 は
 * 2026-10-13 にリンク済みで、GA4 の pagePath × publisherAdImpressions / publisherAdClicks / totalAdRevenue が
 * ページ別に取れる。ページ種別への分類は page-type.mjs (コードの正本) をそのまま使う。
 *
 * - 期間は AdSense の確定 7 日と同じ窓 (periods.mjs の source "adsense") にし、AdSense の合計と照らせるようにする。
 * - 国で絞らない (AdSense の収益は全世界で、絞ると合計が AdSense の画面と合わなくなる)。PV も同じ条件の GA4 の値。
 * - クリックは週に数十回なので、ページ種別の判断には 1,000 PV あたりの収益を使う (クリック率は参考)。
 */
import { aggregateByPageType, PAGE_TYPES } from "./page-type.mjs";

export const PAGE_TYPES_SNAPSHOT_FILE = "page-types.csv";
export const PAGE_TYPES_HISTORY_FILE = "history-page-types.csv";

/** GA4 に投げる指標 (順番は CSV の列と対応させない。列は下の FIELDS) */
export const GA4_PAGE_TYPE_METRICS = Object.freeze([
  "screenPageViews",
  "publisherAdImpressions",
  "publisherAdClicks",
  "totalAdRevenue",
]);

export const PAGE_TYPE_FIELDS = Object.freeze([
  "page_type",
  "pages",
  "page_views",
  "ad_impressions",
  "ad_clicks",
  "revenue_yen",
  "revenue_per_1000_pv",
]);

export const PAGE_TYPE_HISTORY_FIELDS = Object.freeze(["week", ...PAGE_TYPE_FIELDS]);

/** ページ種別の日本語名 (要約の表に出す) */
export const PAGE_TYPE_LABELS = Object.freeze({
  "ranking-detail": "ランキング",
  "blog-detail": "ブログ記事",
  "area-detail": "地域 (県・市区町村)",
  "theme-detail": "テーマ",
  category: "カテゴリ",
  search: "検索",
  home: "ホーム",
  other: "その他",
});

const round = (n, digits) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};

/**
 * GA4 の pagePath 行 (GA4_PAGE_TYPE_METRICS の値を持つ) をページ種別の行にする。
 * 行の並びは収益の多い順。全ページ種別を必ず出す (0 の種別も 0 として残し、欠けと区別する)。
 */
export function buildPageTypeRows(ga4Rows) {
  const agg = aggregateByPageType(ga4Rows, { pathKey: "pagePath", metricKeys: [...GA4_PAGE_TYPE_METRICS] });
  return PAGE_TYPES.map((t) => {
    const a = agg[t];
    const pv = a.screenPageViews;
    return {
      page_type: t,
      pages: a.pages,
      page_views: pv,
      ad_impressions: a.publisherAdImpressions,
      ad_clicks: a.publisherAdClicks,
      revenue_yen: round(a.totalAdRevenue, 2),
      revenue_per_1000_pv: pv > 0 ? round((a.totalAdRevenue / pv) * 1000, 2) : "",
    };
  }).sort((x, y) => y.revenue_yen - x.revenue_yen || (x.page_type < y.page_type ? -1 : 1));
}

/** 履歴 (week 列付き) から、その週と直前の週のページ種別の表 (Markdown の行) を作る。履歴に週が無ければ空配列 */
export function markdownPageTypeSection(historyRows, week) {
  const cur = historyRows.filter((r) => r.week === week);
  if (cur.length === 0) return [];
  const prevWeek = [...new Set(historyRows.map((r) => r.week))].filter((w) => w < week).sort().pop() ?? null;
  const prev = new Map(historyRows.filter((r) => r.week === prevWeek).map((r) => [r.page_type, r]));
  const num = (v) => (v === "" || v === undefined || v === null ? null : Number(v));
  const yen = (v) => (num(v) === null ? "-" : `¥${num(v).toFixed(1)}`);
  const total = cur.reduce(
    (s, r) => ({ pv: s.pv + Number(r.page_views), imp: s.imp + Number(r.ad_impressions), clk: s.clk + Number(r.ad_clicks), rev: s.rev + Number(r.revenue_yen) }),
    { pv: 0, imp: 0, clk: 0, rev: 0 },
  );
  const lines = [];
  lines.push("## ページ種別 (GA4・確定7日と同じ窓・全世界)");
  lines.push("");
  lines.push("| ページ種別 | PV | 広告の表示 | クリック | 収益 | 1,000 PV あたり | 前週の 1,000 PV あたり |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const r of cur) {
    if (Number(r.page_views) === 0 && Number(r.revenue_yen) === 0) continue;
    const p = prev.get(r.page_type);
    lines.push(
      `| ${PAGE_TYPE_LABELS[r.page_type] ?? r.page_type} | ${r.page_views} | ${r.ad_impressions} | ${r.ad_clicks} | ¥${Number(r.revenue_yen).toFixed(0)} | ${yen(r.revenue_per_1000_pv)} | ${p ? yen(p.revenue_per_1000_pv) : "-"} |`,
    );
  }
  lines.push(
    `| 合計 | ${total.pv} | ${total.imp} | ${total.clk} | ¥${total.rev.toFixed(0)} | ${total.pv > 0 ? `¥${((total.rev / total.pv) * 1000).toFixed(1)}` : "-"} | |`,
  );
  lines.push("");
  lines.push("> GA4 の AdSense 連携 (2026-10-13〜) のページ別の値を `page-type.mjs` で分類した。合計は AdSense の値より少なく出る週がある (W43 ¥182 対 ¥210、W44 ¥266 対 ¥313。11-04〜11-10 は ¥596 対 ¥611)。収益の総額は上の AdSense の値を使い、この表はページ種別どうしの比較に使う。クリックは少ないので、判断は 1,000 PV あたりで行う。");
  lines.push("");
  return lines;
}
