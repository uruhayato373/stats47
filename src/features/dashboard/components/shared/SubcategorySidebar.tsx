/**
 * サブカテゴリサイドバーコンポーネント（Client Component）
 *
 * 同じカテゴリに含まれるサブカテゴリをリスト表示し、
 * クリックで該当サブカテゴリのダッシュボードページに遷移します。
 */

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

interface SubcategorySidebarProps {
  /** サブカテゴリのリスト */
  subcategories: Array<{ subcategoryKey: string; subcategoryName: string }>;
  /** 現在のサブカテゴリキー */
  currentSubcategory: string;
  /** 現在の地域コード */
  areaCode: string;
}

/**
 * サブカテゴリサイドバーコンポーネント
 */
export function SubcategorySidebar({
  subcategories,
  currentSubcategory,
  areaCode,
}: SubcategorySidebarProps) {
  const params = useParams();
  const category = params.category as string;

  return (
    <div className="h-full w-full border-l border-border bg-background p-4">
      <h3 className="mb-4 text-sm font-semibold text-foreground">
        サブカテゴリ
      </h3>
      <nav className="space-y-1">
        {subcategories.map((subcategory) => {
          const isActive = subcategory.subcategoryKey === currentSubcategory;
          const href = `/${category}/${subcategory.subcategoryKey}/dashboard/${areaCode}`;

          return (
            <Link
              key={subcategory.subcategoryKey}
              href={href}
              className={`block rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {subcategory.subcategoryName}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

