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
export function estimateTextWidth(text, fontSize) {
    // 日本語文字は約1.2倍、英数字は約0.6倍の幅を想定
    const japaneseChars = (text.match(/[^\x00-\x7F]/g) || []).length;
    const asciiChars = text.length - japaneseChars;
    return (japaneseChars * fontSize * 1.2) + (asciiChars * fontSize * 0.6);
}
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
export function adjustFontSizeToFit(text, maxWidth, initialSize, minSize = 20, step = 5) {
    let fontSize = initialSize;
    let width = estimateTextWidth(text, fontSize);
    // 横幅を超える場合は縮小
    while (width > maxWidth && fontSize > minSize) {
        fontSize -= step;
        width = estimateTextWidth(text, fontSize);
    }
    return fontSize;
}
