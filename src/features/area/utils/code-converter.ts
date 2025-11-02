/**
 * Area Code Converter & Validator
 *
 * 地域コードの変換、正規化、検証を行うユーティリティ関数群。
 * 都道府県コード、市区町村コード、国コードの処理を統一的に扱う。
 *
 * ## 主な機能
 * - 地域コードのタイプ判定（全国/都道府県/市区町村）
 * - 地域コードの変換・正規化（2桁↔5桁、全角→半角）
 * - 親コードの導出（市区町村→都道府県）
 * - 地域コードの妥当性検証（包括的・個別）
 * - 政令指定都市の区の判定・処理
 *
 * @module CodeConverter
 */

import type { AreaType, AreaValidationResult } from "../types";

/**
 * 地域コードから地域タイプを判定
 *
 * 指定された地域コードが全国・都道府県・市区町村のいずれかを判定する。
 *
 * ## 判定規則
 * - `"00000"`: 全国（`"national"`）
 * - 5桁で末尾が `"000"`: 都道府県（`"prefecture"`）
 * - 5桁で末尾が `"000"` 以外: 市区町村（`"city"`）
 *
 * @param {string} areaCode - 地域コード（2桁または5桁形式）
 * @returns {AreaType} 地域タイプ（`"national" | "prefecture" | "city"`）
 * @throws {Error} 地域コードが空文字列または無効な形式の場合
 *
 * @example
 * ```ts
 * determineAreaType("00000"); // "national"
 * determineAreaType("13000"); // "prefecture"
 * determineAreaType("13113"); // "city"
 * ```
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
 *
 * 指定された市区町村コードの先頭2桁から都道府県コードを抽出し、
 * 5桁形式（末尾に `"000"` を付加）で返す。
 *
 * @param {string} areaCode - 市区町村コード（5桁形式）
 * @returns {string} 都道府県コード（5桁形式、例: `"13000"`）
 * @throws {Error} 地域コードが5桁未満の場合
 *
 * @example
 * ```ts
 * // 渋谷区（13113）から東京都コードを取得
 * const prefCode = deriveParentPrefectureCode("13113");
 * console.log(prefCode); // "13000"
 * ```
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
 *
 * 都道府県コードを正規化する。既に5桁の場合はそのまま返し、
 * 2桁の場合は末尾に `"000"` を付加して5桁形式に変換する。
 *
 * @param {string} prefCode - 都道府県コード（2桁または5桁形式）
 * @returns {string} 正規化された都道府県コード（5桁形式）
 * @throws {Error} 都道府県コードが空文字列、または2桁・5桁以外の場合
 *
 * @example
 * ```ts
 * normalizePrefectureCode("13"); // "13000"
 * normalizePrefectureCode("13000"); // "13000"
 * ```
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
 *
 * 指定された地域コードの先頭2桁を都道府県コードとして抽出する。
 * 都道府県コードまたは市区町村コードのいずれからも抽出可能。
 *
 * @param {string} areaCode - 地域コード（2桁以上）
 * @returns {string} 都道府県コード（2桁形式、例: `"13"`）
 * @throws {Error} 地域コードが2桁未満の場合
 *
 * @example
 * ```ts
 * extractPrefectureCode("13000"); // "13"
 * extractPrefectureCode("13113"); // "13"
 * extractPrefectureCode("13"); // "13"
 * ```
 */
export function extractPrefectureCode(areaCode: string): string {
  if (!areaCode || areaCode.length < 2) {
    throw new Error("Invalid area code: must be at least 2 characters");
  }

  return areaCode.substring(0, 2);
}

/**
 * 地域コードの妥当性を検証
 *
 * 地域コードが有効な形式かどうかを簡易的にチェックする。
 * 詳細な検証結果が必要な場合は `validateArea()` を使用する。
 *
 * ## 検証内容
 * - 国コード（`"00000"`）のチェック
 * - 5桁地域コードの形式チェック（数字のみ、都道府県コード範囲: 01-47）
 * - 2桁都道府県コードの形式チェック（数字のみ、範囲: 01-47）
 *
 * @param {string} areaCode - 地域コード
 * @returns {boolean} 有効な場合 `true`、無効な場合 `false`
 *
 * @example
 * ```ts
 * validateAreaCode("00000"); // true（全国）
 * validateAreaCode("13000"); // true（都道府県）
 * validateAreaCode("13113"); // true（市区町村）
 * validateAreaCode("99999"); // false（都道府県コード範囲外）
 * ```
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
 *
 * 地域コードを標準形式に変換する。以下の処理を順次実行する:
 * 1. 全角数字を半角数字に変換
 * 2. 前後の空白を除去
 * 3. 2桁の都道府県コードを5桁形式に変換
 *
 * @param {string} areaCode - 地域コード（2桁または5桁形式、全角/半角混在可）
 * @returns {string} 正規化された地域コード
 * @throws {Error} 地域コードが空文字列の場合
 *
 * @example
 * ```ts
 * normalizeAreaCode("１３"); // "13000"（全角→半角、2桁→5桁）
 * normalizeAreaCode(" 13000 "); // "13000"（空白除去）
 * normalizeAreaCode("13113"); // "13113"（既に正規化済み）
 * ```
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
 *
 * 政令指定都市の区（市区町村コードの下3桁が101-999）の場合、
 * 親となる政令指定都市のコード（下3桁を100に変更）を返す。
 * 区でない場合は `null` を返す。
 *
 * @param {string} municCode - 市区町村コード（5桁形式）
 * @returns {string | null} 政令指定都市コード（区の場合）。区でない場合は `null`
 *
 * @example
 * ```ts
 * // 横浜市港北区（14110）から横浜市コードを取得
 * const cityCode = deriveDesignatedCityCode("14110");
 * console.log(cityCode); // "14100"
 *
 * // 区でない場合は null
 * const notWard = deriveDesignatedCityCode("13100");
 * console.log(notWard); // null
 * ```
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
 *
 * 市区町村コードの下3桁が101-199の範囲にある場合、政令指定都市の区と判定する。
 *
 * @param {string} municCode - 市区町村コード（5桁形式）
 * @returns {boolean} 政令指定都市の区の場合 `true`、それ以外は `false`
 *
 * @example
 * ```ts
 * isDesignatedCityWard("14110"); // true（横浜市港北区）
 * isDesignatedCityWard("13100"); // false（一般市区町村）
 * ```
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
 *
 * 指定された地域レベルと親コードに基づいて、地域コードをフィルタリングする関数を生成する。
 *
 * @param {string} level - フィルタリングする地域レベル
 *   - `"prefecture"`: 都道府県のみ
 *   - `"city"`: 市区町村のみ（`parentCode` 指定時は該当都道府県内のみ）
 *   - `"both"`: 都道府県と市区町村の両方
 * @param {string} [parentCode] - 親都道府県コード（`level` が `"city"` の場合のみ有効）
 * @returns {(areaCode: string) => boolean} フィルタリング関数
 *
 * @example
 * ```ts
 * // 都道府県のみフィルタ
 * const prefFilter = createAreaFilter("prefecture");
 * prefFilter("13000"); // true
 * prefFilter("13113"); // false
 *
 * // 東京都内の市区町村のみフィルタ
 * const tokyoCityFilter = createAreaFilter("city", "13000");
 * tokyoCityFilter("13113"); // true（渋谷区）
 * tokyoCityFilter("14000"); // false（神奈川県）
 * ```
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

/**
 * 地域コードの包括的な検証
 *
 * 地域コードの妥当性を詳細に検証し、結果とメッセージ、エラー詳細を返す。
 * `validateAreaCode()` よりも詳細な検証結果が必要な場合に使用する。
 *
 * ## 検証内容
 * 1. 基本的な形式チェック（文字列、非空）
 * 2. 数字のみかチェック
 * 3. 長さチェック（2桁または5桁）
 * 4. 国コードチェック（`"00000"`）
 * 5. 都道府県コード範囲チェック（01-47）
 * 6. 地域タイプの判定
 *
 * @param {string} areaCode - 地域コード
 * @returns {AreaValidationResult} 検証結果（有効性、メッセージ、詳細情報）
 *
 * @example
 * ```ts
 * const result = validateArea("13000");
 * console.log(result.isValid); // true
 * console.log(result.areaType); // "prefecture"
 * console.log(result.message); // "Valid prefecture code"
 *
 * const invalid = validateArea("99999");
 * console.log(invalid.isValid); // false
 * console.log(invalid.message); // "Prefecture code must be between 01 and 47"
 * ```
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
 *
 * 指定されたコードが都道府県コードとして有効かを検証する。
 * 2桁形式と5桁形式の両方に対応し、都道府県コードであることを確認する。
 *
 * @param {string} prefCode - 都道府県コード（2桁または5桁形式）
 * @returns {AreaValidationResult} 検証結果（都道府県コードとして有効か）
 *
 * @example
 * ```ts
 * const result = validatePrefectureCode("13000");
 * console.log(result.isValid); // true
 * console.log(result.areaType); // "prefecture"
 *
 * // 市区町村コードの場合は無効
 * const cityResult = validatePrefectureCode("13113");
 * console.log(cityResult.isValid); // false
 * ```
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
 *
 * 指定されたコードが市区町村コードとして有効かを検証する。
 * 5桁形式で、末尾が `"000"` でないことを確認する。
 *
 * @param {string} municCode - 市区町村コード（5桁形式）
 * @returns {AreaValidationResult} 検証結果（市区町村コードとして有効か）
 *
 * @example
 * ```ts
 * const result = validateCityCode("13113");
 * console.log(result.isValid); // true
 * console.log(result.areaType); // "city"
 *
 * // 都道府県コードの場合は無効
 * const prefResult = validateCityCode("13000");
 * console.log(prefResult.isValid); // false
 * ```
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
 *
 * 指定された文字列が都道府県名として有効かを検証する。
 * 末尾が「都」「道」「府」「県」のいずれかで終わっているかをチェックする。
 *
 * @param {string} prefName - 都道府県名
 * @returns {boolean} 有効な都道府県名の場合 `true`、それ以外は `false`
 *
 * @example
 * ```ts
 * validatePrefectureName("東京都"); // true
 * validatePrefectureName("北海道"); // true
 * validatePrefectureName("大阪府"); // true
 * validatePrefectureName("神奈川県"); // true
 * validatePrefectureName("東京"); // false（末尾が都/道/府/県でない）
 * ```
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
 *
 * 複数の地域コードを一括で検証し、各コードの検証結果をMap形式で返す。
 *
 * @param {string[]} areaCodes - 検証する地域コードの配列
 * @returns {Map<string, AreaValidationResult>} 地域コードをキーとした検証結果のマップ
 *
 * @example
 * ```ts
 * const codes = ["13000", "13113", "99999"];
 * const results = validateAreaCodes(codes);
 *
 * console.log(results.get("13000")?.isValid); // true
 * console.log(results.get("13113")?.isValid); // true
 * console.log(results.get("99999")?.isValid); // false
 * ```
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
 *
 * 指定された地域コード配列のすべてが有効かどうかを判定する。
 * 一つでも無効なコードが含まれている場合は `false` を返す。
 *
 * @param {string[]} areaCodes - 検証する地域コードの配列
 * @returns {boolean} すべてのコードが有効な場合 `true`、一つでも無効な場合は `false`
 *
 * @example
 * ```ts
 * areAllCodesValid(["13000", "13113"]); // true
 * areAllCodesValid(["13000", "99999"]); // false（99999が無効）
 * ```
 */
export function areAllCodesValid(areaCodes: string[]): boolean {
  return areaCodes.every((code) => validateAreaCode(code));
}
