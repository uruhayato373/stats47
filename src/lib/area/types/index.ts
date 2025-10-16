/**
 * 地域（Area）ドメイン型定義
 *
 * 国・都道府県・市区町村の階層構造を管理する型定義
 */

/**
 * 地域タイプ
 */
export type AreaType = "country" | "region" | "prefecture" | "municipality";

/**
 * 地域階層レベル
 */
export type AreaLevel = "national" | "regional" | "prefectural" | "municipal";

/**
 * 市区町村タイプ
 */
export type MunicipalityType = "city" | "ward" | "town" | "village";

/**
 * 都道府県情報
 */
export interface Prefecture {
  /** 都道府県コード（5桁） */
  prefCode: string;
  /** 都道府県名 */
  prefName: string;
  /** 地域ブロックキー */
  regionKey?: string;
}

/**
 * 市区町村情報
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
 * 地域ブロック情報
 */
export interface Region {
  /** 地域キー */
  key: string;
  /** 地域名 */
  name: string;
  /** 含まれる都道府県コードリスト */
  prefectures: string[];
}

/**
 * 地域階層情報
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

/**
 * 地域検証結果
 */
export interface AreaValidationResult {
  /** 検証成功フラグ */
  isValid: boolean;
  /** 地域タイプ */
  areaType?: AreaType;
  /** エラーメッセージ */
  message?: string;
  /** 検証詳細 */
  details?: {
    code?: string;
    expectedFormat?: string;
    actualFormat?: string;
  };
}

/**
 * 地域検索オプション
 */
export interface AreaSearchOptions {
  /** 検索クエリ */
  query: string;
  /** 地域タイプフィルター */
  areaType?: AreaType;
  /** 都道府県コードフィルター */
  prefCode?: string;
  /** 大文字小文字を区別しない */
  caseInsensitive?: boolean;
  /** 部分一致検索 */
  partialMatch?: boolean;
  /** 最大結果数 */
  limit?: number;
}

/**
 * 地域検索結果
 */
export interface AreaSearchResult {
  /** 地域コード */
  code: string;
  /** 地域名 */
  name: string;
  /** 完全名称 */
  fullName?: string;
  /** 地域タイプ */
  type: AreaType;
  /** 都道府県コード */
  prefCode?: string;
  /** マッチスコア（0-1） */
  score?: number;
}

/**
 * 都道府県検索オプション
 */
export interface PrefectureSearchOptions {
  /** 検索クエリ */
  query: string;
  /** 地域ブロックキーフィルター */
  regionKey?: string;
  /** 大文字小文字を区別しない */
  caseInsensitive?: boolean;
  /** 部分一致検索 */
  partialMatch?: boolean;
}

/**
 * 市区町村検索オプション
 */
export interface MunicipalitySearchOptions {
  /** 検索クエリ */
  query: string;
  /** 都道府県コードフィルター */
  prefCode?: string;
  /** 市区町村タイプフィルター */
  type?: MunicipalityType;
  /** 大文字小文字を区別しない */
  caseInsensitive?: boolean;
  /** 部分一致検索 */
  partialMatch?: boolean;
  /** 最大結果数 */
  limit?: number;
}
