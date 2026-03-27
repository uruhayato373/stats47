/**
 * e-Stat yearCode（例: "2024100000"）から表示用年度文字列を生成
 *
 * - 10桁コードの場合: 先頭4桁 + 5桁目が "1" なら "年度"、それ以外は "年"
 * - 4桁の場合: そのまま "年" を付与
 * - それ以外（既に "2022年度" 等）: そのまま返す
 */
export declare function formatYear(yearCode: string): string;
