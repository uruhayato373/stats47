/**
 * Area（地域管理）ドメインの型定義
 */

/**
 * 地域タイプ
 */
export type AreaType = "national" | "prefecture" | "city";

/**
 * 都道府県エンティティ
 */
export interface Prefecture {
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 都道府県名 */
  prefName: string;
}

/**
 * 市区町村エンティティ
 */
export interface City {
  /** 市区町村コード（5桁） */
  cityCode: string;
  /** 市区町村名 */
  cityName: string;
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 地域レベル（"2": 都道府県・政令指定都市, "3": 市区町村） */
  level: string;
}

/**
 * 地域ブロック
 */
export interface Region {
  /** 地域ブロックコード */
  regionCode: string;
  /** 地域ブロック名 */
  regionName: string;
  /** 都道府県リスト */
  prefectures: string[];
}

/**
 * 地域コード検証結果
 */
export interface AreaValidationResult {
  /** 有効かどうか */
  isValid: boolean;
  /** 地域タイプ（有効な場合のみ） */
  areaType?: AreaType;
  /** メッセージ */
  message: string;
  /** 詳細情報（無効な場合のみ） */
  details?: {
    code: string;
    expectedFormat: string;
    actualFormat: string;
  };
}

/**
 * Areaドメインのエラー
 */
export class AreaError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = "AreaError";
  }
}

/**
 * データソースエラー
 */
export class DataSourceError extends AreaError {
  constructor(source: string, originalError: Error) {
    super(
      `Failed to load data from ${source}: ${originalError.message}`,
      "DATA_SOURCE_ERROR",
      { source, originalError: originalError.message }
    );
  }
}
