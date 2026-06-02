/**
 * フロー系 Sankey の読み込み中 / エラー時フォールバック。
 * 3 ラッパで重複していた同一マークアップ（aspect-[100/73] のプレースホルダ）を集約。
 */
export function SankeyFallback({ message }: { message: string }) {
  return (
    <div className="flex aspect-[100/73] w-full items-center justify-center rounded-md border bg-slate-50 text-sm text-slate-500 dark:bg-slate-900">
      {message}
    </div>
  );
}
