import { ChartEmptyState } from "./ChartState";

/**
 * フロー系 Sankey の読み込み中 / エラー時フォールバック。
 * 3 ラッパで重複していた同一マークアップ（aspect-[100/73] のプレースホルダ）を集約。
 */
export function SankeyFallback({ message }: { message: string }) {
  return (
    <ChartEmptyState
      message={message}
      className="aspect-[100/73] w-full border bg-muted"
    />
  );
}
