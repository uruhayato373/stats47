"use client";

import { useMemo } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@stats47/components";

import type { Category } from "@/features/category";

import { getIcon } from "@/lib/icons";

interface CategoryListProps {
  categories: Category[];
}

/**
 * カテゴリリストコンポーネント
 *
 * カテゴリをフラットなリンクリストで表示します。
 * 各カテゴリが `/{categoryKey}` に遷移します。
 */
export function CategoryAccordion({ categories }: CategoryListProps) {
  const pathname = usePathname();

  if (categories.length === 0) {
    return (
      <div className="px-2 py-2 text-sm text-muted-foreground">
        カテゴリがありません
      </div>
    );
  }

  return (
    <div className="w-full space-y-0.5">
      {categories.map((category) => (
        <CategoryLinkItem
          key={category.categoryKey}
          category={category}
          isActive={pathname?.startsWith(`/category/${category.categoryKey}`) ?? false}
        />
      ))}
    </div>
  );
}

interface CategoryLinkItemProps {
  category: Category;
  isActive: boolean;
}

function CategoryLinkItem({ category, isActive }: CategoryLinkItemProps) {
  const IconComponent = useMemo(
    () => getIcon(category.icon ?? ""),
    [category.icon]
  );

  return (
    <Link
      href={`/category/${category.categoryKey}`}
      prefetch={false}
      className={cn(
        "flex items-center gap-2 px-3 py-1 text-xs font-normal text-foreground/80 rounded-lg transition-colors hover:bg-accent/50 active:bg-accent",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        {/* eslint-disable-next-line react-hooks/static-components -- Icon is memoized via useMemo */}
        <IconComponent className="h-[15px] w-[15px]" />
      </div>
      <span>{category.categoryName}</span>
    </Link>
  );
}
