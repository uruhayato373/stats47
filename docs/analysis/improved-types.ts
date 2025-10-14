/**
 * 改善版 型定義
 *
 * formatter-analysis.mdで提案された改善に対応する型定義
 */

import {
  EstatResult,
  EstatTextNode,
  EstatTableInfo,
  EstatClassInfo,
  EstatClassObject,
  EstatClass,
} from "../src/lib/estat-api/types/common";

// ============================================
// 1. カテゴリ型の拡張
// ============================================

/**
 * カテゴリID型
 * tab, cat01～cat15の全てをサポート
 */
export type CategoryId =
  | "tab"
  | "cat01" | "cat02" | "cat03" | "cat04" | "cat05"
  | "cat06" | "cat07" | "cat08" | "cat09" | "cat10"
  | "cat11" | "cat12" | "cat13" | "cat14" | "cat15";

/**
 * 次元ID型（カテゴリ + area + time）
 */
export type DimensionId = CategoryId | "area" | "time";

/**
 * 整形されたカテゴリ情報（改善版）
 *
 * @changes
 * - classId: どのカテゴリ（tab, cat01等）に属するかを識別
 * - description: カテゴリの説明（オプション）
 */
export interface FormattedCategory {
  classId: CategoryId;           // 追加: 分類ID（tab, cat01～cat15）
  categoryCode: string;
  categoryName: string;
  displayName: string;
  unit: string | null;
  level?: string;                // 追加: 階層レベル
  parentCode?: string;           // 追加: 親コード
  description?: string;          // 追加: 説明
}

// ============================================
// 2. 値型の拡張（特殊文字対応）
// ============================================

/**
 * e-Stat特殊文字型
 * APIが返す特殊な値
 */
export type EstatSpecialChar = "***" | "-" | "X" | "…";

/**
 * 値の状態
 */
export type ValueStatus =
  | "valid"         // 有効な数値
  | "null"          // null値
  | "special_char"  // 特殊文字
  | "error";        // パースエラー

/**
 * 次元情報
 * 各データポイントが持つ全ての次元（分類軸）
 */
export interface DimensionInfo {
  id: DimensionId;
  code: string;
  name: string;
}

/**
 * 整形された値情報（改善版）
 *
 * @changes
 * - value: number | null に変更（特殊文字はnullに）
 * - dimensions: 全ての次元情報を含む配列
 * - rawValue: 元の文字列値を保持
 * - status: 値の状態
 * - specialChar: 特殊文字の場合、その文字を保持
 * - annotation: 注釈記号
 */
export interface FormattedValue {
  // 値情報
  value: number | null;          // 変更: nullを許容
  rawValue: string;              // 追加: 元の値（"***", "-", "14047594"等）
  status: ValueStatus;           // 追加: 値の状態
  specialChar?: EstatSpecialChar; // 追加: 特殊文字（該当する場合）
  unit: string | null;
  annotation?: string;           // 追加: 注釈記号

  // 地域情報（後方互換性のため維持）
  areaCode: string;
  areaName: string;

  // カテゴリ情報（後方互換性のため維持、cat01を優先）
  categoryCode: string;
  categoryName: string;

  // 時間情報（後方互換性のため維持）
  timeCode: string;
  timeName: string;

  // 全次元情報（新規）
  dimensions: DimensionInfo[];   // 追加: 全ての次元（tab, cat01-15, area, time）

  // その他
  rank?: number;
}

// ============================================
// 3. メタデータの拡張
// ============================================

/**
 * データ統計情報（改善版）
 *
 * @changes
 * - specialCharValues: 特殊文字の数を追加
 */
export interface DataStats {
  totalRecords: number;
  validValues: number;          // 有効な数値の数
  nullValues: number;            // null値の数
  specialCharValues: number;     // 追加: 特殊文字の数
  nullPercentage: number;
  specialCharPercentage: number; // 追加: 特殊文字の割合
}

/**
 * 特殊文字の統計
 */
export interface SpecialCharStats {
  char: EstatSpecialChar;
  count: number;
  percentage: number;
}

/**
 * 拡張版メタデータ（改善版）
 *
 * @changes
 * - stats: DataStats型に変更
 * - specialCharBreakdown: 特殊文字の内訳を追加
 */
export interface FormattedMetadata {
  // 処理情報
  processedAt: string;
  dataSource: "e-stat";
  apiVersion?: string;

  // データ統計（改善版）
  stats: DataStats;              // 変更: 拡張版の統計情報

  // 特殊文字の内訳
  specialCharBreakdown?: SpecialCharStats[]; // 追加

  // データ範囲
  range?: {
    years: {
      min: string;
      max: string;
      count: number;
    };
    areas: {
      count: number;
      prefectureCount: number;
      hasNational: boolean;
    };
    categories: {
      count: number;
      byClassId: Record<CategoryId, number>; // 追加: 分類ID別のカウント
    };
  };

  // データ品質
  quality?: {
    completenessScore: number;
    lastVerified?: string;
  };
}

// ============================================
// 4. カテゴリマップ型
// ============================================

/**
 * カテゴリマップ
 * 分類ID（tab, cat01-15）をキーとして、カテゴリ配列を保持
 *
 * @example
 * ```typescript
 * const categoryMap: CategoryMap = new Map([
 *   ["tab", [{ classId: "tab", categoryCode: "A1101", ... }]],
 *   ["cat01", [{ classId: "cat01", categoryCode: "001", ... }]],
 *   ["cat02", [{ classId: "cat02", categoryCode: "010", ... }]]
 * ]);
 * ```
 */
export type CategoryMap = Map<CategoryId, FormattedCategory[]>;

/**
 * カテゴリコードマップ
 * 分類ID → コード → カテゴリ のネストされたMap
 * O(1)で高速検索可能
 *
 * @example
 * ```typescript
 * const categoryCodeMap: CategoryCodeMap = new Map([
 *   ["cat01", new Map([
 *     ["001", { classId: "cat01", categoryCode: "001", ... }]
 *   ])]
 * ]);
 *
 * // O(1)でアクセス
 * const category = categoryCodeMap.get("cat01")?.get("001");
 * ```
 */
export type CategoryCodeMap = Map<CategoryId, Map<string, FormattedCategory>>;

// ============================================
// 5. 整形されたe-STATデータ（改善版）
// ============================================

/**
 * 整形されたe-STATデータ（改善版）
 *
 * @changes
 * - categoryMap: Mapとしても提供（高速検索用）
 */
export interface FormattedEstatData {
  tableInfo: FormattedTableInfo;
  areas: FormattedArea[];
  categories: FormattedCategory[];  // 全カテゴリ（tab, cat01-15）
  categoryMap?: CategoryMap;        // 追加: 高速検索用Map
  years: FormattedYear[];
  values: FormattedValue[];
  metadata: FormattedMetadata;
  notes?: DataNote[];
}

// ============================================
// 6. エラークラス
// ============================================

/**
 * e-Statデータ不足エラー
 */
export class EstatDataNotFoundError extends Error {
  constructor(
    message: string,
    public response?: any,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'EstatDataNotFoundError';
    Object.setPrototypeOf(this, EstatDataNotFoundError.prototype);
  }
}

/**
 * e-Statパースエラー
 */
export class EstatParseError extends Error {
  constructor(
    message: string,
    public field: string,
    public rawValue: any
  ) {
    super(message);
    this.name = 'EstatParseError';
    Object.setPrototypeOf(this, EstatParseError.prototype);
  }
}

// ============================================
// 7. ユーティリティ型
// ============================================

/**
 * e-Stat値のパース結果
 */
export interface ParsedEstatValue {
  value: number | null;
  status: ValueStatus;
  specialChar?: EstatSpecialChar;
}

/**
 * フォーマッターオプション
 */
export interface FormatterOptions {
  /**
   * 特殊文字を0として扱うか（後方互換性用）
   * @default false
   */
  treatSpecialCharsAsZero?: boolean;

  /**
   * デバッグログを出力するか
   * @default process.env.NODE_ENV === 'development'
   */
  enableDebugLog?: boolean;

  /**
   * パフォーマンス測定を行うか
   * @default false
   */
  enablePerformanceMetrics?: boolean;

  /**
   * 処理する最大カテゴリ数（メモリ節約用）
   * @default 15
   */
  maxCategories?: number;
}

/**
 * パフォーマンスメトリクス
 */
export interface PerformanceMetrics {
  totalTime: number;              // 総処理時間（ms）
  parseTime: number;              // パース時間（ms）
  mapBuildTime: number;           // Map構築時間（ms）
  transformTime: number;          // データ変換時間（ms）
  recordsProcessed: number;       // 処理レコード数
  recordsPerSecond: number;       // 秒あたりの処理レコード数
}

// ============================================
// 8. 型ガード
// ============================================

/**
 * 有効な数値かどうかを判定
 */
export function isValidValue(value: FormattedValue): value is FormattedValue & { value: number } {
  return value.value !== null && value.status === 'valid';
}

/**
 * 特殊文字値かどうかを判定
 */
export function isSpecialCharValue(value: FormattedValue): value is FormattedValue & { specialChar: EstatSpecialChar } {
  return value.status === 'special_char' && value.specialChar !== undefined;
}

/**
 * null値かどうかを判定
 */
export function isNullValue(value: FormattedValue): boolean {
  return value.value === null;
}

// ============================================
// 9. 既存型（変更なし）
// ============================================

/**
 * 整形された地域情報（変更なし）
 */
export interface FormattedArea {
  areaCode: string;
  areaName: string;
  level: string;
  parentCode?: string;
}

/**
 * 整形された年情報（変更なし）
 */
export interface FormattedYear {
  timeCode: string;
  timeName: string;
}

/**
 * データ注記（変更なし）
 */
export interface DataNote {
  char: string;
  description: string;
}

/**
 * 拡張版テーブル情報（変更なし）
 */
export interface FormattedTableInfo {
  id: string;
  title: string;
  statName: string;
  govOrg: string;
  statisticsName: string;
  totalNumber: number;
  fromNumber: number;
  toNumber: number;
  statCode: string;
  govOrgCode: string;
  dates: {
    surveyDate: number | string;
    openDate: string;
    updatedDate: string;
  };
  characteristics: {
    cycle: string;
    smallArea: number;
    collectArea: string;
  };
  classification: {
    mainCategory: {
      code: string;
      name: string;
    };
    subCategory?: {
      code: string;
      name: string;
    };
  };
  statisticsNameSpec?: {
    tabulationCategory: string;
    tabulationSubCategory1?: string;
    tabulationSubCategory2?: string;
    tabulationSubCategory3?: string;
  };
  description?: {
    tabulationCategoryExplanation?: string;
    general?: string;
  };
}

// ============================================
// 10. 使用例
// ============================================

/**
 * @example 基本的な使用例
 * ```typescript
 * // フォーマッター実行
 * const formatted: FormattedEstatData = formatter.formatStatsData(response);
 *
 * // 有効な値のみをフィルタ
 * const validValues = formatted.values.filter(isValidValue);
 *
 * // 特殊文字値を取得
 * const specialValues = formatted.values.filter(isSpecialCharValue);
 *
 * // カテゴリマップから高速検索
 * const cat01Map = formatted.categoryMap?.get("cat01");
 * const category = cat01Map?.find(c => c.categoryCode === "001");
 *
 * // 次元情報を取得
 * formatted.values.forEach(value => {
 *   console.log("次元数:", value.dimensions.length);
 *   value.dimensions.forEach(dim => {
 *     console.log(`${dim.id}: ${dim.name} (${dim.code})`);
 *   });
 * });
 * ```
 */

/**
 * @example 特殊文字の処理
 * ```typescript
 * formatted.values.forEach(value => {
 *   switch (value.status) {
 *     case 'valid':
 *       console.log(`有効値: ${value.value}`);
 *       break;
 *     case 'special_char':
 *       console.log(`特殊文字: ${value.specialChar} (元の値: ${value.rawValue})`);
 *       break;
 *     case 'null':
 *       console.log('null値');
 *       break;
 *     case 'error':
 *       console.log(`パースエラー: ${value.rawValue}`);
 *       break;
 *   }
 * });
 * ```
 */

/**
 * @example パフォーマンス測定
 * ```typescript
 * const options: FormatterOptions = {
 *   enablePerformanceMetrics: true,
 *   enableDebugLog: true
 * };
 *
 * const result = formatter.formatStatsData(response, options);
 *
 * if (result.metrics) {
 *   console.log(`処理時間: ${result.metrics.totalTime}ms`);
 *   console.log(`処理速度: ${result.metrics.recordsPerSecond.toLocaleString()}件/秒`);
 * }
 * ```
 */
