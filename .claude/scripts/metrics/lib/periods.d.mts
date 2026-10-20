// periods.mjs の型宣言 (TS から読む関数だけ。config/datasets.d.mts と同じ置き方)。
// ISO 週・JST の暦日の正本 (SCRIPT-ISO-WEEK-UNIFY-01)。TS から別の関数を使うときはここへ足す。

/** 日付ラベル (YYYY-MM-DD) に日数を足した日付ラベル */
export declare function addDays(dateStr: string, days: number): string;
/** 時刻を JST の暦日 (YYYY-MM-DD) に直す。省略時は現在時刻 */
export declare function jstDateOf(now?: Date | number | string): string;
/** 日付ラベル (JST の暦日) → ISO 週 "YYYY-Www" */
export declare function isoWeekOf(dateStr: string): string;
/** ISO 週 "YYYY-Www" → その週の月曜・日曜 (日付ラベル)。存在しない週は例外 */
export declare function isoWeekRange(week: string): { monday: string; sunday: string };
