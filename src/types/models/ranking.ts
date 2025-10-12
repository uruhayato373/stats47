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

  /** 統計データID */
  statsDataId: StatsDataId;

  /** カテゴリコード */
  cdCat01: CategoryCode;

  /** 単位 */
  unit: string;

  /** 項目名 */
  name: string;

  /** 表示順序 */
  displayOrder: number;

  /** 有効フラグ */
  isActive: boolean;

  /** 作成日時 */
  createdAt: string;

  /** 更新日時 */
  updatedAt: string;
}

/**
 * ランキングデータ
 */
export interface RankingData {
  /** 統計データID */
  statsDataId: StatsDataId;

  /** カテゴリコード */
  cdCat01: CategoryCode;

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
 * RankingClientコンポーネントのProps
 */
export interface RankingClientProps<T extends string> {
  rankings: Record<T, RankingData>;
  subcategory: SubcategoryData;
  activeRankingId: T;
  tabOptions: RankingOption<T>[];
  rankingItems?: RankingItem[]; // 編集用
  isAdmin?: boolean; // 管理者権限
}
