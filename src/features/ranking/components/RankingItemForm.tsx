"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/atoms/ui/tabs";

import { BasicInfoForm } from "./forms/BasicInfoForm";
import { CategorySettingsForm } from "./forms/CategorySettingsForm";
import { DangerZone } from "./forms/DangerZone";
import { DataSourceMetadataForm } from "./forms/DataSourceMetadataForm";
import { VisualizationForm } from "./forms/VisualizationForm";

interface RankingItem {
  id: number;
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
}

export function RankingItemForm({ item, mode }: RankingItemFormProps) {
  return (
    <Tabs defaultValue="basic" className="w-full">
      <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="basic">基本情報</TabsTrigger>
        <TabsTrigger value="datasource">データソース</TabsTrigger>
        <TabsTrigger value="categories">カテゴリ</TabsTrigger>
        <TabsTrigger value="visualization">可視化</TabsTrigger>
        {mode === "edit" && <TabsTrigger value="danger">危険な操作</TabsTrigger>}
      </TabsList>

      <TabsContent value="basic" className="mt-6">
        <BasicInfoForm item={item} mode={mode} />
      </TabsContent>

      <TabsContent value="datasource" className="mt-6">
        <DataSourceMetadataForm item={item} />
      </TabsContent>

      <TabsContent value="categories" className="mt-6">
        <CategorySettingsForm item={item} />
      </TabsContent>

      <TabsContent value="visualization" className="mt-6">
        <VisualizationForm item={item} />
      </TabsContent>

      {mode === "edit" && item && (
        <TabsContent value="danger" className="mt-6">
          <DangerZone itemId={item.id} />
        </TabsContent>
      )}
    </Tabs>
  );
}

