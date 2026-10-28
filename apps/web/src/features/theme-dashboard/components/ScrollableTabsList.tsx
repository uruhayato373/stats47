"use client";

import { TabsList, TabsTrigger } from "@stats47/components/atoms/ui/tabs";

import { ScrollableRow } from "./ScrollableRow";

import type { TabIndicatorConfig } from "../types";

interface ScrollableTabsListProps {
  tabs: TabIndicatorConfig[];
}

/**
 * 左右スクロールボタン付きタブリスト
 *
 * タブが多くてはみ出す場合にのみ矢印ボタンを表示。
 * スクロールの機構は `ScrollableRow` に切り出してある (KPI タイル列と共用)。
 */
export function ScrollableTabsList({ tabs }: ScrollableTabsListProps) {
  return (
    <ScrollableRow>
      <TabsList className="inline-flex w-max h-8">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.rankingKey}
            value={tab.rankingKey}
            className="sm:text-xs whitespace-nowrap data-active:border"
          >
            {tab.tabLabel}
          </TabsTrigger>
        ))}
      </TabsList>
    </ScrollableRow>
  );
}
