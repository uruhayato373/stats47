"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight } from "lucide-react";

import { listCategories } from "@/features/category";

/**
 * 統計データページのパンくずナビゲーションコンポーネント
 *
 * URLパスから自動的にカテゴリとサブカテゴリを取得し、
 * パンくずリストを表示します。スティッキーヘッダーとして動作し、
 * ブラー効果を持ちます。
 *
 * @returns パンくずナビゲーションのJSX要素
 */
export const StatsBreadcrumb = () => {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  // URLパスからカテゴリとサブカテゴリを取得
  const categoryId = pathSegments[0];
  const subcategoryId = pathSegments[1];

  const categories = listCategories();
  const category = categories.find((cat) => cat.id === categoryId);
  const subcategory = category?.subcategories?.find(
    (sub) => sub.id === subcategoryId
  );

  return (
    <div className="sticky top-0 z-10 py-3 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* パンくずナビゲーション */}
      <nav className="flex items-center space-x-2 text-xs text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">
          ホーム
        </Link>
        {category && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/${category.id}`}
              className="transition-colors hover:text-foreground"
            >
              {category.name}
            </Link>
          </>
        )}
        {subcategory && (
          <>
            <ChevronRight className="w-3 h-3" />
            <span className="text-foreground/70">{subcategory.name}</span>
          </>
        )}
      </nav>
    </div>
  );
};
