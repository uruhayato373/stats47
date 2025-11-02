/**
 * ダッシュボードエラー表示コンポーネント
 * ダッシュボードの読み込みエラーを表示
 */

interface DashboardErrorProps {
  /** エラーメッセージ */
  message?: string;
  /** エラーオブジェクト */
  error?: Error;
}

/**
 * ダッシュボードエラー表示
 */
export function DashboardError({
  message,
  error,
}: DashboardErrorProps) {
  const errorMessage =
    message || error?.message || "ダッシュボードの読み込みに失敗しました";

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-destructive mb-2">
          エラー
        </h2>
        <p className="text-sm text-muted-foreground">{errorMessage}</p>
        {error && (
          <details className="mt-4 text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              詳細
            </summary>
            <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto">
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

