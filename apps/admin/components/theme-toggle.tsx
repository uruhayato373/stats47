"use client";

/**
 * 配色テーマの切替。
 *
 * ★React state を持たない。init script (layout.tsx) が描画前に .dark を確定させるため、
 *   state を持つと SSR 出力 (state 初期値) と実 DOM がずれて hydration mismatch になる。
 *   表示の出し分けは CSS (dark:) に任せ、ここは DOM の反転と保存だけを担う。
 */
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

function MoonIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="h-4 w-4">
      <path
        d="M14.2 10.3A6.4 6.4 0 0 1 5.7 1.8a6.4 6.4 0 1 0 8.5 8.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      className="h-4 w-4"
    >
      <circle cx="8" cy="8" r="3.1" />
      <path
        strokeLinecap="round"
        d="M8 1v1.6M8 13.4V15M1 8h1.6M13.4 8H15M3.1 3.1l1.1 1.1M11.8 11.8l1.1 1.1M12.9 3.1l-1.1 1.1M4.2 11.8l-1.1 1.1"
      />
    </svg>
  );
}

/** ラベルは「押した後に切り替わる先」を出す。出し分けは CSS の dark: が行う。 */
export function ThemeToggle() {
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="配色テーマを切り替える"
      title="配色テーマを切り替える"
      className="flex w-full items-center gap-2 rounded-md border border-console-border px-3 py-2 text-xs text-console-muted transition-colors hover:border-console-accent/50 hover:text-console-fg"
    >
      <span className="flex items-center gap-2 dark:hidden">
        <MoonIcon />
        ダークに切替
      </span>
      <span className="hidden items-center gap-2 dark:flex">
        <SunIcon />
        ライトに切替
      </span>
    </button>
  );
}
