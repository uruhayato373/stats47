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
  /** カテゴリキー（PRIMARY KEY、例: "population", "economy"） */
  category_key: string;

  /** カテゴリの表示名（例: "人口・世帯"） */
  category_name: string;

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
  /** サブカテゴリキー（PRIMARY KEY、例: "basic-population", "land-area"） */
  subcategory_key: string;

  /** サブカテゴリの表示名（例: "総人口", "土地面積"） */
  subcategory_name: string;

  /** 親カテゴリキー（categoriesテーブルへの外部キー） */
  category_key: string;

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
  /** カテゴリキー（PRIMARY KEY、例: "population", "economy"） */
  categoryKey: string;

  /** カテゴリの表示名（例: "人口・世帯"） */
  categoryName: string;

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
  /** サブカテゴリキー（PRIMARY KEY、例: "basic-population", "land-area"） */
  subcategoryKey: string;

  /** サブカテゴリの表示名（例: "総人口", "土地面積"） */
  subcategoryName: string;

  /** 親カテゴリキー（categoriesテーブルへの外部キー） */
  categoryKey: string;

  /** 表示順序（0から始まる） */
  displayOrder: number;
}
