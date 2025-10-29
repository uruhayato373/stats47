"use client";

import { useRef, useState } from "react";

import { useRouter } from "next/navigation";

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

import { BasicInfoForm, type BasicInfoFormRef } from "./forms/BasicInfoForm";
import { CategorySettingsForm, type CategorySettingsFormRef } from "./forms/CategorySettingsForm";
import { DangerZone } from "./forms/DangerZone";
import { DataSourceMetadataForm, type DataSourceMetadataFormRef } from "./forms/DataSourceMetadataForm";
import { VisualizationForm, type VisualizationFormRef } from "./forms/VisualizationForm";

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
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const basicInfoFormRef = useRef<BasicInfoFormRef>(null);
  const categorySettingsFormRef = useRef<CategorySettingsFormRef>(null);
  const visualizationFormRef = useRef<VisualizationFormRef>(null);
  const dataSourceMetadataFormRef = useRef<DataSourceMetadataFormRef>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      // 各フォームから値を取得
      const basicInfoValues = basicInfoFormRef.current?.getValues() || {} as any;
      const categorySettingsValues = categorySettingsFormRef.current?.getValues() || {} as any;
      const visualizationValues = visualizationFormRef.current?.getValues() || {} as any;
      const metadataValues = dataSourceMetadataFormRef.current?.getValues() || { metadataItems: [] };

      // バリデーション
      const hasRequiredFields = basicInfoValues.rankingKey && basicInfoValues.label && basicInfoValues.name && basicInfoValues.unit;
      if (!hasRequiredFields) {
        alert("必須項目を入力してください");
        setIsSubmitting(false);
        return;
      }

      // 統合データを構築
      const payload = {
        ...basicInfoValues,
        ...categorySettingsValues,
        ...visualizationValues,
        dataSourceId: "estat", // デフォルト値
        ...metadataValues,
      };

      // APIに送信
      const url = mode === "create" 
        ? "/api/admin/ranking-items"
        : `/api/admin/ranking-items/${rankingKey}`;
      
      const method = mode === "create" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json() as { error?: string };
        throw new Error(error?.error || "Failed to save");
      }

      alert(mode === "create" ? "項目を作成しました" : "項目を更新しました");

      // 管理画面に戻る
      router.push("/admin/ranking-items");
    } catch (error) {
      console.error("Error saving ranking item:", error);
      alert(`保存に失敗しました: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsSubmitting(false);
    }
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
          <BasicInfoForm ref={basicInfoFormRef} item={item} mode={mode} />
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
          <CategorySettingsForm ref={categorySettingsFormRef} item={item} />
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
          <DataSourceMetadataForm ref={dataSourceMetadataFormRef} item={item as any} />
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
          <VisualizationForm ref={visualizationFormRef} item={item} />
        </CardContent>
      </Card>

      {/* 統合保存ボタン */}
      <div className="sticky bottom-0 bg-background py-4 border-t flex justify-end gap-2">
        <Button type="button" variant="outline" disabled={isSubmitting}>
          キャンセル
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : mode === "create" ? "作成" : "保存"}
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

