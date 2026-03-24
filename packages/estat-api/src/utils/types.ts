/**
 * ログコンテキストの型定義
 */
export interface EstatLogContext {
  /** 統計表ID */
  statsDataId: string;
  /** カテゴリコード（フィルタリング用） */
  categoryFilter?: string;
  /** 地域コード */
  areaCode?: string;
  /** カード/チャートタイトル */
  title?: string;
  /** その他のコンテキスト情報 */
  [key: string]: unknown;
}

/**
 * エラーハンドリングとロギングのオプション
 */
export interface EstatErrorHandlingOptions {
  /** コンポーネント名（ログメッセージに使用） */
  componentName: string;
  /** ロギングを有効化するか（デフォルト: true） */
  enableLogging?: boolean;
}
