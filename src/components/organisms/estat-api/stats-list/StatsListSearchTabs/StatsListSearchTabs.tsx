"use client";

import { useState } from "react";
import { Filter, Search, SlidersHorizontal } from "lucide-react";
import {
  TabNavigation,
  type TabItem,
} from "@/components/molecules/TabNavigation";
import { StatsListSearch } from "@/components/molecules/StatsListSearch";
import { AdvancedStatsListSearch } from "../AdvancedStatsListSearch";
import { StatsFieldNavigation } from "../StatsFieldNavigation";
import {
  StatsListSearchOptions,
  AdvancedStatsListSearchOptions,
  StatsFieldCode,
} from "@/lib/estat-api/types/stats-list";

/**
 * StatsListSearchTabsのプロパティ定義
 */
interface StatsListSearchTabsProps {
  /** シンプル検索の実行コールバック */
  onSimpleSearch: (options: StatsListSearchOptions) => void;
  /** 高度検索の実行コールバック */
  onAdvancedSearch: (options: AdvancedStatsListSearchOptions) => void;
  /** 統計分野選択のコールバック */
  onFieldSelect: (fieldCode: StatsFieldCode) => void;
  /** 選択された統計分野コード */
  selectedField?: StatsFieldCode;
  /** ローディング状態 */
  isLoading?: boolean;
  /** デフォルトのタブ（デフォルト: "field"） */
  defaultTab?: "field" | "simple" | "advanced";
}

/**
 * StatsListSearchTabs - 統計表検索タブコンポーネント
 *
 * 機能:
 * - 3つの検索モード（分野別、シンプル、高度）をタブで切り替え
 * - 各タブに応じた適切な検索フォームを表示
 * - タブナビゲーションによる直感的な操作
 *
 * @param onSimpleSearch - シンプル検索の実行コールバック
 * @param onAdvancedSearch - 高度検索の実行コールバック
 * @param onFieldSelect - 統計分野選択のコールバック
 * @param selectedField - 選択された統計分野コード
 * @param isLoading - ローディング状態
 * @param defaultTab - デフォルトのタブ
 */
export default function StatsListSearchTabs({
  onSimpleSearch,
  onAdvancedSearch,
  onFieldSelect,
  selectedField,
  isLoading = false,
  defaultTab = "field",
}: StatsListSearchTabsProps) {
  // ===== 状態管理 =====

  /** アクティブなタブのID */
  const [activeTab, setActiveTab] = useState<string>(defaultTab);

  // ===== タブ定義 =====

  /** タブアイテムの定義 */
  const tabs: TabItem[] = [
    {
      id: "field",
      label: "分野別",
      icon: Filter,
    },
    {
      id: "simple",
      label: "シンプル",
      icon: Search,
    },
    {
      id: "advanced",
      label: "高度検索",
      icon: SlidersHorizontal,
    },
  ];

  // ===== イベントハンドラー =====

  /**
   * タブ変更時の処理
   * @param tabId - 選択されたタブのID
   */
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  // ===== レンダリング =====

  return (
    <div className="bg-white rounded-lg shadow-md">
      {/* タブナビゲーション */}
      <TabNavigation
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        className="px-6 pt-4"
      />

      {/* タブコンテンツ */}
      <div className="p-6">
        {activeTab === "field" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              統計分野別検索
            </h3>
            <StatsFieldNavigation
              onFieldSelect={onFieldSelect}
              selectedField={selectedField}
            />
          </div>
        )}

        {activeTab === "simple" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              シンプル検索
            </h3>
            <StatsListSearch onSearch={onSimpleSearch} isLoading={isLoading} />
          </div>
        )}

        {activeTab === "advanced" && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              高度検索
            </h3>
            <AdvancedStatsListSearch
              onSearch={onAdvancedSearch}
              isLoading={isLoading}
            />
          </div>
        )}
      </div>
    </div>
  );
}
