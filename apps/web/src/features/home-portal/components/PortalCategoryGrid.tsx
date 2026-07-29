import Link from "next/link";

import { cn } from "@stats47/components";
import { RANKING_PROMINENCE_CATEGORIES } from "@stats47/data-configs/ranking-prominence";
import { ChevronRight } from "lucide-react";


import { TrackedPortalCategoryLink } from "./TrackedPortalCategoryLink";

/**
 * 17カテゴリを一画面で見渡す高密度リスト。
 * `sidebar` はホームの左ペイン用、`grid` は通常の2列一覧用。
 */
export function PortalCategoryGrid({
  variant = "grid",
}: {
  variant?: "grid" | "sidebar";
}) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 border-t border-border",
        variant === "grid" && "md:grid-cols-2 md:[&>*:nth-child(odd)]:border-r",
      )}
    >
      {RANKING_PROMINENCE_CATEGORIES.map((category) => (
        <TrackedPortalCategoryLink
          key={category.categoryKey}
          href={`/category/${category.categoryKey}`}
          label={category.categoryName}
          className={cn(
            "group flex items-center border-b border-border transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50",
            variant === "sidebar"
              ? "min-h-9 gap-2 px-2 py-1.5"
              : "min-h-12 gap-3 px-1 py-2.5",
          )}
        >
          <span
            className={cn(
              "min-w-0 flex-1 font-medium text-foreground group-hover:text-primary",
              variant === "sidebar" ? "text-[13px]" : "text-[15px]",
            )}
          >
            {category.categoryName}
          </span>
          <span
            className={cn(
              "tabular-nums text-muted-foreground",
              variant === "sidebar" ? "text-[11px]" : "text-xs",
            )}
          >
            {category.count.toLocaleString()}件
          </span>
          <ChevronRight
            className={cn(
              "shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary",
              variant === "sidebar" ? "size-3.5" : "size-4",
            )}
          />
        </TrackedPortalCategoryLink>
      ))}
      <Link
        href="/ranking"
        className={cn(
          "flex items-center justify-between border-b border-border font-semibold text-primary hover:bg-accent/50",
          variant === "sidebar"
            ? "min-h-9 px-2 py-1.5 text-[13px]"
            : "min-h-12 px-1 py-2.5 text-[15px] md:col-span-2",
        )}
      >
        すべてのランキングを見る
        <ChevronRight className={variant === "sidebar" ? "size-3.5" : "size-4"} />
      </Link>
    </div>
  );
}
