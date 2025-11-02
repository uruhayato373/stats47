import { notFound } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/ui/tabs";

import { auth } from "@/features/auth/lib/auth";
import {
  RankingDataTable,
  RankingMapCard,
  getRankingGroupByKey,
  getRankingItem,
} from "@/features/ranking";
import { getRankingData } from "@/features/ranking/items/actions/getRankingData";
import { getRankingMetadata } from "@/features/ranking/items/actions/getRankingMetadata";
import {
  RankingItemTabContent,
  RankingYearSelector,
} from "@/features/ranking/items/components";
import { EditRankingItemButton } from "@/features/ranking/items/components/admin/EditRankingItemButton";

/**
 * ランキング詳細ページのProps型定義
 */
interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    rankingKey: string;
  }>;
  searchParams: Promise<{
    year?: string;
  }>;
}

/**
 * ランキング詳細ページのメインコンポーネント
 */
export default async function RankingKeyPage({
  params,
  searchParams,
}: PageProps) {
  const { rankingKey } = await params;
  const { year } = await searchParams;

  // 認証チェック（管理者権限）
  const session = await auth();
  // 開発環境では自動的に管理者として扱う
  const isAdmin =
    process.env.NODE_ENV === "development" ||
    session?.user?.role === "admin";

  // サーバーサイドでランキングアイテムを取得
  const rankingItem = await getRankingItem(rankingKey);

  if (!rankingItem) {
    notFound();
  }

  // R2からmetadata.jsonを取得
  const metadata = await getRankingMetadata(rankingItem.areaType, rankingKey);

  // 年度情報を降順ソートして最新年度を特定（デフォルト値として使用）
  const latestTimeCode =
    metadata?.times && metadata.times.length > 0
      ? [...metadata.times].sort((a, b) => {
          const timeCodeA = parseInt(a.timeCode, 10);
          const timeCodeB = parseInt(b.timeCode, 10);
          return timeCodeB - timeCodeA;
        })[0]?.timeCode
      : undefined;

  // クエリパラメータから年度を取得（存在する場合）、なければ最新年度を使用
  const selectedYear = year || latestTimeCode;

  // グループがない場合は単一アイテムとして表示
  if (!rankingItem.groupKey) {
    // R2からmetadata.jsonを取得（単一アイテム表示用）
    const metadataForSingle =
      metadata || (await getRankingMetadata(rankingItem.areaType, rankingKey));

    const latestTimeCodeForSingle =
      metadataForSingle?.times && metadataForSingle.times.length > 0
        ? [...metadataForSingle.times].sort((a, b) => {
            const timeCodeA = parseInt(a.timeCode, 10);
            const timeCodeB = parseInt(b.timeCode, 10);
            return timeCodeB - timeCodeA;
          })[0]?.timeCode
        : undefined;

    // クエリパラメータから年度を取得（存在する場合）、なければ最新年度を使用
    const selectedYearForSingle = year || latestTimeCodeForSingle;

    // 年度が指定されている場合はランキングデータを取得
    const rankingDataForSingle = selectedYearForSingle
      ? await getRankingData(
          rankingItem.areaType,
          rankingKey,
          selectedYearForSingle
        )
      : null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>
                {metadataForSingle?.itemName ||
                  rankingItem.name ||
                  rankingItem.label}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <EditRankingItemButton
                  isAdmin={isAdmin}
                  rankingItem={rankingItem}
                />
              )}
              {metadataForSingle &&
                metadataForSingle.times &&
                metadataForSingle.times.length > 0 && (
                  <RankingYearSelector
                    times={metadataForSingle.times}
                    defaultValue={selectedYearForSingle}
                  />
                )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <RankingMapCard
            colorScheme={rankingItem.mapColorScheme}
            divergingMidpoint={rankingItem.mapDivergingMidpoint}
            data={rankingDataForSingle || undefined}
          />
          {rankingDataForSingle && rankingDataForSingle.length > 0 && (
            <RankingDataTable
              data={rankingDataForSingle}
              rankingItem={rankingItem}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // グループ内のアイテムを取得
  const group = await getRankingGroupByKey(rankingItem.groupKey);

  // グループがない、またはアイテムが1つ以下の場合は単一アイテムとして表示
  if (!group || group.items.length <= 1) {
    // 年度が指定されている場合はランキングデータを取得
    const rankingDataForSingle = selectedYear
      ? await getRankingData(rankingItem.areaType, rankingKey, selectedYear)
      : null;

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle>
                {metadata?.itemName || rankingItem.name || rankingItem.label}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <EditRankingItemButton
                  isAdmin={isAdmin}
                  rankingItem={rankingItem}
                />
              )}
              {metadata && metadata.times && metadata.times.length > 0 && (
                <RankingYearSelector
                  times={metadata.times}
                  defaultValue={selectedYear}
                />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <RankingMapCard
            colorScheme={rankingItem.mapColorScheme}
            divergingMidpoint={rankingItem.mapDivergingMidpoint}
            data={rankingDataForSingle || undefined}
          />
          {rankingDataForSingle && rankingDataForSingle.length > 0 && (
            <RankingDataTable
              data={rankingDataForSingle}
              rankingItem={rankingItem}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // グループ内のアイテムをタブで表示
  // display_order_in_groupでソート
  const sortedItems = [...group.items].sort(
    (a, b) => a.displayOrderInGroup - b.displayOrderInGroup
  );

  // 現在のrankingKeyに基づいてデフォルトタブを設定
  const currentItem = sortedItems.find(
    (item) => item.rankingKey === rankingKey
  );
  const defaultItem = currentItem || sortedItems[0];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle>
              {metadata?.itemName || group.label || group.name}
            </CardTitle>
            <CardDescription>
              タブからランキング項目を選択して、詳細なランキングデータを表示してください
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <EditRankingItemButton
                isAdmin={isAdmin}
                rankingItem={rankingItem}
              />
            )}
            {metadata && metadata.times && metadata.times.length > 0 && (
              <RankingYearSelector
                times={metadata.times}
                defaultValue={selectedYear}
              />
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={defaultItem.rankingKey} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            {sortedItems.map((item) => (
              <TabsTrigger key={item.rankingKey} value={item.rankingKey}>
                {item.name || item.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {sortedItems.map((item) => (
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
