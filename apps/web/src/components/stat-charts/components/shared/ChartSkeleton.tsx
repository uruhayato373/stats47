import React from "react";

import { ChartLoadingCard } from "@/components/charts/ChartState";

/**
 * ダッシュボードチャートの共通スケルトン。
 * Suspense の fallback として使用する。
 */
export const ChartSkeleton: React.FC = () => (
  <ChartLoadingCard />
);
