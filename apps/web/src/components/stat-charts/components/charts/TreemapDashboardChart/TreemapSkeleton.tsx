import React from "react";

export const TreemapSkeleton: React.FC = () => (
  <div className="bg-card border rounded-lg p-4 shadow-sm">
    <div className="animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-4" />
      <div className="h-[420px] bg-muted/30 rounded flex items-center justify-center">
        <span className="text-muted-foreground text-sm">読み込み中...</span>
      </div>
    </div>
  </div>
);
