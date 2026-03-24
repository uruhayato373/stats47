/**
 * 表示用に数値をフォーマットする
 * - 整数値の場合は小数点以下を表示しない
 * - 小数値の場合は適切な桁数で表示（末尾の0を削除）
 * - カンマ区切りを適用
 */
export declare function formatNumberForDisplay(value: number, options?: {
    maxDecimalPlaces?: number;
}): string;
