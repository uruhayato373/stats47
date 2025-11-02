import { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/ui/tabs";

import { RankingRepository } from "@/features/ranking/shared/repositories/ranking-repository";
import { RankingItemTabContent } from "@/features/ranking/items/components/RankingItemTabContent";
import type { RankingGroup } from "@/features/ranking/groups/types";

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
  searchParams: Promise<{
    group?: string;
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

export default async function RankingPage({
  params,
  searchParams,
}: PageProps) {
  const { category, subcategory } = await params;
  const { group } = await searchParams;

  // グループが選択されていない場合
  if (!group) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>ランキンググループを選択</CardTitle>
          <CardDescription>
            右側のサイドバーからランキンググループを選択して、詳細なランキングデータを表示してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              ランキンググループを選択すると、ここにランキングデータが表示されます
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 選択されたグループのアイテムを取得
  let selectedGroup: RankingGroup | null = null;
  let error: string | null = null;

  try {
    const repository = await RankingRepository.create();
    const config = await repository.getRankingGroupsBySubcategory(subcategory);

    if (config) {
      selectedGroup = config.groups.find((g) => g.groupKey === group) || null;
    }
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "ランキンググループの取得に失敗しました";
  }

  if (error || !selectedGroup) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>エラー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">
              {error || "選択されたランキンググループが見つかりません"}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // グループにアイテムがない場合
  if (selectedGroup.items.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{selectedGroup.label || selectedGroup.name}</CardTitle>
          <CardDescription>
            このグループにはランキング項目がありません
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">
              ランキング項目が見つかりません
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // デフォルトで最初のアイテムを選択
  const defaultItem = selectedGroup.items[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{selectedGroup.label || selectedGroup.name}</CardTitle>
        <CardDescription>
          タブからランキング項目を選択して、詳細なランキングデータを表示してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultItem.rankingKey} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            {selectedGroup.items.map((item) => (
              <TabsTrigger key={item.rankingKey} value={item.rankingKey}>
                {item.name || item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {selectedGroup.items.map((item) => (
            <TabsContent key={item.rankingKey} value={item.rankingKey}>
              <div className="mt-4">
                <RankingItemTabContent rankingKey={item.rankingKey} />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
