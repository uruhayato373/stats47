"use client";

import { useMemo, useState, useTransition } from "react";

import { AlertTriangle, Download, List, RefreshCw, Zap, FileJson } from "lucide-react";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/atoms/ui/tabs";

import { EstatRankingMappingsTable } from "@/features/estat-api/ranking-mappings/components/EstatRankingMappingsTable";
import {
  convertAllRankingsAction,
  exportRankingMappingsToCsvAction,
  generateMetadataForAllRankingsAction,
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
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false);

  // 重複しているitem_codeを検出
  const duplicateItemCodes = useMemo(() => {
    const itemCodeCounts = new Map<string, number>();
    mappings.forEach((m) => {
      const count = itemCodeCounts.get(m.item_code) || 0;
      itemCodeCounts.set(m.item_code, count + 1);
    });
    return Array.from(itemCodeCounts.entries())
      .filter(([_, count]) => count > 1)
      .map(([code]) => code);
  }, [mappings]);

  // 重複レコードのみをフィルタリングし、item_codeでソート
  const duplicateMappings = useMemo(() => {
    return mappings
      .filter((m) => duplicateItemCodes.includes(m.item_code))
      .sort((a, b) => a.item_code.localeCompare(b.item_code));
  }, [mappings, duplicateItemCodes]);

  /**
   * データをリフレッシュ
   * @param showToast - toastを表示するかどうか（デフォルト: true）
   */
  const handleRefresh = (showToast = true) => {
    startTransition(async () => {
      try {
        const newMappings = await listRankingMappingsAction({
          limit: 10000,
        });
        setMappings(newMappings);
        if (showToast) {
          toast.success("データを更新しました");
        }
      } catch (error) {
        toast.error("データの取得に失敗しました");
      }
    });
  };

  /**
   * CSVエクスポート
   */
  const handleExportCsv = async () => {
    try {
      toast.info("CSVファイルを生成中...");
      const result = await exportRankingMappingsToCsvAction();

      if (!result.success || !result.csv) {
        toast.error(result.message || "CSVエクスポートに失敗しました");
        return;
      }

      // CSVファイルをダウンロード
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `estat_ranking_mappings_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("CSVファイルをダウンロードしました");
    } catch (error) {
      console.error("CSVエクスポートエラー:", error);
      toast.error("CSVエクスポートに失敗しました");
    }
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

  /**
   * メタデータ一括生成実行
   */
  const handleGenerateMetadata = async () => {
    setIsGeneratingMetadata(true);
    try {
      toast.info("メタデータを生成中...");
      const result = await generateMetadataForAllRankingsAction();
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
      // 結果の詳細を表示
      if (result.errorCount > 0) {
        toast.warning(
          `メタデータ生成結果: 成功${result.generatedCount}件、失敗${result.errorCount}件`,
          {
            duration: 5000,
          }
        );
      }
    } catch (error) {
      toast.error("メタデータ一括生成に失敗しました");
    } finally {
      setIsGeneratingMetadata(false);
    }
  };


  return (
    <div className="w-full px-4 py-6 space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            CSVエクスポート
          </CardTitle>
          <CardDescription>
            estat_ranking_mappingsテーブルのデータをCSVファイルとしてダウンロードします。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExportCsv} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            CSV保存
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileJson className="h-5 w-5" />
            メタデータ一括生成
          </CardTitle>
          <CardDescription>
            既存のランキングデータに対してmetadata.jsonファイルを一括生成します。
            R2に保存されているすべてのランキングキーに対してメタデータファイルを作成します。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleGenerateMetadata}
            disabled={isGeneratingMetadata}
            variant="outline"
            className="w-full"
          >
            <FileJson className="mr-2 h-4 w-4" />
            {isGeneratingMetadata ? "生成中..." : "メタデータ生成実行"}
          </Button>
          <p className="text-sm text-muted-foreground mt-2">
            注意: 大量のデータに対して処理するため、時間がかかる場合があります
          </p>
        </CardContent>
      </Card>

      {/* テーブル */}
      <Card>
        <CardHeader>
          <CardTitle>ランキングマッピング一覧</CardTitle>
          <CardDescription>
            {mappings.length}件のマッピングが登録されています
            {duplicateItemCodes.length > 0 && (
              <span className="ml-2 text-destructive">
                （重複item_code: {duplicateItemCodes.length}件）
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="normal" className="w-full">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="normal" className="gap-2">
                <List className="h-4 w-4" />
                通常表示
              </TabsTrigger>
              <TabsTrigger value="duplicates" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                重複表示
                {duplicateItemCodes.length > 0 && (
                  <span className="ml-1 rounded-full bg-destructive px-2 py-0.5 text-xs text-destructive-foreground">
                    {duplicateItemCodes.length}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="normal" className="mt-4">
              <EstatRankingMappingsTable
                mappings={mappings}
                onRefresh={handleRefresh}
              />
            </TabsContent>

            <TabsContent value="duplicates" className="mt-4">
              {duplicateMappings.length > 0 ? (
                <EstatRankingMappingsTable
                  mappings={duplicateMappings}
                  onRefresh={handleRefresh}
                />
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  重複しているitem_codeはありません
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

