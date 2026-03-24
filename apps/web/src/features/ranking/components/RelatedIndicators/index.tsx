"use client";

import type { RankingItem } from "@stats47/ranking";

interface RelatedIndicatorsSectionWrapperProps {
  rankingKey: string;
  indicatorName: string;
  itemDetail: RankingItem;
}

/**
 * RelatedIndicatorsSectionのラッパーコンポーネント（無効化）
 * 
 * DB接続依存を削除するため、現在は何も表示しません。
 */
export function RelatedIndicatorsSectionWrapper({
  rankingKey,
  indicatorName,
  itemDetail,
}: RelatedIndicatorsSectionWrapperProps) {
  return null;
}

