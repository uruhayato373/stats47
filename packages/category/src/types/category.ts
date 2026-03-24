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
}
