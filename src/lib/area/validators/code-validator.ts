/**
 * 地域コードバリデーター
 */

import { getAreaType, validateAreaCode } from "../utils/code-converter";

import type { AreaValidationResult, AreaType } from "../types";

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
      areaType: "country",
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
    areaType = getAreaType(areaCode);
  } catch (error) {
    return {
      isValid: false,
      message: error instanceof Error ? error.message : "Unknown error",
      details: {
        code: areaCode,
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
        actualFormat: result.areaType,
      },
    };
  }

  return result;
}

/**
 * 市区町村コードの検証
 */
export function validateMunicipalityCode(
  municCode: string
): AreaValidationResult {
  const result = validateArea(municCode);

  if (!result.isValid) {
    return result;
  }

  // 市区町村コードであることを確認
  if (result.areaType !== "municipality") {
    return {
      isValid: false,
      message: "Not a municipality code",
      details: {
        code: municCode,
        expectedFormat: "XXXXX (municipality)",
        actualFormat: result.areaType,
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
