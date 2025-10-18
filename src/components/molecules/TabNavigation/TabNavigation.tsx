"use client";

import React, { useCallback, memo } from "react";
import { LucideIcon } from "lucide-react";

/**
 * TabItem - タブアイテムの型定義
 */
export interface TabItem {
  /** タブの一意ID */
  id: string;
  /** タブの表示ラベル */
  label: string;
  /** タブのアイコンコンポーネント */
  icon: LucideIcon;
  /** タブのカウント（オプション） */
  count?: number;
  /** タブが無効かどうか（オプション） */
  disabled?: boolean;
}

/**
 * TabNavigationProps - タブナビゲーションのプロパティ
 */
export interface TabNavigationProps {
  /** タブアイテムの配列 */
  tabs: TabItem[];
  /** 現在アクティブなタブのID */
  activeTab: string;
  /** タブがクリックされた時のコールバック */
  onTabChange: (tabId: string) => void;
  /** カスタムクラス名（オプション） */
  className?: string;
  /** タブの間隔（デフォルト: space-x-8） */
  spacing?: "space-x-6" | "space-x-8" | "space-x-4";
  /** アイコンのサイズ（デフォルト: w-4 h-4） */
  iconSize?: "w-3 h-3" | "w-4 h-4" | "w-5 h-5";
  /** カウントバッジの表示（デフォルト: true） */
  showCount?: boolean;
}

/**
 * TabButtonProps - 個別タブボタンのプロパティ
 */
interface TabButtonProps {
  /** タブアイテム */
  tab: TabItem;
  /** アクティブ状態かどうか */
  isActive: boolean;
  /** アイコンのサイズ */
  iconSize: string;
  /** カウントバッジの表示 */
  showCount: boolean;
  /** クリック時のコールバック */
  onTabClick: (tabId: string) => void;
}

/**
 * TabButton - 個別タブボタンコンポーネント
 *
 * 機能:
 * - 個別タブの表示とクリック処理
 * - アクティブ状態の視覚的フィードバック
 * - 無効状態のサポート
 * - カウントバッジの表示
 */
const TabButton = memo(function TabButton({
  tab,
  isActive,
  iconSize,
  showCount,
  onTabClick,
}: TabButtonProps) {
  const IconComponent = tab.icon;
  const isDisabled = tab.disabled;

  return (
    <button
      key={tab.id}
      onClick={() => !isDisabled && onTabClick(tab.id)}
      disabled={isDisabled}
      className={`
        py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
        transition-all duration-200
        ${
          isDisabled
            ? "opacity-50 cursor-not-allowed text-gray-400"
            : isActive
            ? "border-indigo-500 text-indigo-600 dark:text-indigo-400"
            : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-neutral-400 dark:hover:text-neutral-300"
        }
      `}
    >
      <IconComponent className={iconSize} />
      {tab.label}
      {showCount && tab.count !== undefined && tab.count > 0 && (
        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full dark:bg-neutral-700 dark:text-neutral-300">
          {tab.count}
        </span>
      )}
    </button>
  );
});

/**
 * TabNavigation - 統一されたタブナビゲーションコンポーネント
 *
 * 機能:
 * - 一貫したタブUIの提供
 * - アイコンとカウントバッジのサポート
 * - アクティブ状態の管理
 * - カスタマイズ可能なスタイル
 * - パフォーマンス最適化（React.memo, useCallback）
 *
 * 使用例:
 * ```tsx
 * <TabNavigation
 *   tabs={[
 *     { id: "overview", label: "概要", icon: Info, count: 5 },
 *     { id: "data", label: "データ", icon: Database }
 *   ]}
 *   activeTab={activeTab}
 *   onTabChange={setActiveTab}
 * />
 * ```
 */
function TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  className = "",
  spacing = "space-x-8",
  iconSize = "w-4 h-4",
  showCount = true,
}: TabNavigationProps) {
  /**
   * タブクリック時のハンドラー（useCallbackでメモ化）
   */
  const handleTabClick = useCallback(
    (tabId: string) => {
      onTabChange(tabId);
    },
    [onTabChange]
  );

  return (
    <div
      className={`border-b border-gray-200 dark:border-neutral-700 ${className}`}
    >
      <nav className={`-mb-px flex ${spacing}`}>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            tab={tab}
            isActive={activeTab === tab.id}
            iconSize={iconSize}
            showCount={showCount}
            onTabClick={handleTabClick}
          />
        ))}
      </nav>
    </div>
  );
}

export default memo(TabNavigation);
