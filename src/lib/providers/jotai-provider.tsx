"use client";

import { Provider } from "jotai";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swr/fetcher";
import { ThemeProvider } from "./theme-provider";

interface JotaiProviderProps {
  children: React.ReactNode;
}

/**
 * Jotai状態管理プロバイダー
 *
 * アプリケーション全体にJotaiの状態管理を提供します。
 * - Jotai Provider: 状態管理の基盤
 * - SWR設定: データフェッチの設定
 * - テーマ初期化: テーマの初期化処理
 */
export function JotaiProvider({ children }: JotaiProviderProps) {
  return (
    <Provider>
      <SWRConfig
        value={{
          fetcher,
          revalidateOnFocus: true,
          revalidateOnReconnect: true,
          dedupingInterval: 10000,
          errorRetryCount: 3,
          errorRetryInterval: 5000,
          // 開発環境のみデバッグログを有効化
          onError: (error, key) => {
            if (process.env.NODE_ENV === "development") {
              console.error("SWR Error:", { error, key });
            }
          },
        }}
      >
        <ThemeProvider>{children}</ThemeProvider>
      </SWRConfig>
    </Provider>
  );
}
