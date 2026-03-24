import { AlertCircle } from "lucide-react";

/**
 * SidebarErrorStateのProps型定義
 */
interface SidebarErrorStateProps {
  /** エラーメッセージ */
  error: string;
}

/**
 * サイドバーのエラー表示コンポーネント
 *
 * エラーメッセージに応じて適切なメッセージを表示します。
 * データベース接続エラーの場合は特別なメッセージを表示します。
 *
 * @param props - SidebarErrorStateProps
 * @param props.error - エラーメッセージ
 * @returns エラー表示のJSX要素
 */
export function SidebarErrorState({ error }: SidebarErrorStateProps) {
  const errorMessage = error.includes("STATS47_STATIC_DB")
    ? "データベース接続エラー"
    : "データの取得に失敗しました";

  return (
    <div className="px-2 py-2 text-sm text-destructive bg-destructive/10 rounded-md">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4" />
        <span>読み込みエラー</span>
      </div>
      <p className="mt-1 text-xs opacity-90">{errorMessage}</p>
    </div>
  );
}
