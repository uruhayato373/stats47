/**
 * パフォーマンス計測ユーティリティ
 *
 * 関数の実行時間を計測し、ログに記録するためのユーティリティ。
 * 注意: このパッケージは logger に依存しないため、計測結果は返すのみ。
 * ログ記録は呼び出し側で行う。
 */

/**
 * パフォーマンス計測の開始
 *
 * @returns 開始時刻（performance.now()の値）
 */
export function startPerformanceMeasurement(): number {
  return performance.now();
}

/**
 * パフォーマンス計測の結果を取得（ログ記録なし）
 *
 * @param startTime - 開始時刻
 * @returns 処理時間（ミリ秒）
 */
export function getPerformanceMeasurement(startTime: number): number {
  return performance.now() - startTime;
}

/**
 * パフォーマンス計測の結果を文字列として取得
 *
 * @param startTime - 開始時刻
 * @returns 処理時間の文字列（小数点以下2桁）
 */
export function getPerformanceMeasurementString(startTime: number): string {
  return getPerformanceMeasurement(startTime).toFixed(2);
}
