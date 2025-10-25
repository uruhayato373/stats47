"use client";

import { ReactNode } from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ChevronRight } from "lucide-react";

import { listCategories } from "@/features/category";

/**
 * 統計データレイアウトのProps型定義
 */
interface StatsLayoutProps {
  children: ReactNode;
}

/**
 * 統計データページのレイアウトコンポーネント
 *
 * 統計データページ全体のレイアウトを提供し、パンくずナビゲーションと
 * カテゴリ・サブカテゴリの表示を行います。
 *
 * @param children - レイアウト内に表示するコンテンツ
 * @returns 統計データレイアウトのJSX要素
 */
export default function StatsLayout({ children }: StatsLayoutProps) {
  const pathname = usePathname();
  const pathSegments = pathname.split("/").filter(Boolean);

  // URLパスからカテゴリを取得
  const categoryId = pathSegments[0];

  const categories = listCategories();
  const category = categories.find((cat) => cat.id === categoryId);

  return (
    <main className="lg:ps-60 transition-all duration-300 min-h-screen">
      <div className="h-[calc(100dvh-62px)] lg:h-full overflow-auto flex flex-col bg-background">
        {/* サブヘッダー */}
        <div className="sticky top-0 z-10 py-3 px-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          {/* パンくずナビゲーション */}
          <nav className="flex items-center space-x-2 text-xs text-muted-foreground">
            <Link href="/" className="transition-colors hover:text-foreground">
              ホーム
            </Link>
            {category && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-foreground/70">{category.name}</span>
              </>
            )}
          </nav>
        </div>

        {/* メインコンテンツエリア */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </main>
  );
}
