/**
 * Area（地域管理）ドメインの型定義
 * 都道府県データの管理に必要な最小限の型定義
 */

// ============================================================================
// 基本型定義
// ============================================================================

/**
 * 地域タイプ
 */
export type AreaType = "country" | "prefecture" | "municipality";

/**
 * 市区町村タイプ
 */
export type MunicipalityType = "city" | "ward" | "town" | "village";

// ============================================================================
// エンティティ
// ============================================================================

/**
 * 都道府県エンティティ
 */
export interface Prefecture {
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 都道府県名 */
  prefName: string;
  /** 地域ブロックキー（動的に設定） */
  regionKey?: string;
}

// ============================================================================
// 地域ブロック定義
// ============================================================================

/**
 * 地域ブロック
 */
export interface Region {
  /** 地域ブロックキー */
  key: string;
  /** 地域ブロック名 */
  name: string;
  /** 都道府県リスト */
  prefectures: string[];
}

/**
 * 地域ブロックマップ
 */
export interface RegionMap {
  [key: string]: Region;
}

// ============================================================================
// データソース用の型
// ============================================================================

/**
 * Mockデータ用の都道府県型
 */
export interface MockPrefecture {
  prefCode: string;
  prefName: string;
}

/**
 * Mockデータ用の都道府県JSON型
 */
export interface MockPrefecturesData {
  prefectures: MockPrefecture[];
  regions: RegionMap;
}

// ============================================================================
// エラー型
// ============================================================================

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
