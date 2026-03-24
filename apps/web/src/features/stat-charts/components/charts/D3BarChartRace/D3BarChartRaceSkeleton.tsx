import React from "react";

export const D3BarChartRaceSkeleton: React.FC = () => (
  <div className="bg-card border rounded-lg p-4 shadow-sm">
    <div className="animate-pulse">
      <div className="h-6 bg-muted rounded w-1/3 mb-4" />
      <div className="h-[500px] bg-muted/30 rounded" />
    </div>
  </div>
);
