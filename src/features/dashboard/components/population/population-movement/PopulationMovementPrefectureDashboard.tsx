/**
 * 人口・世帯 > 人口移動 > 都道府県ダッシュボード
 * 都道府県レベルの人口移動統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  MigrationTrendChart,
  MoversInCard,
  MoversOutCard,
  NetMigrationCard,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 人口移動都道府県ダッシュボード
 */
export async function PopulationMovementPrefectureDashboard({
  category,
  subcategory,
  areaCode,
  areaType  
}: DashboardProps) {
  // 未使用のパラメータは型定義の互換性のため必須
  void category;
  void subcategory;
  void areaType;


  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 転入者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <MoversInCard areaCode={areaCode} title="転入者数" />
      </div>

      {/* 転出者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <MoversOutCard areaCode={areaCode} title="転出者数" />
      </div>

      {/* 転入超過数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <NetMigrationCard areaCode={areaCode} title="転入超過数" />
      </div>

      {/* 転入・転出推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <MigrationTrendChart
          areaCode={areaCode}
          title="転入・転出推移"
          description="年度別の転入者数、転出者数、転入超過数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}