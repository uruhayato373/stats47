/**
 * 地域コードバリデーション・変換ユーティリティ
 * 地域コードの形式検証、階層関係の検証、コード変換を行う
 */

import { AreaLevel, MunicipalityType } from "./types";

// ============================================================================
// 地域コードバリデーション
// ============================================================================

/**
 * 地域コードの形式を検証
 * @param code 検証する地域コード
 * @returns 有効な場合true
 */
export function isValidAreaCode(code: string): boolean {
  return /^\d{5}$/.test(code);
}

/**
 * 都道府県コードの形式を検証
 * @param code 検証する都道府県コード（2桁）
 * @returns 有効な場合true
 */
export function isValidPrefectureCode(code: string): boolean {
  return /^\d{2}$/.test(code);
}

/**
 * 地域コードの階層レベルを判定
 * @param code 地域コード
 * @returns 階層レベル
 */
export function getAreaLevel(code: string): AreaLevel {
  if (!isValidAreaCode(code)) {
    throw new Error(`Invalid area code format: ${code}`);
  }

  if (code === "00000") return "country";
  if (code.endsWith("000")) return "prefecture";
  return "municipality";
}

/**
 * 都道府県コードかどうかを判定
 * @param code 地域コード
 * @returns 都道府県コードの場合true
 */
export function isPrefectureCode(code: string): boolean {
  return isValidAreaCode(code) && code.endsWith("000") && code !== "00000";
}

/**
 * 市区町村コードかどうかを判定
 * @param code 地域コード
 * @returns 市区町村コードの場合true
 */
export function isMunicipalityCode(code: string): boolean {
  return isValidAreaCode(code) && !code.endsWith("000");
}

// ============================================================================
// 階層関係の検証
// ============================================================================

/**
 * 親子関係を検証
 * @param parentCode 親コード
 * @param childCode 子コード
 * @returns 有効な親子関係の場合true
 */
export function isValidParentChildRelation(
  parentCode: string,
  childCode: string
): boolean {
  if (!isValidAreaCode(parentCode) || !isValidAreaCode(childCode)) {
    return false;
  }

  const parentLevel = getAreaLevel(parentCode);
  const childLevel = getAreaLevel(childCode);

  // 階層レベルが適切かチェック
  if (parentLevel === "country" && childLevel === "prefecture") {
    return true;
  }
  if (parentLevel === "prefecture" && childLevel === "municipality") {
    return childCode.startsWith(parentCode.substring(0, 2));
  }

  return false;
}

/**
 * 階層パスを検証
 * @param path 階層パス（ルートから子要素まで）
 * @returns 有効な階層パスの場合true
 */
export function isValidHierarchyPath(path: string[]): boolean {
  if (path.length === 0) return false;

  // ルートは国コード（00000）でなければならない
  if (path[0] !== "00000") return false;

  // 各レベルで階層関係を検証
  for (let i = 0; i < path.length - 1; i++) {
    if (!isValidParentChildRelation(path[i], path[i + 1])) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// コード変換
// ============================================================================

/**
 * 都道府県コードから5桁の地域コードに変換
 * @param prefCode 都道府県コード（2桁）
 * @returns 5桁の地域コード
 */
export function prefectureCodeToAreaCode(prefCode: string): string {
  if (!isValidPrefectureCode(prefCode)) {
    throw new Error(`Invalid prefecture code: ${prefCode}`);
  }
  return `${prefCode}000`;
}

/**
 * 5桁の地域コードから都道府県コードに変換
 * @param areaCode 5桁の地域コード
 * @returns 都道府県コード（2桁）
 */
export function areaCodeToPrefectureCode(areaCode: string): string {
  if (!isValidAreaCode(areaCode)) {
    throw new Error(`Invalid area code: ${areaCode}`);
  }
  return areaCode.substring(0, 2);
}

/**
 * 地域コードの正規化（5桁にパディング）
 * @param code 地域コード
 * @returns 正規化された5桁の地域コード
 */
export function normalizeAreaCode(code: string): string {
  const num = parseInt(code, 10);
  if (isNaN(num) || num < 0 || num > 99999) {
    throw new Error(`Invalid area code: ${code}`);
  }
  return num.toString().padStart(5, "0");
}

// ============================================================================
// 市区町村タイプの検証
// ============================================================================

/**
 * 市区町村タイプを判定
 * @param name 市区町村名
 * @returns 市区町村タイプ
 */
export function detectMunicipalityType(name: string): MunicipalityType {
  if (name.includes("市")) return "city";
  if (name.includes("区")) return "ward";
  if (name.includes("町")) return "town";
  if (name.includes("村")) return "village";

  // デフォルトは市
  return "city";
}
/**
 * 市区町村タイプが有効かチェック
 * @param type 市区町村タイプ
 * @returns 有効な場合true
 */
export function isValidMunicipalityType(
  type: string
): type is MunicipalityType {
  return ["city", "ward", "town", "village"].includes(type);
}

// ============================================================================
// 地域ブロックの検証
// ============================================================================

/**
 * 地域ブロックキーが有効かチェック
 * @param regionKey 地域ブロックキー
 * @returns 有効な場合true
 */
export function isValidRegionKey(regionKey: string): boolean {
  const validRegions = [
    "hokkaido",
    "tohoku",
    "kanto",
    "chubu",
    "kinki",
    "chugoku",
    "shikoku",
    "kyushu",
  ];
  return validRegions.includes(regionKey);
}

/**
 * 都道府県コードから地域ブロックキーを取得
 * @param prefCode 都道府県コード
 * @returns 地域ブロックキー
 */
export function getRegionKeyFromPrefectureCode(prefCode: string): string {
  const regionMap: Record<string, string> = {
    "01": "hokkaido", // 北海道
    "02": "tohoku", // 青森
    "03": "tohoku", // 岩手
    "04": "tohoku", // 宮城
    "05": "tohoku", // 秋田
    "06": "tohoku", // 山形
    "07": "tohoku", // 福島
    "08": "kanto", // 茨城
    "09": "kanto", // 栃木
    "10": "kanto", // 群馬
    "11": "kanto", // 埼玉
    "12": "kanto", // 千葉
    "13": "kanto", // 東京
    "14": "kanto", // 神奈川
    "15": "chubu", // 新潟
    "16": "chubu", // 富山
    "17": "chubu", // 石川
    "18": "chubu", // 福井
    "19": "chubu", // 山梨
    "20": "chubu", // 長野
    "21": "chubu", // 岐阜
    "22": "chubu", // 静岡
    "23": "chubu", // 愛知
    "24": "kinki", // 三重
    "25": "kinki", // 滋賀
    "26": "kinki", // 京都
    "27": "kinki", // 大阪
    "28": "kinki", // 兵庫
    "29": "kinki", // 奈良
    "30": "kinki", // 和歌山
    "31": "chugoku", // 鳥取
    "32": "chugoku", // 島根
    "33": "chugoku", // 岡山
    "34": "chugoku", // 広島
    "35": "chugoku", // 山口
    "36": "shikoku", // 徳島
    "37": "shikoku", // 香川
    "38": "shikoku", // 愛媛
    "39": "shikoku", // 高知
    "40": "kyushu", // 福岡
    "41": "kyushu", // 佐賀
    "42": "kyushu", // 長崎
    "43": "kyushu", // 熊本
    "44": "kyushu", // 大分
    "45": "kyushu", // 宮崎
    "46": "kyushu", // 鹿児島
    "47": "kyushu", // 沖縄
  };

  return regionMap[prefCode] || "unknown";
}

// ============================================================================
// バリデーション結果型
// ============================================================================

/**
 * バリデーション結果
 */
export interface ValidationResult {
  /** 有効かどうか */
  isValid: boolean;
  /** エラーメッセージ */
  error?: string;
  /** 検証された値 */
  value?: string;
}

/**
 * 地域コードの包括的なバリデーション
 * @param code 地域コード
 * @returns バリデーション結果
 */
export function validateAreaCode(code: string): ValidationResult {
  try {
    // 形式チェック
    if (!isValidAreaCode(code)) {
      return {
        isValid: false,
        error: `Invalid area code format: ${code}. Must be 5 digits.`,
      };
    }

    // 階層レベルチェック
    const level = getAreaLevel(code);

    return {
      isValid: true,
      value: code,
    };
  } catch (error) {
    return {
      isValid: false,
      error:
        error instanceof Error ? error.message : "Unknown validation error",
    };
  }
}

/**
 * 複数の地域コードを一括バリデーション
 * @param codes 地域コード配列
 * @returns バリデーション結果配列
 */
export function validateAreaCodes(codes: string[]): ValidationResult[] {
  return codes.map(validateAreaCode);
}
