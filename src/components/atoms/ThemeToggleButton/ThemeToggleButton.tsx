"use client";

import React, { useCallback } from "react";
import { Loader2, Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

// ===== 定数定義 =====
const BUTTON_SIZE = "size-8";
const ICON_SIZE = "size-4";

/**
 * テーマ切り替えボタンコンポーネント
 *
 * ライトテーマとダークテーマを切り替えるためのボタンUIを提供します。
 * テーマの状態に応じて適切なアイコンを表示し、ユーザーが直感的にテーマを切り替えられるようにします。
 *
 * @features
 * - ライト/ダークテーマの切り替え機能
 * - テーマ状態に応じたアイコン表示（太陽/月）
 * - ローディング状態の表示
 * - アクセシビリティ対応（aria-label, title）
 * - ホバー・フォーカス状態の視覚的フィードバック
 * - パフォーマンス最適化（React.memo, useCallback, lucide-react）
 *
 * @usage
 * ```tsx
 * import { ThemeToggleButton } from "@/components/atoms/ThemeToggleButton";
 *
 * <ThemeToggleButton />
 * ```
 *
 * @accessibility
 * - aria-label: ボタンの目的を説明
 * - title: 現在のテーマと次のアクションを説明
 * - disabled: ローディング中は操作を無効化
 */
const ThemeToggleButtonComponent: React.FC = () => {
  // テーマフックから現在のテーマ状態と操作関数を取得
  const { theme, mounted, toggleTheme } = useTheme();

  /**
   * テーマ切り替えハンドラー
   *
   * ボタンクリック時にテーマを切り替えます。
   * useTheme フックの toggleTheme 関数を呼び出します。
   * useCallback でメモ化してパフォーマンスを最適化。
   */
  const handleThemeToggle = useCallback(() => {
    toggleTheme();
  }, [toggleTheme]);

  /**
   * ボタンのタイトルテキスト
   *
   * 現在のテーマと次のアクションを説明するテキストを生成します。
   */
  const buttonTitle = `Current theme: ${theme}. Click to switch to ${
    theme === "light" ? "dark" : "light"
  }`;

  // ===== ローディング状態の表示 =====
  // mounted状態でない場合は、ローディング状態を表示
  // これにより、サーバーサイドレンダリング時のハイドレーション不整合を防ぐ
  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className={`${BUTTON_SIZE} flex items-center justify-center text-gray-500 rounded-lg border border-gray-200 bg-gray-100 cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-600`}
        aria-label="Theme loading"
      >
        <Loader2 className={`${ICON_SIZE} animate-spin`} />
      </button>
    );
  }

  // ===== メインボタンの表示 =====
  return (
    <button
      type="button"
      onClick={handleThemeToggle}
      className={`${BUTTON_SIZE} flex items-center justify-center text-gray-600 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 focus:outline-hidden focus:bg-gray-100 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-700 dark:focus:bg-neutral-700 transition-colors`}
      aria-label="Toggle theme"
      title={buttonTitle}
    >
      {/* テーマに応じたアイコンの表示 */}
      {theme === "light" ? (
        <Moon className={ICON_SIZE} />
      ) : (
        <Sun className={ICON_SIZE} />
      )}
    </button>
  );
};

// displayName を設定してReact DevToolsで識別しやすくする
ThemeToggleButtonComponent.displayName = "ThemeToggleButton";

// React.memo でメモ化してエクスポート
export const ThemeToggleButton = React.memo(ThemeToggleButtonComponent);
