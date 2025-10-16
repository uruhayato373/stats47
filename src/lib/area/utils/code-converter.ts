/**
 * 地域コード変換ユーティリティ
 */

import type { AreaType } from "../types";

/**
 * 地域コードから地域タイプを判定
 */
export function getAreaType(areaCode: string): AreaType {
  if (!areaCode || typeof areaCode !== "string") {
    throw new Error("Invalid area code: must be a non-empty string");
  }

  // 国レベル
  if (areaCode === "00000") return "country";

  // 都道府県レベル（末尾が000）
  if (areaCode.endsWith("000") && areaCode.length === 5) {
    return "prefecture";
  }

  // 市区町村レベル
  if (areaCode.length === 5) {
    return "municipality";
  }

  throw new Error(`Invalid area code format: ${areaCode}`);
}

/**
 * 市区町村コードから親都道府県コードを取得（5桁形式）
 */
export function getParentPrefectureCode(areaCode: string): string {
  if (!areaCode || areaCode.length < 5) {
    throw new Error("Invalid area code: must be at least 5 characters");
  }

  const prefCode = areaCode.substring(0, 2);
  return `${prefCode}000`;
}

/**
 * 2桁の都道府県コードを5桁形式に変換
 */
export function normalizePrefectureCode(prefCode: string): string {
  if (!prefCode) {
    throw new Error("Prefecture code is required");
  }

  // 既に5桁の場合
  if (prefCode.length === 5) {
    return prefCode;
  }

  // 2桁の場合は000を付加
  if (prefCode.length === 2) {
    return `${prefCode}000`;
  }

  throw new Error(`Invalid prefecture code format: ${prefCode}`);
}

/**
 * 5桁の地域コードから2桁の都道府県コードを抽出
 */
export function extractPrefectureCode(areaCode: string): string {
  if (!areaCode || areaCode.length < 2) {
    throw new Error("Invalid area code: must be at least 2 characters");
  }

  return areaCode.substring(0, 2);
}

/**
 * 地域コードの妥当性を検証
 */
export function validateAreaCode(areaCode: string): boolean {
  if (!areaCode || typeof areaCode !== "string") {
    return false;
  }

  // 国コード
  if (areaCode === "00000") {
    return true;
  }

  // 5桁の地域コード
  if (areaCode.length === 5 && /^\d{5}$/.test(areaCode)) {
    const prefCode = parseInt(areaCode.substring(0, 2), 10);
    return prefCode >= 1 && prefCode <= 47;
  }

  // 2桁の都道府県コード
  if (areaCode.length === 2 && /^\d{2}$/.test(areaCode)) {
    const prefCode = parseInt(areaCode, 10);
    return prefCode >= 1 && prefCode <= 47;
  }

  return false;
}

/**
 * 地域コードを正規化（2桁→5桁、全角→半角等）
 */
export function normalizeAreaCode(areaCode: string): string {
  if (!areaCode) {
    throw new Error("Area code is required");
  }

  // 全角数字を半角に変換
  let normalized = areaCode.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );

  // 空白を除去
  normalized = normalized.trim();

  // 2桁の都道府県コードの場合は5桁に変換
  if (normalized.length === 2 && /^\d{2}$/.test(normalized)) {
    normalized = normalizePrefectureCode(normalized);
  }

  return normalized;
}

/**
 * 市区町村コードから政令指定都市コードを取得
 * 区の場合は親の市コードを返す
 */
export function getDesignatedCityCode(municCode: string): string | null {
  if (!municCode || municCode.length !== 5) {
    return null;
  }

  const prefCode = municCode.substring(0, 2);
  const cityCode = municCode.substring(2, 5);

  // 区（101-999）の場合は親の市コード（100）を返す
  if (parseInt(cityCode, 10) > 100) {
    return `${prefCode}100`;
  }

  return null;
}

/**
 * 地域コードが政令指定都市の区かどうかを判定
 */
export function isDesignatedCityWard(municCode: string): boolean {
  if (!municCode || municCode.length !== 5) {
    return false;
  }

  const cityCode = parseInt(municCode.substring(2, 5), 10);
  return cityCode > 100 && cityCode < 200;
}

/**
 * 地域レベルに応じたフィルタリング関数を生成
 */
export function createAreaFilter(
  level: "prefecture" | "municipality" | "both",
  parentCode?: string
) {
  return (areaCode: string): boolean => {
    const areaType = getAreaType(areaCode);

    switch (level) {
      case "prefecture":
        return areaType === "prefecture";

      case "municipality":
        if (areaType !== "municipality") return false;

        // 特定都道府県内のみ
        if (parentCode) {
          const prefCode = getParentPrefectureCode(areaCode);
          return prefCode === parentCode;
        }

        return true;

      case "both":
        return areaType === "prefecture" || areaType === "municipality";

      default:
        return false;
    }
  };
}
