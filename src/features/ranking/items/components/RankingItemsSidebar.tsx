import { AlertCircle, FolderTree } from "lucide-react";

import { Alert, AlertDescription } from "@/components/atoms/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { RankingGroupCard } from "@/features/ranking/groups/components/RankingGroupCard";
import type { RankingGroup } from "@/features/ranking/groups/types";

import { RankingRepository } from "../../shared/repositories/ranking-repository";

import type { RankingItemsSidebarProps } from "../../shared/types";

/**
 * ランキンググループを表示するサイドバーコンポーネント
 *
 * 利用可能なランキンググループを一覧表示し、
 * クリックでそのグループのアイテムをメインコンテンツに表示します。
 *
 * @param props - コンポーネントのProps
 * @returns ランキンググループサイドバーのJSX要素
 */
export async function RankingItemsSidebar({
  category,
  subcategory,
  className,
}: RankingItemsSidebarProps) {
  let groups: RankingGroup[] = [];
  let error: string | null = null;

  try {
    // データベースからグループを取得（サーバーサイドでDBアクセス）
    console.log(
      `[RankingItemsSidebar] サブカテゴリでグループを取得: ${subcategory}`
    );
    const repository = await RankingRepository.create();
    const config = await repository.getRankingGroupsBySubcategory(subcategory);

    console.log(`[RankingItemsSidebar] 取得結果:`, {
      hasConfig: !!config,
      groupsCount: config?.groups.length || 0,
      groups: config?.groups.map((g) => ({
        key: g.groupKey,
        name: g.name,
        itemsCount: g.items.length,
      })),
    });

    if (config) {
      // グループのみを表示（ungroupedItemsは除外）
      groups = config.groups;
    }
  } catch (err) {
    error =
      err instanceof Error
        ? err.message
        : "ランキンググループの取得に失敗しました";
  }

  // エラー状態の表示
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ランキンググループの読み込みに失敗しました: {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // データが空の場合
  if (groups.length === 0) {
    return (
      <div className={className}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderTree className="h-5 w-5" />
              ランキンググループ
            </CardTitle>
            <CardDescription>
              利用可能なランキンググループを選択してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                ランキンググループが見つかりません
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            ランキンググループ
          </CardTitle>
          <CardDescription>
            利用可能なランキンググループを選択してください
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {groups.map((group) => (
              <RankingGroupCard
                key={group.groupKey}
                group={group}
                category={category}
                subcategory={subcategory}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
