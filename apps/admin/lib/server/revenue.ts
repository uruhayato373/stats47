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
 * 収益。**実測できるのは AdSense だけ**で、他チャネルは計測経路が無い。
 *
 * ★「未計測」を「0 円」として出さない。A8 の成果 state は未作成
 *   (`.claude/state/metrics/affiliate/` が存在しない)、KDP は 32 冊すべて asin が
 *   null で売上経路が無く、ココナラは手動確認。ここで 0 のカードを並べると
 *   「収益ゼロ」と読めてしまい、実態 (そもそも測っていない) と食い違う。
 */

const ADSENSE = ".claude/state/metrics/adsense";

export interface RevenueChannel {
  channel: string;
  /** measured = 実測値がある / unmeasured = 計測経路が無い */
  state: "measured" | "unmeasured";
  note: string;
}

/** 計測範囲。画面の冒頭バナーで必ず出す */
export const REVENUE_COVERAGE: RevenueChannel[] = [
  { channel: "AdSense", state: "measured", note: "週次 CSV (history.csv ほか 5 種)" },
  {
    channel: "アフィリエイト",
    state: "unmeasured",
    note: "成果 state 未作成。GA4 の impressions / clicks は表示指標であって売上ではない",
  },
  { channel: "Kindle (KDP)", state: "unmeasured", note: "32 冊すべて asin が null。売上取得経路なし" },
  { channel: "ココナラ", state: "unmeasured", note: "手動確認のみ" },
];

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

export function revenueSummary(): RevenueSummary {
  // 週次更新なので 60 秒で読み直しても意味がない
  return cached("revenue", TTL.weekly, () => ({
    adsense: readAdsense(),
    breakdowns: readBreakdowns(),
    latestMd: readMd(`${ADSENSE}/LATEST.md`),
    impactMd: readMd(`${ADSENSE}/impact-LATEST.md`),
    candidates: readCandidates(),
    coverage: REVENUE_COVERAGE,
  }));
}
