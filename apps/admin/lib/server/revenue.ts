import "server-only";

import fs from "node:fs";

import {
  cached,
  fileExists,
  readCsv,
  readJson,
  readText,
  statePath,
  TTL,
  wrap,
  type Wrapped,
} from "./state-io";

/**
 * 収益。★「未計測」を「0 円」として出さない。
 * 商品売上は証拠ファイルのsha256を持つ sales-ledger.json だけを実測として扱う。
 */

const ADSENSE = ".claude/state/metrics/adsense";

export interface RevenueChannel {
  channel: string;
  /** measured = 実測値がある / unmeasured = 計測経路が無い */
  state: "measured" | "unmeasured";
  note: string;
}

/** 計測範囲。画面の冒頭バナーで必ず出す */
interface ProductSalesObservation {
  id: string;
  channel: "kdp" | "coconala";
  productId: string;
  periodStart: string;
  periodEnd: string;
  orders: number;
  units: number;
  netRevenueYen: number;
  refunds: number;
  kenpRead?: number;
  evidencePath: string;
  evidenceSha256: string;
  recordedAt: string;
}

interface ProductSalesLedger {
  schemaVersion: 1;
  observations: ProductSalesObservation[];
}

export interface ProductSalesSummary {
  observations: ProductSalesObservation[];
  netRevenueYen: number;
  orders: number;
  units: number;
  latestPeriodEnd: string | null;
}

export interface AdsenseWeek {
  week: string;
  earnings: number;
  page_views: number;
  rpm: number;
  impressions: number;
  clicks: number;
  ctr: number;
  [k: string]: string | number;
}

export interface BreakdownTable {
  file: string;
  label: string;
  latestWeek: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
}

export interface RevenueSummary {
  adsense: Wrapped<{ columns: string[]; weeks: AdsenseWeek[] }>;
  breakdowns: Wrapped<BreakdownTable[]>;
  latestMd: Wrapped<string>;
  impactMd: Wrapped<string>;
  candidates: Wrapped<{ week: string | null; candidates: Array<Record<string, unknown>> }>;
  productSales: Wrapped<ProductSalesSummary>;
  coverage: RevenueChannel[];
}

const BREAKDOWNS: Array<{ file: string; label: string; key: string }> = [
  { file: "history-devices.csv", label: "デバイス別", key: "platform" },
  { file: "history-units.csv", label: "ユニット別", key: "ad_unit" },
  { file: "history-formats.csv", label: "フォーマット別", key: "ad_format" },
  { file: "history-placements.csv", label: "配置別", key: "placement" },
  { file: "history-bid-types.csv", label: "入札型別", key: "bid_type" },
];

function readAdsense(): RevenueSummary["adsense"] {
  return wrap(() => {
    const rows = readCsv(`${ADSENSE}/history.csv`) as unknown as AdsenseWeek[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];
    // 新しい週を上に (直近を見たいので)
    const weeks = [...rows].sort((a, b) => String(b.week).localeCompare(String(a.week)));
    return { columns, weeks };
  });
}

/** 内訳 CSV は最新週だけ出す (全週を並べても読めない) */
function readBreakdowns(): RevenueSummary["breakdowns"] {
  return wrap(() => {
    const out: BreakdownTable[] = [];
    for (const b of BREAKDOWNS) {
      if (!fileExists(`${ADSENSE}/${b.file}`)) continue;
      const rows = readCsv(`${ADSENSE}/${b.file}`);
      if (rows.length === 0) continue;
      const latestWeek = String(
        rows.reduce((max, r) => (String(r.week) > max ? String(r.week) : max), ""),
      );
      const latest = rows
        .filter((r) => String(r.week) === latestWeek)
        .sort((a, b2) => Number(b2.earnings ?? 0) - Number(a.earnings ?? 0));
      out.push({
        file: b.file,
        label: b.label,
        latestWeek,
        columns: Object.keys(rows[0]),
        rows: latest,
      });
    }
    return out;
  });
}

function readMd(rel: string): Wrapped<string> {
  return wrap(() => {
    if (!fileExists(rel)) throw new Error(`${rel} が無い`);
    return readText(rel);
  });
}

function readCandidates(): RevenueSummary["candidates"] {
  return wrap(() => {
    const rel = `${ADSENSE}/candidates-latest.json`;
    if (!fs.existsSync(statePath(rel))) throw new Error("candidates-latest.json が無い");
    const d = readJson<Record<string, any>>(rel);
    return { week: d.week ?? null, candidates: d.candidates ?? [] };
  });
}

function readProductSales(): RevenueSummary["productSales"] {
  return wrap(() => {
    const ledger = readJson<ProductSalesLedger>(
      ".claude/state/products/sales-ledger.json",
    );
    if (ledger.schemaVersion !== 1 || !Array.isArray(ledger.observations)) {
      throw new Error("sales-ledger.json のschemaが不正");
    }
    const observations = [...ledger.observations].sort((a, b) =>
      b.periodEnd.localeCompare(a.periodEnd),
    );
    return {
      observations,
      netRevenueYen: observations.reduce((sum, row) => sum + row.netRevenueYen, 0),
      orders: observations.reduce((sum, row) => sum + row.orders, 0),
      units: observations.reduce((sum, row) => sum + row.units, 0),
      latestPeriodEnd: observations[0]?.periodEnd ?? null,
    };
  });
}

function readPublishedCounts(): { kindle: number; coconala: number } {
  const kdp = readJson<{
    listings: Record<string, { kdpStatus?: string; asin?: string | null }>;
  }>(".claude/config/kdp-listings.json");
  const coconala = readJson<{
    listings: Record<string, { status?: string; serviceUrl?: string | null }>;
  }>(".claude/config/coconala-listings.json");
  return {
    kindle: Object.values(kdp.listings).filter(
      (row) => row.kdpStatus === "live" && Boolean(row.asin),
    ).length,
    coconala: Object.values(coconala.listings).filter(
      (row) => row.status === "listed" && Boolean(row.serviceUrl),
    ).length,
  };
}

function revenueCoverage(
  productSales: RevenueSummary["productSales"],
): RevenueChannel[] {
  const counts = wrap(readPublishedCounts);
  const observations = "error" in productSales ? [] : productSales.observations;
  const kindlePeriods = observations.filter((row) => row.channel === "kdp").length;
  const coconalaPeriods = observations.filter((row) => row.channel === "coconala").length;
  const kindleCount = "error" in counts ? "?" : String(counts.kindle);
  const coconalaCount = "error" in counts ? "?" : String(counts.coconala);

  return [
    { channel: "AdSense", state: "measured", note: "週次 CSV (history.csv ほか 5 種)" },
    {
      channel: "アフィリエイト",
      state: "unmeasured",
      note: "成果 state 未作成。GA4 の表示・クリックは売上ではない",
    },
    {
      channel: "Kindle (KDP)",
      state: kindlePeriods > 0 ? "measured" : "unmeasured",
      note: `${kindleCount}冊販売中・証拠付き販売期間 ${kindlePeriods}件`,
    },
    {
      channel: "ココナラ",
      state: coconalaPeriods > 0 ? "measured" : "unmeasured",
      note: `${coconalaCount}商品公開中・証拠付き販売期間 ${coconalaPeriods}件`,
    },
  ];
}

export function revenueSummary(): RevenueSummary {
  // 週次更新なので 60 秒で読み直しても意味がない
  return cached("revenue", TTL.weekly, () => {
    const productSales = readProductSales();
    return {
      adsense: readAdsense(),
      breakdowns: readBreakdowns(),
      latestMd: readMd(`${ADSENSE}/LATEST.md`),
      impactMd: readMd(`${ADSENSE}/impact-LATEST.md`),
      candidates: readCandidates(),
      productSales,
      coverage: revenueCoverage(productSales),
    };
  });
}
