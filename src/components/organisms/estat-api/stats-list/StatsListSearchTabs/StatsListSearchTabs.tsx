"use client";

import { useState } from "react";
import { Filter, Search } from "lucide-react";
import {
  TabNavigation,
  type TabItem,
} from "@/components/molecules/TabNavigation";
import { StatsListSearch } from "../StatsListSearch";
import { StatsFieldNavigation } from "../StatsFieldNavigation/StatsFieldNavigation";
import {
  StatsListSearchOptions,
  StatsFieldCode,
} from "@/lib/estat-api/types/stats-list";

/**
 * StatsListSearchTabsのプロパティ定義
 */
interface StatsListSearchTabsProps {
  /** シンプル検索の実行コールバック */
  onSimpleSearch: (options: StatsListSearchOptions) => void;
  /** 統計分野選択のコールバック */
  onFieldSelect: (fieldCode: StatsFieldCode) => void;
  /** 選択された統計分野コード */
  selectedField?: StatsFieldCode;
  /** ローディング状態 */
  isLoading?: boolean;
  /** デフォルトのタブ（デフォルト: "field"） */
  defaultTab?: "field" | "simple";
}

/**
 * StatsListSearchTabs - 統計表検索タブコンポーネント
 *
 * 機能:
 * - 2つの検索モード（分野別、シンプル）をタブで切り替え
 * - 各タブに応じた適切な検索フォームを表示
 * - タブナビゲーションによる直感的な操作
 *
 * @param onSimpleSearch - シンプル検索の実行コールバック
 * @param onFieldSelect - 統計分野選択のコールバック
 * @param selectedField - 選択された統計分野コード
 * @param isLoading - ローディング状態
 * @param defaultTab - デフォルトのタブ
 */
export default function StatsListSearchTabs({
  onSimpleSearch,
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
        className="px-6 pt-"
      />

      {/* タブコンテンツ */}
      <div className="p-6">
        {activeTab === "field" && (
          <div>
            <StatsFieldNavigation
              onFieldSelect={onFieldSelect}
              selectedField={selectedField}
            />
          </div>
        )}

        {activeTab === "simple" && (
          <div>
            <StatsListSearch onSearch={onSimpleSearch} isLoading={isLoading} />
          </div>
        )}
      </div>
    </div>
  );
}
