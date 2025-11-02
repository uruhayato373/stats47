"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

import { ChevronRight } from "lucide-react";

import { listCategoriesAction } from "@/features/category/actions";
import type { Category } from "@/features/category/types/category.types";

import { BreadcrumbAreaDropdown } from "./BreadcrumbAreaDropdown";

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
  const [categories, setCategories] = useState<Category[]>([]);

  // URLパスからカテゴリ、サブカテゴリ、ページタイプ、地域コードを取得
  const categoryId = pathSegments[0];
  const subcategoryId = pathSegments[1];
  const pageType = pathSegments[2];
  const areaCode = pathSegments[3];

  // カテゴリ一覧を取得
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesData = await listCategoriesAction();
        setCategories(categoriesData);
      } catch (error) {
        console.error("カテゴリ取得エラー:", error);
      }
    };

    fetchCategories();
  }, []);

  const category = categories.find((cat) => cat.categoryKey === categoryId);
  const subcategory = category?.subcategories?.find(
    (sub) => sub.subcategoryKey === subcategoryId
  );

  // ページタイプの表示名マッピング
  const pageTypeNames: Record<string, string> = {
    area: "地域別",
    dashboard: "ダッシュボード",
    ranking: "ランキング",
  };

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
              href={`/${category.categoryKey}`}
              className="transition-colors hover:text-foreground"
            >
              {category.categoryName}
            </Link>
          </>
        )}
        {subcategory && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/${category?.categoryKey}/${subcategory.subcategoryKey}`}
              className="transition-colors hover:text-foreground"
            >
              {subcategory.subcategoryName}
            </Link>
          </>
        )}
        {pageType && pageTypeNames[pageType] && (
          <>
            <ChevronRight className="w-3 h-3" />
            <Link
              href={`/${categoryId}/${subcategoryId}/${pageType}`}
              className="transition-colors hover:text-foreground"
            >
              {pageTypeNames[pageType]}
            </Link>
          </>
        )}
        {areaCode && (
          <>
            <ChevronRight className="w-3 h-3" />
            <BreadcrumbAreaDropdown
              areaCode={areaCode}
              categoryId={categoryId}
              subcategoryId={subcategoryId}
              pageType={pageType}
            />
          </>
        )}
      </nav>
    </div>
  );
};
