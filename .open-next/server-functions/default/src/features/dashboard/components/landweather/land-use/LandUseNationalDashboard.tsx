/**
 * 国土・気象 > 土地利用 > 全国ダッシュボード
 * 全国レベルの土地利用統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  LandUseZoneStackedBarChart,
  UrbanPlanningAreaCard,
  UrbanPlanningTrendChart,
  UrbanizationZoneCard,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 土地利用全国ダッシュボード
 */
export async function LandUseNationalDashboard({
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
      {/* 都市計画区域指定面積統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <UrbanPlanningAreaCard areaCode={areaCode} title="都市計画区域指定面積" />
      </div>

      {/* 市街化区域面積統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <UrbanizationZoneCard areaCode={areaCode} title="市街化区域面積" />
      </div>

      {/* 都市計画区域面積推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <UrbanPlanningTrendChart
          areaCode={areaCode}
          title="都市計画区域面積推移"
          description="年度別の都市計画区域指定面積推移を表示"
        />
      </div>

      {/* 用途地域内訳スタックバーチャート */}
      <div className="col-span-12 lg:col-span-8">
        <LandUseZoneStackedBarChart
          areaCode={areaCode}
          title="用途地域内訳"
          description="住居専用地域、住居地域、近隣商業地域、商業地域、準工業地域、工業地域、工業専用地域の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}