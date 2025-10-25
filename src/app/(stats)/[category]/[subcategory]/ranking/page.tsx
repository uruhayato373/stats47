import { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { RankingItemsSidebar } from "@/components/molecules/ranking/RankingItemsSidebar";

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params;

  return {
    title: `${subcategory} ランキング - ${category}`,
    description: `${category}の${subcategory}に関する都道府県ランキング`,
  };
}

export default async function RankingPage({ params }: PageProps) {
  const { category, subcategory } = await params;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* メインコンテンツ（左側） */}
      <div className="lg:col-span-2 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-2">
            ランキング一覧
          </h2>
          <p className="text-muted-foreground">
            {category}の{subcategory}に関する都道府県ランキングを表示します
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>ランキング項目を選択</CardTitle>
            <CardDescription>
              右側のサイドバーからランキング項目を選択して、詳細なランキングデータを表示してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                ランキング項目を選択すると、ここにランキングデータが表示されます
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ランキング項目サイドバー（右側） */}
      <div className="lg:col-span-1">
        <RankingItemsSidebar category={category} subcategory={subcategory} />
      </div>
    </div>
  );
}
