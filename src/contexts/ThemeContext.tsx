"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // テーマをDOMに適用する関数
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === "undefined") return;

    try {
      const root = document.documentElement;
      const body = document.body;

      // 既存のクラスをクリア
      root.classList.remove("light", "dark");

      // 新しいテーマクラスを追加
      root.classList.add(newTheme);

      // bodyにもクラスを追加（念のため）
      body.classList.remove("light", "dark");
      body.classList.add(newTheme);

      // localStorageに保存
      localStorage.setItem("theme", newTheme);

      // テーマ適用の確認
      setTimeout(() => {
        const currentClasses = root.classList.toString();
        if (!currentClasses.includes(newTheme)) {
          applyTheme(newTheme);
        }
      }, 100);
    } catch {
      // エラーが発生した場合は静かに処理
    }
  }, []);

  useEffect(() => {
    // クライアントサイドでのみ実行
    if (typeof window !== "undefined") {
      try {
        const savedTheme = localStorage.getItem("theme") as Theme | null;
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;

        let initialTheme: Theme = "light";

        if (savedTheme) {
          initialTheme = savedTheme;
        } else if (systemPrefersDark) {
          initialTheme = "dark";
        }

        setTheme(initialTheme);

        // 初期テーマをDOMに適用
        applyTheme(initialTheme);
      } catch {
        // エラーが発生した場合は静かに処理
      } finally {
        setMounted(true);
      }
    }
  }, [applyTheme]);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    // テーマが変更されたらDOMに適用
    applyTheme(theme);
  }, [theme, mounted, applyTheme]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};
