"use client";

import React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

/**
 * テーマ切り替えボタンコンポーネント
 * 
 * next-themes を使用したシンプルな実装。
 * mounted 状態の管理は next-themes が自動で行います。
 */
export const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="size-8 flex items-center justify-center text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors"
      aria-label="Toggle theme"
      title={`Current theme: ${theme}. Click to switch to ${theme === "light" ? "dark" : "light"}`}
    >
      {theme === "light" ? (
        <Moon className="size-4" />
      ) : (
        <Sun className="size-4" />
      )}
    </button>
  );
};

ThemeToggleButton.displayName = "ThemeToggleButton";
