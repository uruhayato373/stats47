"use client";

/**
 * 配色テーマの切替。
 *
 * ★React state を持たない。init script (layout.tsx) が描画前に .dark を確定させるため、
 *   state を持つと SSR 出力 (state 初期値) と実 DOM がずれて hydration mismatch になる。
 *   表示の出し分けは CSS (dark:) に任せ、ここは DOM の反転と保存だけを担う。
 */
import { MoonIcon, SunIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const KEY = "stats47-console-theme";

function toggleTheme() {
  const root = document.documentElement;
  const next = root.classList.contains("dark") ? "light" : "dark";
  root.classList.toggle("dark", next === "dark");
  try {
    localStorage.setItem(KEY, next);
  } catch {
    // プライベートモード等で保存できなくても、このセッションの切替は成立させる
  }
}

/** ラベルは「押した後に切り替わる先」を出す。出し分けは CSS の dark: が行う。公式 Button (ghost・icon) に lucide のアイコンを置く。 */
export function ThemeToggle() {
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="配色テーマを切り替える" title="配色テーマを切り替える">
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />
    </Button>
  );
}
