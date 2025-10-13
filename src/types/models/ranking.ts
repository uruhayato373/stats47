import { StatsDataId, CategoryCode } from "../common/primitives";
import { SubcategoryData } from "../visualization/choropleth";

/**
 * ランキング項目の基本情報
 */
export interface RankingItem {
  /** ランキング項目のID（オプショナル、フォールバック設定では未設定） */
  id?: number;

  /** サブカテゴリID */
  subcategoryId: string;

  /** ランキングキー（一意識別子） */
  rankingKey: string;

  /** 表示ラベル */
  label: string;

  /** 統計データID（オプショナル、新スキーマではdata_source_metadataに移動） */
  statsDataId?: StatsDataId;

  /** カテゴリコード（オプショナル、新スキーマではdata_source_metadataに移動） */
  cdCat01?: CategoryCode;

  /** 単位 */
  unit: string;

  /** 項目名 */
  name: string;

  /** 表示順序 */
  displayOrder: number;

  /** 有効フラグ */
  isActive: boolean;

  /** 地図の色スキーム */
  mapColorScheme: string;

  /** 分岐点設定 */
  mapDivergingMidpoint: "zero" | "mean" | "median" | number;

  /** ランキング方向 */
  rankingDirection: "asc" | "desc";

  /** 変換係数 */
  conversionFactor: number;

  /** 小数点以下桁数 */
  decimalPlaces: number;

  /** 作成日時 */
  createdAt: string;

  /** 更新日時 */
  updatedAt: string;
}

/**
 * ランキングデータ（新スキーマ対応）
 */
export interface RankingData {
  /** ランキングキー */
  rankingKey: string;

  /** 単位 */
  unit: string;

  /** 項目名 */
  name: string;
}

/**
 * ランキング結果
 */
export interface RankingResult {
  /** 都道府県コード */
  prefectureCode: string;

  /** 都道府県名 */
  prefectureName: string;

  /** 統計値 */
  value: number;

  /** 順位 */
  rank: number;
}

/**
 * ランキングオプション（タブ項目）の構造
 */
export interface RankingOption<T extends string> {
  key: T;
  label: string;
}

/**
 * データベースのランキング項目型（スネークケース）
 */
export interface RankingItemDB {
  id: number;
  subcategory_id: string;
  ranking_key: string;
  label: string;
  stats_data_id?: string;
  cd_cat01?: string;
  unit: string;
  name: string;
  display_order: number;
  is_active: number;

  // 可視化設定（新規追加）
  map_color_scheme: string;
  map_diverging_midpoint: string;
  ranking_direction: string;
  conversion_factor: number;
  decimal_places: number;

  created_at: string;
  updated_at: string;
}

/**
 * データベース型からアプリケーション型への変換ヘルパー関数
 */
export function convertRankingItemFromDB(dbItem: RankingItemDB): RankingItem {
  return {
    id: dbItem.id,
    subcategoryId: dbItem.subcategory_id,
    rankingKey: dbItem.ranking_key,
    label: dbItem.label,
    statsDataId: dbItem.stats_data_id,
    cdCat01: dbItem.cd_cat01,
    unit: dbItem.unit,
    name: dbItem.name,
    displayOrder: dbItem.display_order,
    isActive: dbItem.is_active === 1,

    // 可視化設定
    mapColorScheme: dbItem.map_color_scheme,
    mapDivergingMidpoint: dbItem.map_diverging_midpoint as
      | "zero"
      | "mean"
      | "median",
    rankingDirection: dbItem.ranking_direction as "asc" | "desc",
    conversionFactor: dbItem.conversion_factor,
    decimalPlaces: dbItem.decimal_places,

    createdAt: dbItem.created_at,
    updatedAt: dbItem.updated_at,
  };
}

/**
 * RankingClientコンポーネントのProps
 */
export interface RankingClientProps<T extends string> {
  subcategory: SubcategoryData;
  activeRankingKey: T;
  rankingItems?: RankingItem[]; // 編集用
}
