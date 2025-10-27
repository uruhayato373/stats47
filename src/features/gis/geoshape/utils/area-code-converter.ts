/**
 * Geoshapeドメイン - 地域コード変換ユーティリティ
 * 5桁の地域コードと2桁の都道府県コードの相互変換
 */

import type { AreaType } from "../types/index";

/**
 * 5桁の地域コードから2桁の都道府県コードを抽出
 * @param areaCode 地域コード（5桁）例: "28000"
 * @returns 都道府県コード（2桁）例: "28"
 */
export function extractPrefCodeFrom5Digit(areaCode: string): string {
  if (!/^\d{5}$/.test(areaCode)) {
    throw new Error(`Invalid 5-digit area code: ${areaCode}`);
  }
  return areaCode.substring(0, 2);
}

/**
 * 2桁の都道府県コードから5桁の地域コードに変換
 * @param prefCode 都道府県コード（2桁）例: "28"
 * @returns 地域コード（5桁）例: "28000"
 */
export function convertPrefCodeTo5Digit(prefCode: string): string {
  if (!/^\d{2}$/.test(prefCode)) {
    throw new Error(`Invalid 2-digit pref code: ${prefCode}`);
  }
  return `${prefCode}000`;
}

/**
 * 地域コードから地域タイプを判定
 * @param areaCode 地域コード（5桁）
 * @returns 地域タイプ
 */
export function determineAreaTypeFromCode(areaCode: string): AreaType {
  if (areaCode === "00000") return "national";
  if (areaCode.endsWith("000")) return "prefecture";
  return "city";
}

/**
 * 地域コードの妥当性をチェック
 * @param areaCode 地域コード
 * @returns 妥当な場合true
 */
export function validateAreaCode(areaCode: string): boolean {
  return /^\d{5}$/.test(areaCode);
}

/**
 * 都道府県コードの妥当性をチェック
 * @param prefCode 都道府県コード
 * @returns 妥当な場合true
 */
export function validatePrefCode(prefCode: string): boolean {
  return /^\d{2}$/.test(prefCode);
}
