"use client";

import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { initThemeAtom, mountedAtom } from "@/atoms/theme";
import { SWRConfig } from "swr";
import { fetcher } from "@/lib/swr/fetcher";

interface JotaiProviderProps {
  children: React.ReactNode;
}

// テーマ初期化コンポーネント
function ThemeInitializer() {
  const initTheme = useSetAtom(initThemeAtom);
  const [mounted] = useAtom(mountedAtom);

  useEffect(() => {
    if (!mounted) {
      initTheme();
    }
  }, [initTheme, mounted]);

  return null;
}

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
        <ThemeInitializer />
        {children}
      </SWRConfig>
    </Provider>
  );
}
