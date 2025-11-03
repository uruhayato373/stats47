"use client";

import { useMemo, useState, useTransition } from "react";

import { AlertTriangle, Download, List, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { Label } from "@/components/atoms/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/ui/radio-group";
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
  const [mode, setMode] = useState<"delete_all" | "skip_existing">("delete_all");

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
      const result = await convertAllRankingsAction(undefined, mode);
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
    <div className="w-full px-4 py-6 space-y-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">e-Statランキングマッピング管理</h1>
          <p className="text-sm text-muted-foreground mt-1">
            e-Statパラメータとランキング項目のマッピングを管理します
          </p>
        </div>
        <Button onClick={() => handleRefresh()} disabled={isPending} variant="outline">
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
            isRanking=trueの全項目をランキング形式に変換してR2に保存します。
            メタデータファイル（metadata.json）も自動的に生成されます。
            is_ranking=falseのデータに対応するR2データは自動的に削除されます。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-medium">処理モード</Label>
            <RadioGroup
              value={mode}
              onValueChange={(value) =>
                setMode(value as "delete_all" | "skip_existing")
              }
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="delete_all" id="mode-delete-all" />
                <Label
                  htmlFor="mode-delete-all"
                  className="text-sm font-normal cursor-pointer"
                >
                  全削除してから保存
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="skip_existing" id="mode-skip-existing" />
                <Label
                  htmlFor="mode-skip-existing"
                  className="text-sm font-normal cursor-pointer"
                >
                  新規のみ追加
                </Label>
              </div>
            </RadioGroup>
            <p className="text-xs text-muted-foreground">
              {mode === "delete_all"
                ? "R2ストレージの全データを削除してから、全ての項目を保存します。"
                : "既存のデータはスキップして、新規のデータのみ追加します。"}
            </p>
          </div>
          <Button
            onClick={handleConvertAll}
            disabled={isConvertingAll}
            variant="destructive"
            className="w-full"
          >
            <Zap className="h-4 w-4 mr-2" />
            {isConvertingAll ? "変換中..." : "全項目を変換実行"}
          </Button>
          <p className="text-sm text-muted-foreground">
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

