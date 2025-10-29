"use client";

import {
  AlertTriangle,
  BarChart3,
  Database,
  FileText,
  FolderTree,
} from "lucide-react";

import { Button } from "@/components/atoms/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";
import { Separator } from "@/components/atoms/ui/separator";

import { BasicInfoForm } from "./forms/BasicInfoForm";
import { CategorySettingsForm } from "./forms/CategorySettingsForm";
import { DangerZone } from "./forms/DangerZone";
import { DataSourceMetadataForm } from "./forms/DataSourceMetadataForm";
import { VisualizationForm } from "./forms/VisualizationForm";

interface RankingItem {
  rankingKey: string;
  label: string;
  name: string;
  description?: string;
  unit: string;
  dataSourceId: string;
  isActive: boolean;
}

interface RankingItemFormProps {
  item?: RankingItem;
  mode: "create" | "edit";
  rankingKey?: string;
}

export function RankingItemForm({ item, mode, rankingKey }: RankingItemFormProps) {
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: 全フォームデータを統合して保存
    console.log("統合保存処理");
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-6">
      {/* 基本情報 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            基本情報
          </CardTitle>
          <CardDescription>
            ランキング項目の基本設定を行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BasicInfoForm item={item} mode={mode} />
        </CardContent>
      </Card>

            {/* カテゴリ設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            カテゴリ設定
          </CardTitle>
          <CardDescription>
            グループと表示順の設定を行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CategorySettingsForm item={item} />
        </CardContent>
      </Card>

      {/* データソース設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            データソース設定
          </CardTitle>
          <CardDescription>
            メタデータとデータ取得元の設定を行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataSourceMetadataForm item={item} />
        </CardContent>
      </Card>



      {/* 可視化設定 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            可視化設定
          </CardTitle>
          <CardDescription>
            マップ表示とランキング方向の設定を行います
          </CardDescription>
        </CardHeader>
        <CardContent>
          <VisualizationForm item={item} />
        </CardContent>
      </Card>

      {/* 統合保存ボタン */}
      <div className="sticky bottom-0 bg-background py-4 border-t flex justify-end gap-2">
        <Button type="button" variant="outline">
          キャンセル
        </Button>
        <Button type="submit">
          {mode === "create" ? "作成" : "保存"}
        </Button>
      </div>

      {/* 危険な操作（編集時のみ） */}
      {mode === "edit" && rankingKey && (
        <>
          <Separator />
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                危険な操作
              </CardTitle>
              <CardDescription>
                項目の削除など、元に戻せない操作を行います
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DangerZone rankingKey={rankingKey} />
            </CardContent>
          </Card>
        </>
      )}
    </form>
  );
}

