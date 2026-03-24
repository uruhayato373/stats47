/**
 * テキスト幅推定とフォントサイズ調整のユーティリティ関数
 */
/**
 * テキストの幅を推定（簡易版）
 *
 * 日本語文字は約1.2倍、英数字は約0.6倍の幅を想定して計算します。
 *
 * @param text - 測定するテキスト
 * @param fontSize - フォントサイズ
 * @returns 推定されたテキスト幅（ピクセル）
 */
export declare function estimateTextWidth(text: string, fontSize: number): number;
/**
 * テキストが横幅に収まるようにフォントサイズを調整
 *
 * @param text - 調整するテキスト
 * @param maxWidth - 最大幅（ピクセル）
 * @param initialSize - 初期フォントサイズ
 * @param minSize - 最小フォントサイズ（デフォルト: 20）
 * @param step - フォントサイズの減算ステップ（デフォルト: 5）
 * @returns 調整されたフォントサイズ
 */
export declare function adjustFontSizeToFit(text: string, maxWidth: number, initialSize: number, minSize?: number, step?: number): number;
