import React from "react";

/**
 * ダッシュボードチャートの共通スケルトン。
 * Suspense の fallback として使用する。
 */
export const ChartSkeleton: React.FC = () => (
  <div className="bg-card border rounded-lg p-4 shadow-sm">
    <div className="animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-3" />
      <div className="h-[250px] bg-muted/30 rounded" />
    </div>
  </div>
);
