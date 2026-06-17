import "server-only";

/**
 * ページコンポーネント（DB から取得した統一型）
 *
 * KPI カード・チャート・属性マトリクス等、全コンポーネントを同じ型で扱う。
 *
 * 注: 実装は R2 snapshot 経由 (page-components-snapshot.ts) に移行済み。
 * 本ファイルは型定義のみ提供する。
 */
export interface PageComponent {
  componentKey: string;
  componentType: string;
  title: string;
  componentProps: Record<string, unknown>;
  sourceName: string | null;
  sourceLink: string | null;
  rankingLink: string | null;
  gridColumnSpan: number;
  gridColumnSpanTablet: number | null;
  gridColumnSpanSm: number | null;
  dataSource: string | null;
  section: string | null;
  sortOrder: number;
}

/** @deprecated PageComponent を使用してください */
export type PageChart = PageComponent;
