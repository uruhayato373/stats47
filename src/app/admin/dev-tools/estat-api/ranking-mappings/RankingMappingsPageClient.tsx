"use client";

import { useState, useTransition } from "react";

import { RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { EstatRankingMappingsTable } from "@/features/estat-api/ranking-mappings/components/EstatRankingMappingsTable";
import {
  convertAllRankingsAction,
  listRankingMappingsAction,
} from "@/features/estat-api/ranking-mappings/actions";

import type { EstatRankingMapping } from "@/features/estat-api/ranking-mappings/types";

interface RankingMappingsPageClientProps {
  initialMappings: EstatRankingMapping[];
}

export default function RankingMappingsPageClient({
  initialMappings,
}: RankingMappingsPageClientProps) {
  const [mappings, setMappings] = useState<EstatRankingMapping[]>(
    initialMappings
  );
  const [isPending, startTransition] = useTransition();
  const [isConvertingAll, setIsConvertingAll] = useState(false);

  /**
   * データをリフレッシュ
   */
  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const newMappings = await listRankingMappingsAction({
          limit: 10000,
        });
        setMappings(newMappings);
        toast.success("データを更新しました");
      } catch (error) {
        toast.error("データの取得に失敗しました");
      }
    });
  };

  /**
   * 全ランキング変換実行
   */
  const handleConvertAll = async () => {
    setIsConvertingAll(true);
    try {
      const result = await convertAllRankingsAction();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      // 結果の詳細を表示
      if (result.results.length > 0) {
        const successCount = result.results.filter((r) => r.success).length;
        const failureCount = result.results.filter((r) => !r.success).length;
        toast.info(
          `変換結果: 成功${successCount}件、失敗${failureCount}件`,
          {
            duration: 5000,
          }
        );
      }
    } catch (error) {
      toast.error("全ランキング変換に失敗しました");
    } finally {
      setIsConvertingAll(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">e-Statランキングマッピング管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            e-Statパラメータとランキング項目のマッピングを管理します
          </p>
        </div>
        <Button onClick={handleRefresh} disabled={isPending} variant="outline">
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isPending ? "animate-spin" : ""}`}
          />
          更新
        </Button>
      </div>

      {/* アクションカード */}
      <Card>
        <CardHeader>
          <CardTitle>一括ランキング変換</CardTitle>
          <CardDescription>
            isRanking=trueの全項目をランキング形式に変換してR2に保存します
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleConvertAll}
            disabled={isConvertingAll}
            variant="destructive"
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isConvertingAll ? "変換中..." : "全項目を変換実行"}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            注意: 大量のデータを変換するため、時間がかかる場合があります
          </p>
        </CardContent>
      </Card>

      {/* テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>ランキングマッピング一覧</CardTitle>
          <CardDescription>
            {mappings.length}件のマッピングが登録されています
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EstatRankingMappingsTable
            mappings={mappings}
            onRefresh={handleRefresh}
          />
        </CardContent>
      </Card>
    </div>
  );
}

