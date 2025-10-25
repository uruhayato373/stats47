import { RankingItemsSidebar } from "@/features/ranking";

/**
 * RankingレイアウトのProps型定義
 */
interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

/**
 * Ranking共通レイアウト
 *
 * ranking配下のすべてのページで共通のランキング項目サイドバーを表示します。
 * 2カラムレイアウトでメインコンテンツとサイドバーを配置します。
 *
 * @param props - レイアウトのProps
 * @returns RankingレイアウトのJSX要素
 */
export default async function RankingLayout({ children, params }: LayoutProps) {
  const { category, subcategory } = await params;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-screen">
      {/* メインコンテンツ（左側） */}
      <div className="lg:col-span-2 overflow-hidden">{children}</div>

      {/* ランキング項目サイドバー（右側） */}
      <div className="lg:col-span-1">
        <RankingItemsSidebar category={category} subcategory={subcategory} />
      </div>
    </div>
  );
}
