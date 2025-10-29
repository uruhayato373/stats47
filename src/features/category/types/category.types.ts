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
  /** カテゴリの一意なID */
  id: number;

  /** カテゴリのキー（例: "population", "economy"） */
  category_key: string;

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
  /** サブカテゴリの一意なID */
  id: number;

  /** サブカテゴリのキー（例: "basic-population", "land-area"） */
  subcategory_key: string;

  /** サブカテゴリの表示名（例: "総人口", "土地面積"） */
  name: string;

  /** 親カテゴリのID（categoriesテーブルへの外部キー） */
  category_id: number;

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
  /** カテゴリの一意なID */
  id: number;

  /** カテゴリのキー（例: "population", "economy"） */
  categoryKey: string;

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
  /** サブカテゴリの一意なID */
  id: number;

  /** サブカテゴリのキー（例: "basic-population", "land-area"） */
  subcategoryKey: string;

  /** サブカテゴリの表示名（例: "総人口", "土地面積"） */
  name: string;

  /** 親カテゴリのID（categoriesテーブルへの外部キー） */
  categoryId: number;

  /** 表示順序（0から始まる） */
  displayOrder: number;
}

/**
 * カテゴリ作成時の入力データ型
 */
export interface CreateCategoryInput {
  /** カテゴリのキー（必須） */
  categoryKey: string;

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
  /** カテゴリのキー（オプション） */
  categoryKey?: string;

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
  /** サブカテゴリのキー（必須） */
  subcategoryKey: string;

  /** サブカテゴリの表示名（必須） */
  name: string;

  /** 親カテゴリのID（必須） */
  categoryId: number;

  /** 表示順序（デフォルト: 0） */
  displayOrder: number;
}

/**
 * サブカテゴリ更新時の入力データ型
 */
export interface UpdateSubcategoryInput {
  /** サブカテゴリのキー（オプション） */
  subcategoryKey?: string;

  /** サブカテゴリの表示名（オプション） */
  name?: string;

  /** 親カテゴリのID（オプション） */
  categoryId?: number;

  /** 表示順序（オプション） */
  displayOrder?: number;
}
