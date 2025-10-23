"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/atoms/ui/button";

/**
 * テーマ切り替えボタンコンポーネント
 * 
 * shadcn/uiのButtonコンポーネントとnext-themesを使用。
 * テーマトークンにより自動的にテーマが切り替わります。
 */
export const ThemeToggleButton = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={`Current theme: ${theme}. Click to switch to ${theme === "light" ? "dark" : "light"}`}
    >
      {theme === "light" ? <Moon className="size-4" /> : <Sun className="size-4" />}
    </Button>
  );
};

ThemeToggleButton.displayName = "ThemeToggleButton";
