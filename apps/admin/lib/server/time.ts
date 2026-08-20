import "server-only";

/**
 * JST 基準の日付ユーティリティ (旧 server.mjs の jstNow / jstDateStr / weekStartJst /
 * monthStartJst を忠実移植)。UTC+9 に平行移動した Date を使い、getUTC* で JST 曜日/日付を得る。
 */
export function jstNow(): Date {
  return new Date(Date.now() + 9 * 3600 * 1000);
}

export function jstDateStr(d: Date = jstNow()): string {
  return d.toISOString().slice(0, 10);
}

/** JST 基準の今週月曜 (YYYY-MM-DD)。 */
export function weekStartJst(): string {
  const d = jstNow();
  const dow = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() - (dow - 1));
  return d.toISOString().slice(0, 10);
}

/** JST 基準の今月 1 日 (YYYY-MM-DD)。 */
export function monthStartJst(): string {
  return jstDateStr().slice(0, 8) + "01";
}
