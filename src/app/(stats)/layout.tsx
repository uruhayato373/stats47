import { ReactNode } from "react";

import { StatsBreadcrumb } from "@/components/organisms/layout/StatsBreadcrumb";

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
 * メインコンテンツエリアを配置します。
 *
 * @param children - レイアウト内に表示するコンテンツ
 * @returns 統計データレイアウトのJSX要素
 */
export default function StatsLayout({ children }: StatsLayoutProps) {
  return (
    <main className="lg:ps-60 transition-all duration-300 min-h-screen">
      <div className="h-[calc(100dvh-62px)] lg:h-full overflow-auto flex flex-col bg-background">
        <StatsBreadcrumb />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-4 py-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
