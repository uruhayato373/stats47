/**
 * 地域コード変換・検証ユーティリティ
 */

import type { AreaType, AreaValidationResult } from "../types";

/**
 * 地域コードから地域タイプを判定
 */
export function determineAreaType(areaCode: string): AreaType {
  if (!areaCode || typeof areaCode !== "string") {
    throw new Error("Invalid area code: must be a non-empty string");
  }

  // 国レベル
  if (areaCode === "00000") return "national";

  // 都道府県レベル（末尾が000）
  if (areaCode.endsWith("000") && areaCode.length === 5) {
    return "prefecture";
  }

  // 市区町村レベル
  if (areaCode.length === 5) {
    return "city";
  }

  throw new Error(`Invalid area code format: ${areaCode}`);
}

/**
 * 市区町村コードから親都道府県コードを取得（5桁形式）
 */
export function deriveParentPrefectureCode(areaCode: string): string {
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
export function deriveDesignatedCityCode(municCode: string): string | null {
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
  level: "prefecture" | "city" | "both",
  parentCode?: string
) {
  return (areaCode: string): boolean => {
    const areaType = determineAreaType(areaCode);

    switch (level) {
      case "prefecture":
        return areaType === "prefecture";

      case "city":
        if (areaType !== "city") return false;

        // 特定都道府県内のみ
        if (parentCode) {
          const prefCode = deriveParentPrefectureCode(areaCode);
          return prefCode === parentCode;
        }

        return true;

      case "both":
        return areaType === "prefecture" || areaType === "city";

      default:
        return false;
    }
  };
}

// ============================================================================
// バリデーション関数
// ============================================================================

/**
 * 地域コードの包括的な検証
 */
export function validateArea(areaCode: string): AreaValidationResult {
  // 基本的な検証
  if (!areaCode || typeof areaCode !== "string") {
    return {
      isValid: false,
      message: "Area code must be a non-empty string",
      details: {
        code: areaCode,
        expectedFormat: "5-digit string",
        actualFormat: typeof areaCode,
      },
    };
  }

  // 数字以外の文字が含まれていないかチェック
  if (!/^\d+$/.test(areaCode)) {
    return {
      isValid: false,
      message: "Area code must contain only digits",
      details: {
        code: areaCode,
        expectedFormat: "numeric string",
        actualFormat: "contains non-numeric characters",
      },
    };
  }

  // 長さチェック
  if (areaCode.length !== 2 && areaCode.length !== 5) {
    return {
      isValid: false,
      message: "Area code must be 2 or 5 digits",
      details: {
        code: areaCode,
        expectedFormat: "2 or 5 digits",
        actualFormat: `${areaCode.length} digits`,
      },
    };
  }

  // 国コード
  if (areaCode === "00000") {
    return {
      isValid: true,
      areaType: "national",
      message: "Valid country code",
    };
  }

  // 都道府県コード範囲チェック
  const prefCode = parseInt(areaCode.substring(0, 2), 10);
  if (prefCode < 1 || prefCode > 47) {
    return {
      isValid: false,
      message: "Prefecture code must be between 01 and 47",
      details: {
        code: areaCode,
        expectedFormat: "01-47",
        actualFormat: prefCode.toString(),
      },
    };
  }

  // 地域タイプを判定
  let areaType: AreaType;
  try {
    areaType = determineAreaType(areaCode);
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : "Unknown error",
      details: {
        code: areaCode,
        expectedFormat: "valid area code",
        actualFormat: "invalid format",
      },
    };
  }

  return {
    isValid: true,
    areaType,
    message: `Valid ${areaType} code`,
  };
}

/**
 * 都道府県コードの検証
 */
export function validatePrefectureCode(prefCode: string): AreaValidationResult {
  // 2桁コードも許可
  if (prefCode.length === 2 && /^\d{2}$/.test(prefCode)) {
    const prefCodeNum = parseInt(prefCode, 10);
    if (prefCodeNum >= 1 && prefCodeNum <= 47) {
      return {
        isValid: true,
        areaType: "prefecture",
        message: "Valid prefecture code (2-digit)",
      };
    }
  }

  const result = validateArea(prefCode);

  if (!result.isValid) {
    return result;
  }

  // 都道府県コードであることを確認
  if (result.areaType !== "prefecture") {
    return {
      isValid: false,
      message: "Not a prefecture code",
      details: {
        code: prefCode,
        expectedFormat: "XX000 (prefecture)",
        actualFormat: result.areaType || "unknown",
      },
    };
  }

  return result;
}

/**
 * 市区町村コードの検証
 */
export function validateCityCode(municCode: string): AreaValidationResult {
  const result = validateArea(municCode);

  if (!result.isValid) {
    return result;
  }

  // 市区町村コードであることを確認
  if (result.areaType !== "city") {
    return {
      isValid: false,
      message: "Not a municipality code",
      details: {
        code: municCode,
        expectedFormat: "XXXXX (municipality)",
        actualFormat: result.areaType || "unknown",
      },
    };
  }

  return result;
}

/**
 * 都道府県名の検証
 */
export function validatePrefectureName(prefName: string): boolean {
  if (!prefName || typeof prefName !== "string") {
    return false;
  }

  // 基本的な長さチェック（2-4文字 + 都/道/府/県）
  if (prefName.length < 3 || prefName.length > 5) {
    return false;
  }

  // 末尾が都/道/府/県で終わっているかチェック
  const suffix = prefName.charAt(prefName.length - 1);
  return ["都", "道", "府", "県"].includes(suffix);
}

/**
 * 地域コード配列の一括検証
 */
export function validateAreaCodes(
  areaCodes: string[]
): Map<string, AreaValidationResult> {
  const results = new Map<string, AreaValidationResult>();

  for (const code of areaCodes) {
    results.set(code, validateArea(code));
  }

  return results;
}

/**
 * 地域コード配列が全て有効かチェック
 */
export function areAllCodesValid(areaCodes: string[]): boolean {
  return areaCodes.every((code) => validateAreaCode(code));
}
