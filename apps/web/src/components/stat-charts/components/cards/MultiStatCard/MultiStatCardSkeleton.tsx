import React from "react";

export const MultiStatCardSkeleton: React.FC = () => (
  <div className="bg-card border rounded-lg p-4 shadow-sm">
    <div className="animate-pulse space-y-2">
      <div className="h-4 bg-muted rounded w-1/3 mb-2" />
      <div className="h-8 bg-muted rounded w-2/3" />
      <div className="h-8 bg-muted rounded w-2/3" />
      <div className="h-8 bg-muted rounded w-2/3" />
      <div className="h-8 bg-muted rounded w-1/2 mt-2" />
    </div>
  </div>
);
