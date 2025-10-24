/**
 * 地域コードバリデーション・変換ユーティリティ
 * 都道府県コードの形式検証とコード変換を行う
 */

// ============================================================================
// 地域コードバリデーション
// ============================================================================

/**
 * 都道府県コードの形式を検証
 * @param code 検証する都道府県コード（2桁）
 * @returns 有効な場合true
 */
export function isValidPrefectureCode(code: string): boolean {
  return /^\d{2}$/.test(code);
}

// ============================================================================
// コード変換
// ============================================================================

/**
 * 都道府県コードを地域コードに変換
 * @param prefCode 都道府県コード（2桁）
 * @returns 地域コード（5桁）
 */
export function prefectureCodeToAreaCode(prefCode: string): string {
  if (!isValidPrefectureCode(prefCode)) {
    throw new Error(`Invalid prefecture code format: ${prefCode}`);
  }
  return `${prefCode}000`;
}

/**
 * 地域コードから都道府県コードを抽出
 * @param areaCode 地域コード（5桁）
 * @returns 都道府県コード（2桁）
 */
export function areaCodeToPrefectureCode(areaCode: string): string {
  if (!/^\d{5}$/.test(areaCode)) {
    throw new Error(`Invalid area code format: ${areaCode}`);
  }
  return areaCode.substring(0, 2);
}

/**
 * 地域コードを正規化
 * @param code 地域コード
 * @returns 正規化された地域コード
 */
export function normalizeAreaCode(code: string): string {
  // 数値のみを抽出
  const numericCode = code.replace(/\D/g, "");

  // 5桁にパディング
  return numericCode.padStart(5, "0");
}

/**
 * 市区町村タイプを判定
 * @param name 市区町村名
 * @returns 市区町村タイプ
 */
export function detectMunicipalityType(
  name: string
): "city" | "ward" | "town" | "village" {
  if (name.includes("市")) return "city";
  if (name.includes("区")) return "ward";
  if (name.includes("町")) return "town";
  if (name.includes("村")) return "village";

  // デフォルトは市
  return "city";
}
