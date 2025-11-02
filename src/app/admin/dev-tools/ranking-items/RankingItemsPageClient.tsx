"use client";

import { useState } from "react";

import { Database } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/ui/select";

import { RankingItemsTable } from "@/features/ranking/components/admin/RankingItemsTable";
import { getAllRankingItems } from "@/features/ranking/items/actions";
import type { RankingItem } from "@/features/ranking/items/types";
import { syncR2ToDatabaseAction } from "@/features/ranking/shared/actions/syncR2ToDatabase";
import type { SyncResult } from "@/features/ranking/shared/services/r2-sync-service";

interface RankingItemsPageClientProps {
  initialItems: RankingItem[];
}

export default function RankingItemsPageClient({
  initialItems,
}: RankingItemsPageClientProps) {
  const [items, setItems] = useState<RankingItem[]>(initialItems);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncAreaType, setSyncAreaType] = useState<
    "prefecture" | "city" | "national" | "all"
  >("all");
  const [syncDryRun, setSyncDryRun] = useState(false);

  /**
   * ランキング項目一覧を更新
   */
  const handleRefreshItems = async () => {
    try {
      const refreshedItems = await getAllRankingItems();
      setItems(refreshedItems);
    } catch (error) {
      console.error("ランキング項目の取得に失敗しました", error);
    }
  };

  /**
   * R2→D1同期実行
   */
  const handleSyncR2ToDatabase = async () => {
    setIsSyncing(true);
    try {
      const areaTypeParam = syncAreaType === "all" ? undefined : syncAreaType;
      const result: SyncResult = await syncR2ToDatabaseAction(
        areaTypeParam,
        syncDryRun
      );

      if (result.success) {
        toast.success(result.message);
        // 統計情報を表示
        toast.info(
          `同期結果: スキャン${result.stats.scanned}件、作成${result.stats.created}件、更新${result.stats.updated}件、削除${result.stats.deleted}件、スキップ${result.stats.skipped}件`,
          {
            duration: 5000,
          }
        );
        // エラーがある場合は表示
        if (result.stats.errors.length > 0) {
          toast.error(
            `エラー: ${result.stats.errors.length}件のエラーが発生しました`,
            {
              duration: 5000,
            }
          );
        }
        // データをリフレッシュ（同期後にranking_itemsが更新されている可能性があるため）
        if (!syncDryRun) {
          // ページをリロードしてデータを更新
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      } else {
        toast.error(result.message);
        // エラー詳細を表示
        if (result.stats.errors.length > 0) {
          // 詳細なエラー情報をコンソールに出力
          console.group("🔴 同期エラー詳細");
          console.error("エラー件数:", result.stats.errors.length);
          console.error(
            "エラー詳細:",
            JSON.stringify(result.stats.errors, null, 2)
          );
          result.stats.errors.forEach((err, index) => {
            console.error(`[${index + 1}] ${err.rankingKey}:`, err.error);
          });
          console.groupEnd();

          // エラーごとにtoastを表示
          result.stats.errors.forEach((err, index) => {
            if (index < 5) {
              // 最初の5件のみ表示（多すぎるとUIが埋まるため）
              toast.error(`${err.rankingKey}: ${err.error}`, {
                duration: 5000,
              });
            }
          });
          if (result.stats.errors.length > 5) {
            toast.warning(
              `他${
                result.stats.errors.length - 5
              }件のエラーがあります（コンソールを確認してください）`,
              {
                duration: 5000,
              }
            );
          }
        }
      }
    } catch (error) {
      toast.error("R2→D1同期に失敗しました");
      console.error("同期エラー:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">ランキング項目一覧</h2>
          <p className="text-sm text-muted-foreground mt-1">
            ranking_itemsテーブルのデータを管理します（R2ストレージから同期されます）
          </p>
        </div>
      </div>

      {/* R2→D1同期カード */}
      <Card>
        <CardHeader>
          <CardTitle>R2→D1同期（ranking_items自動生成）</CardTitle>
          <CardDescription>
            R2ストレージのrankingディレクトリを走査し、ranking_itemsテーブルを自動生成・更新します
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">地域タイプ</label>
            <Select
              value={syncAreaType}
              onValueChange={(value) =>
                setSyncAreaType(
                  value as "prefecture" | "city" | "national" | "all"
                )
              }
              disabled={isSyncing}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                <SelectItem value="prefecture">都道府県</SelectItem>
                <SelectItem value="city">市区町村</SelectItem>
                <SelectItem value="national">全国</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="sync-dry-run"
              checked={syncDryRun}
              onChange={(e) => setSyncDryRun(e.target.checked)}
              disabled={isSyncing}
              className="rounded"
            />
            <label htmlFor="sync-dry-run" className="text-sm">
              Dry-run（プレビューのみ、データベースは更新しない）
            </label>
          </div>
          <Button
            onClick={handleSyncR2ToDatabase}
            disabled={isSyncing}
            variant="default"
            className="w-full"
          >
            <Database className="h-4 w-4 mr-2" />
            {isSyncing ? "同期中..." : "同期実行"}
          </Button>
          <p className="text-sm text-muted-foreground">
            注意: R2ストレージ内のranking/
            {syncAreaType === "all" ? "*" : syncAreaType}/
            ディレクトリを走査します
          </p>
        </CardContent>
      </Card>

      {/* テーブル */}
      <RankingItemsTable items={items} onRefresh={handleRefreshItems} />
    </div>
  );
}
