"use client";

import { Provider } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import { useEffect } from "react";
import { useAtom, useSetAtom } from "jotai";
import { initThemeAtom, mountedAtom } from "@/atoms/theme";

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
      <ThemeInitializer />
      {children}
    </Provider>
  );
}