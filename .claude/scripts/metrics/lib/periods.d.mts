// periods.mjs の型宣言 (config/datasets.d.mts と同じ置き方)。
// ISO 週・JST の暦日の正本 (SCRIPT-ISO-WEEK-UNIFY-01)。TS も型検査する JS (.claude/scripts/tsconfig.checkjs.json) も
// periods.mjs ではなくこの宣言を読むので、periods.mjs に export を足したらここにも足す。

/** 取得遅延日数の SSOT (検索成長の期間契約) */
export declare const DATA_DELAY_DAYS: Readonly<{ gsc: number; ga4: number; adsense: number }>;
/** 施策効果判定の窓 (日数) */
export declare const EFFECT_WINDOW_DAYS: readonly number[];

export interface Period {
  periodStart: string;
  periodEnd: string;
  windowDays: number;
}

/** 日付ラベル (YYYY-MM-DD) に日数を足した日付ラベル */
export declare function addDays(dateStr: string, days: number): string;
/** 時刻を JST の暦日 (YYYY-MM-DD) に直す。省略時は現在時刻 */
export declare function jstDateOf(now?: Date | number | string): string;
/** 日付ラベル (JST の暦日) → ISO 週 "YYYY-Www" */
export declare function isoWeekOf(dateStr: string): string;
/** ISO 週 "YYYY-Www" → その週の月曜・日曜 (日付ラベル)。存在しない週は例外 */
export declare function isoWeekRange(week: string): { monday: string; sunday: string };

/** 週次期間契約の解決。source の取得遅延を織り込み、finalized7d / previous7d / rolling28d を返す */
export declare function resolvePeriods(p: {
  source: "gsc" | "ga4" | "adsense";
  week?: string | null;
  asOf?: string | null;
  now?: Date | number | string;
}): {
  source: string;
  weekId: string;
  anchor: string;
  delayDays: number;
  finalized7d: Period;
  previous7d: Period;
  rolling28d: Period;
};

/** 施策効果判定の 14/28/56 日スケジュール ({ day14, day28, day56 }) */
export declare function effectWindows(baselineEnd: string): Record<string, string>;
/** 期間内の全日付ラベル */
export declare function expectedDates(period: { periodStart: string; periodEnd: string }): string[];
/** 日別行の欠損を判定する。欠損日を 0 補完しない */
export declare function assessDailyCoverage(
  period: { periodStart: string; periodEnd: string },
  presentDates: Iterable<string>,
): {
  status: "complete" | "partial" | "missing";
  missingDates: string[];
  presentCount: number;
  expectedCount: number;
};
/** summary/snapshot に埋める週次期間契約の共通 metadata */
export declare function periodMetadata(p: {
  period: Period;
  source: string;
  isFinalized: boolean;
  generatedAt: string;
  limitations?: string[];
}): Period & { isFinalized: boolean; generatedAt: string; source: string; limitations: string[] };
