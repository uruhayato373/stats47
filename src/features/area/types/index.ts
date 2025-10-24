/**
 * Area（地域管理）ドメインの型定義
 * 日本の行政区画の階層構造を管理するための型定義
 */

// ============================================================================
// 基本型定義
// ============================================================================

/**
 * 都道府県タイプ
 */
export type MunicipalityType = "city" | "ward" | "town" | "village";

/**
 * 地域レベル
 */
export type AreaLevel = "country" | "region" | "prefecture" | "municipality";

/**
 * 地域タイプ
 */
export type AreaType = "country" | "prefecture" | "municipality";

// ============================================================================
// 値オブジェクト
// ============================================================================

/**
 * 地域コード値オブジェクト
 * 5桁の数字で地域を一意に識別
 */
export class AreaCode {
  private readonly value: string;

  constructor(code: string) {
    if (!/^\d{5}$/.test(code)) {
      throw new Error(`Invalid area code format: ${code}. Must be 5 digits.`);
    }
    this.value = code;
  }

  getValue(): string {
    return this.value;
  }

  /**
   * 都道府県コード（上位2桁）を取得
   */
  getPrefectureCode(): string {
    return this.value.substring(0, 2);
  }

  /**
   * 階層レベルを判定
   */
  getLevel(): AreaLevel {
    if (this.value === "00000") return "country";
    if (this.value.endsWith("000")) return "prefecture";
    return "municipality";
  }

  /**
   * 都道府県コードかどうか
   */
  isPrefecture(): boolean {
    return this.value.endsWith("000") && this.value !== "00000";
  }

  /**
   * 市区町村コードかどうか
   */
  isMunicipality(): boolean {
    return !this.value.endsWith("000");
  }

  equals(other: AreaCode): boolean {
    return this.value === other.value;
  }

  toString(): string {
    return this.value;
  }
}

/**
 * 地域レベル値オブジェクト
 */
export class AreaLevelVO {
  private readonly value: AreaLevel;

  constructor(level: AreaLevel) {
    this.value = level;
  }

  getValue(): AreaLevel {
    return this.value;
  }

  /**
   * 階層レベルを数値で取得
   */
  getNumericLevel(): number {
    const levelMap: Record<AreaLevel, number> = {
      country: 0,
      region: 1,
      prefecture: 2,
      municipality: 3,
    };
    return levelMap[this.value];
  }

  /**
   * 指定レベルより上位かどうか
   */
  isHigherThan(other: AreaLevel): boolean {
    return this.getNumericLevel() < other.getNumericLevel();
  }

  /**
   * 指定レベルより下位かどうか
   */
  isLowerThan(other: AreaLevel): boolean {
    return this.getNumericLevel() > other.getNumericLevel();
  }
}

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

/**
 * 市区町村エンティティ
 */
export interface Municipality {
  /** 市区町村コード（5桁） */
  code: string;
  /** 市区町村名 */
  name: string;
  /** 完全名称（都道府県名を含む） */
  fullName: string;
  /** 都道府県コード（2桁） */
  prefCode: string;
  /** 親コード（政令指定都市の区の場合は市コード） */
  parentCode?: string;
  /** 市区町村タイプ */
  type: MunicipalityType;
  /** 階層レベル（1:都道府県, 2:市, 3:区） */
  level: number;
}

/**
 * 地域階層エンティティ
 */
export interface AreaHierarchy {
  /** 地域コード */
  areaCode: string;
  /** 地域名 */
  areaName: string;
  /** 地域タイプ */
  areaType: AreaType;
  /** 地域階層レベル */
  areaLevel: AreaLevel;
  /** 親地域コード */
  parentCode?: string;
  /** 子地域コードリスト */
  children?: string[];
}

// ============================================================================
// 検索・フィルタリング用の型
// ============================================================================

/**
 * 都道府県検索オプション
 */
export interface PrefectureSearchOptions {
  /** 検索クエリ（都道府県名） */
  query?: string;
  /** 地域ブロックキー */
  regionKey?: string;
  /** 取得件数制限 */
  limit?: number;
}

/**
 * 市区町村検索オプション
 */
export interface MunicipalitySearchOptions {
  /** 検索クエリ（市区町村名） */
  query?: string;
  /** 都道府県コード */
  prefCode?: string;
  /** 市区町村タイプ */
  type?: MunicipalityType;
  /** 階層レベル */
  level?: number;
  /** 取得件数制限 */
  limit?: number;
}

/**
 * 地域検索オプション
 */
export interface AreaSearchOptions {
  /** 検索クエリ（地域名） */
  query?: string;
  /** 地域レベル */
  level?: AreaLevel;
  /** 地域タイプ */
  type?: AreaType;
  /** 取得件数制限 */
  limit?: number;
}

// ============================================================================
// レスポンス型
// ============================================================================

/**
 * 地域検索結果
 */
export interface AreaSearchResult {
  /** 検索結果リスト */
  items: (Prefecture | Municipality)[];
  /** 総件数 */
  total: number;
  /** 検索クエリ */
  query: string;
  /** 検索にかかった時間（ミリ秒） */
  searchTime: number;
}

/**
 * 階層パス（ルートから指定地域までのパス）
 */
export interface HierarchyPath {
  /** 地域コード */
  areaCode: string;
  /** 地域名 */
  areaName: string;
  /** 地域レベル */
  level: AreaLevel;
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
 * Mockデータ用の市区町村型（e-Stat API形式）
 */
export interface MockMunicipality {
  "@code": string;
  "@name": string;
  "@level": string;
  "@parentCode": string;
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
 * 地域コードが見つからないエラー
 */
export class AreaCodeNotFoundError extends AreaError {
  constructor(areaCode: string) {
    super(`Area code not found: ${areaCode}`, "AREA_CODE_NOT_FOUND", {
      areaCode,
    });
  }
}

/**
 * 無効な地域コードエラー
 */
export class InvalidAreaCodeError extends AreaError {
  constructor(areaCode: string) {
    super(`Invalid area code: ${areaCode}`, "INVALID_AREA_CODE", {
      areaCode,
    });
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
