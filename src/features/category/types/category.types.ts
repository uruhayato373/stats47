/**
 * カテゴリドメインの型定義
 *
 * このファイルには、カテゴリとサブカテゴリに関する
 * データベースモデルとドメインモデルの型定義を含みます。
 */

/**
 * カテゴリのデータベースモデル
 *
 * データベーステーブルのカラム構造を表現します。
 * スネークケース（snake_case）のカラム名を使用します。
 */
export interface CategoryDB {
  /** カテゴリ名（PRIMARY KEY、例: "population", "economy"） */
  category_name: string;

  /** カテゴリの表示名（例: "人口・世帯"） */
  name: string;

  /** Lucide Reactのアイコン名（例: "Users", "MapPin"） */
  icon: string | null;

  /** 表示順序（0から始まる） */
  display_order: number;

  /** 作成日時 */
  created_at: string;

  /** 更新日時 */
  updated_at: string;
}

/**
 * サブカテゴリのデータベースモデル
 *
 * データベーステーブルのカラム構造を表現します。
 * スネークケース（snake_case）のカラム名を使用します。
 */
export interface SubcategoryDB {
  /** サブカテゴリ名（PRIMARY KEY、例: "basic-population", "land-area"） */
  subcategory_name: string;

  /** サブカテゴリの表示名（例: "総人口", "土地面積"） */
  name: string;

  /** 親カテゴリ名（categoriesテーブルへの外部キー） */
  category_name: string;

  /** 表示順序（0から始まる） */
  display_order: number;

  /** 作成日時 */
  created_at: string;

  /** 更新日時 */
  updated_at: string;
}

/**
 * カテゴリのドメインモデル
 *
 * アプリケーション内で使用するカテゴリの型定義です。
 * キャメルケース（camelCase）のプロパティ名を使用します。
 * データベースモデルから変換されます。
 */
export interface Category {
  /** カテゴリ名（PRIMARY KEY、例: "population", "economy"） */
  categoryName: string;

  /** カテゴリの表示名（例: "人口・世帯"） */
  name: string;

  /** Lucide Reactのアイコン名（例: "Users", "MapPin"） */
  icon?: string;

  /** 表示順序（0から始まる） */
  displayOrder: number;

  /** このカテゴリに属するサブカテゴリのリスト */
  subcategories?: Subcategory[];
}

/**
 * サブカテゴリのドメインモデル
 *
 * アプリケーション内で使用するサブカテゴリの型定義です。
 * キャメルケース（camelCase）のプロパティ名を使用します。
 * データベースモデルから変換されます。
 */
export interface Subcategory {
  /** サブカテゴリ名（PRIMARY KEY、例: "basic-population", "land-area"） */
  subcategoryName: string;

  /** サブカテゴリの表示名（例: "総人口", "土地面積"） */
  name: string;

  /** 親カテゴリ名（categoriesテーブルへの外部キー） */
  categoryName: string;

  /** 表示順序（0から始まる） */
  displayOrder: number;
}

/**
 * カテゴリ作成時の入力データ型
 */
export interface CreateCategoryInput {
  /** カテゴリ名（必須、PRIMARY KEY） */
  categoryName: string;

  /** カテゴリの表示名（必須） */
  name: string;

  /** Lucide Reactのアイコン名（オプション） */
  icon?: string;

  /** 表示順序（デフォルト: 0） */
  displayOrder: number;
}

/**
 * カテゴリ更新時の入力データ型
 */
export interface UpdateCategoryInput {
  /** カテゴリ名（オプション、PRIMARY KEY） */
  categoryName?: string;

  /** カテゴリの表示名（オプション） */
  name?: string;

  /** Lucide Reactのアイコン名（オプション） */
  icon?: string;

  /** 表示順序（オプション） */
  displayOrder?: number;
}

/**
 * サブカテゴリ作成時の入力データ型
 */
export interface CreateSubcategoryInput {
  /** サブカテゴリ名（必須、PRIMARY KEY） */
  subcategoryName: string;

  /** サブカテゴリの表示名（必須） */
  name: string;

  /** 親カテゴリ名（必須） */
  categoryName: string;

  /** 表示順序（デフォルト: 0） */
  displayOrder: number;
}

/**
 * サブカテゴリ更新時の入力データ型
 */
export interface UpdateSubcategoryInput {
  /** サブカテゴリ名（オプション、PRIMARY KEY） */
  subcategoryName?: string;

  /** サブカテゴリの表示名（オプション） */
  name?: string;

  /** 親カテゴリ名（オプション） */
  categoryName?: string;

  /** 表示順序（オプション） */
  displayOrder?: number;
}
