"use client";

import React, { useCallback, useMemo } from "react";
import { useTheme } from "@/hooks/useTheme";

// ===== 定数定義 =====
const BUTTON_SIZE = "size-8";
const ICON_SIZE = "size-4";
const SVG_SIZE = 24;

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
 * - パフォーマンス最適化（React.memo, useCallback）
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
   * ローディングスピナーアイコンコンポーネント
   *
   * ローディング状態で表示するスピナーアイコンを提供します。
   * useMemo でメモ化してパフォーマンスを最適化。
   */
  const LoadingSpinner = useMemo(
    () => (
      <svg
        className={`${ICON_SIZE} animate-spin`}
        xmlns="http://www.w3.org/2000/svg"
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
    ),
    []
  );

  /**
   * 太陽アイコンコンポーネント
   *
   * ライトテーマ時に表示する太陽アイコンを提供します。
   * useMemo でメモ化してパフォーマンスを最適化。
   */
  const SunIcon = useMemo(
    () => (
      <svg
        className={ICON_SIZE}
        xmlns="http://www.w3.org/2000/svg"
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    []
  );

  /**
   * 月アイコンコンポーネント
   *
   * ダークテーマ時に表示する月アイコンを提供します。
   * useMemo でメモ化してパフォーマンスを最適化。
   */
  const MoonIcon = useMemo(
    () => (
      <svg
        className={ICON_SIZE}
        xmlns="http://www.w3.org/2000/svg"
        width={SVG_SIZE}
        height={SVG_SIZE}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="m12 1 0 2" />
        <path d="m12 21 0 2" />
        <path d="m4.22 4.22 1.42 1.42" />
        <path d="m18.36 18.36 1.42 1.42" />
        <path d="m1 12 2 0" />
        <path d="m21 12 2 0" />
        <path d="m4.22 19.78 1.42-1.42" />
        <path d="m18.36 5.64 1.42-1.42" />
      </svg>
    ),
    []
  );

  /**
   * ボタンのタイトルテキスト
   *
   * 現在のテーマと次のアクションを説明するテキストを生成します。
   * useMemo でメモ化してパフォーマンスを最適化。
   */
  const buttonTitle = useMemo(
    () =>
      `Current theme: ${theme}. Click to switch to ${
        theme === "light" ? "dark" : "light"
      }`,
    [theme]
  );

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
        {LoadingSpinner}
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
      {theme === "light" ? SunIcon : MoonIcon}
    </button>
  );
};

// displayName を設定してReact DevToolsで識別しやすくする
ThemeToggleButtonComponent.displayName = "ThemeToggleButton";

// React.memo でメモ化してエクスポート
export const ThemeToggleButton = React.memo(ThemeToggleButtonComponent);
