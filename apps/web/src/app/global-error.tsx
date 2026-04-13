"use client";

import { useEffect } from "react";

/**
 * ルートレベルの例外ハンドラ。
 * Next.js App Router の仕様で <html>/<body> を含む必要がある。
 * 各セグメントの error.tsx で捕捉されなかった例外がここに到達する。
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Error is already captured by Next.js error boundary
  }, [error]);

  return (
    <html lang="ja">
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily:
              "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            color: "#0f172a",
            background: "#f8fafc",
          }}
        >
          <div style={{ maxWidth: 480, textAlign: "center" }}>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "1rem" }}>
              ページを表示できませんでした
            </h1>
            <p style={{ color: "#64748b", marginBottom: "1.5rem", lineHeight: 1.7 }}>
              申し訳ありません、一時的なエラーが発生しました。
              少し時間をおいて再度お試しください。
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "0.375rem",
                border: "1px solid #0f172a",
                background: "#0f172a",
                color: "#fff",
                cursor: "pointer",
                fontSize: "0.875rem",
                fontWeight: 600,
              }}
            >
              再読み込み
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
