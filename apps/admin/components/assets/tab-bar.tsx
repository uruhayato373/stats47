"use client";

import { cn } from "@stats47/components";

import type { AssetTabDTO } from "@/lib/contracts/types";

/** 旧 UI (assets.html #tabbar) のタブバー。sticky で上部固定。 */
export function TabBar({
  tabs,
  current,
  onSelect,
}: {
  tabs: AssetTabDTO[];
  current: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="sticky top-[57px] z-10 -mx-6 flex flex-wrap gap-1.5 border-b border-console-border bg-console-bg px-6 py-2.5">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onSelect(tab.id)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs transition-colors",
            current === tab.id
              ? "border-console-accent bg-console-accent font-semibold text-console-bg"
              : "border-console-border bg-transparent text-console-muted hover:border-console-accent/60",
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
