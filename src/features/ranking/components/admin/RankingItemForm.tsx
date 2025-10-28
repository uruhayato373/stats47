"use client";

import { Button } from "@/components/atoms/ui/button";
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
    <form onSubmit={handleSubmit} className="w-full space-y-4">
      {/* 基本情報 */}
      <section>
        <BasicInfoForm item={item} mode={mode} />
      </section>


      {/* データソース設定 */}
      <section>
        <DataSourceMetadataForm item={item} />
      </section>


      {/* カテゴリ設定 */}
      <section>
        <CategorySettingsForm item={item} />
      </section>


      {/* 可視化設定 */}
      <section>
        <VisualizationForm item={item} />
      </section>

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
          <section>
            <DangerZone rankingKey={rankingKey} />
          </section>
        </>
      )}
    </form>
  );
}

