"use client";

import React from "react";

export interface StatResultItem {
  label: string;
  value: number | null;
  unit: string | null;
  year: string | null;
}

interface MultiStatCardClientProps {
  title: string;
  rankingLink?: string | null;
  rankingLinks?: Array<{ label: string; url: string }>;
  results: StatResultItem[];
  showTotal?: boolean;
  totalLabel?: string;
}

export const MultiStatCardClient: React.FC<MultiStatCardClientProps> = ({
  title,
  rankingLink,
  rankingLinks,
  results,
  showTotal = false,
  totalLabel = "合計",
}) => {
  const totalValue =
    showTotal && results.every((r) => r.value !== null)
      ? results.reduce((sum, r) => sum + (r.value ?? 0), 0)
      : null;
  const year = results[0]?.year ?? null;

  return (
    <div className="bg-card border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-sm text-muted-foreground">{title}</h3>
        {rankingLink && (
          <a href={rankingLink} className="text-sm text-primary hover:underline">
            詳細 →
          </a>
        )}
      </div>

      <ul className="space-y-1">
        {results.map((r, i) => (
          <li key={i} className="flex justify-between items-baseline gap-2">
            <span className="text-sm text-muted-foreground">{r.label}</span>
            <span className="text-lg font-semibold tabular-nums">
              {r.value !== null ? r.value.toLocaleString() : "---"}
              {r.unit && (
                <span className="text-sm font-normal text-muted-foreground ml-1">
                  {r.unit}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
      {showTotal && totalValue !== null && (
        <div className="mt-2 pt-2 border-t flex justify-between items-baseline">
          <span className="text-sm font-medium text-muted-foreground">
            {totalLabel}
          </span>
          <span className="text-xl font-bold tabular-nums">
            {totalValue.toLocaleString()}
            {results[0]?.unit && (
              <span className="text-sm font-normal text-muted-foreground ml-1">
                {results[0].unit}
              </span>
            )}
          </span>
        </div>
      )}
      {rankingLinks && rankingLinks.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
          {rankingLinks.map((link) => (
            <a
              key={link.url}
              href={link.url}
              className="text-xs text-primary hover:underline"
            >
              {link.label} →
            </a>
          ))}
        </div>
      )}
      {year && (
        <p className="text-xs text-muted-foreground mt-2">{year}時点</p>
      )}
    </div>
  );
};
