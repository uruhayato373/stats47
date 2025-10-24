"use client";

import { listCategories } from "@/features/category";
import { getCategoryIcon } from "@/lib/utils/get-category-icon";
import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface StatsLayoutProps {
  children: ReactNode;
}

export default function StatsLayout({ children }: StatsLayoutProps) {
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
    <main className="lg:ps-60 transition-all duration-300 pt-13 min-h-screen">
      <div className="h-[calc(100dvh-62px)] lg:h-full overflow-auto flex flex-col bg-white dark:bg-neutral-800">
        {/* サブヘッダー */}
        <div className="py-3 px-4 bg-white border-b border-gray-200 dark:bg-neutral-800 dark:border-neutral-700">
          <div className="flex items-center gap-4">
            {/* カテゴリアイコン */}
            {category && (
              <div className="flex-shrink-0">
                {(() => {
                  const Icon = getCategoryIcon(category.icon);
                  return <Icon className="w-6 h-6 text-indigo-600" />;
                })()}
              </div>
            )}

            <div className="flex-1">
              {/* パンくずナビゲーション */}
              <nav className="flex items-center space-x-2 text-xs text-gray-500 dark:text-neutral-400 mb-1">
                <Link
                  href="/"
                  className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-neutral-300"
                >
                  <Home className="w-3 h-3" />
                  <span>ホーム</span>
                </Link>
                <ChevronRight className="w-3 h-3" />
                <span>統計データ</span>
                {category && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-700 dark:text-neutral-300">
                      {category.name}
                    </span>
                  </>
                )}
                {subcategory && (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-gray-900 dark:text-white font-medium">
                      {subcategory.name}
                    </span>
                  </>
                )}
              </nav>

              {/* タイトル */}
              <h1 className="text-lg font-medium text-gray-900 dark:text-white">
                {subcategory?.name || category?.name || "統計データ"}
              </h1>
            </div>
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>
    </main>
  );
}
