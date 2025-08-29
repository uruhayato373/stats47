"use client";

import { createContext, useContext, useEffect, useState } from "react";

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
  const applyTheme = (newTheme: Theme) => {
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

      // デバッグ情報
      if (process.env.NODE_ENV === "development") {
        console.log("Theme applied to DOM:", newTheme);
        console.log("HTML classes:", root.classList.toString());
        console.log("Body classes:", body.classList.toString());

        // 実際のスタイルを確認
        const computedStyle = window.getComputedStyle(body);
        console.log("Body background color:", computedStyle.backgroundColor);
        console.log("Body color:", computedStyle.color);
      }

      // テーマ適用の確認
      setTimeout(() => {
        const currentClasses = root.classList.toString();
        if (!currentClasses.includes(newTheme)) {
          console.warn("Theme class not properly applied, retrying...");
          applyTheme(newTheme);
        }
      }, 100);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.warn("Failed to apply theme:", error);
      }
    }
  };

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

        if (process.env.NODE_ENV === "development") {
          console.log("Initial theme set to:", initialTheme);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development") {
          console.warn("Failed to initialize theme:", error);
        }
      } finally {
        setMounted(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!mounted || typeof window === "undefined") return;

    // テーマが変更されたらDOMに適用
    applyTheme(theme);

    if (process.env.NODE_ENV === "development") {
      console.log("Theme state changed to:", theme);
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    setTheme((prev) => {
      const newTheme = prev === "light" ? "dark" : "light";
      if (process.env.NODE_ENV === "development") {
        console.log("Toggling theme from", prev, "to", newTheme);
      }
      return newTheme;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  );
};
