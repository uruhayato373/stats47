/**
 * 住宅・土地・建設 > 住宅構造 > 全国ダッシュボード
 * 全国レベルの住宅構造統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  DetachedHousesCard,
  ApartmentBuildingsCard,
  RowHousesCard,
  HousingStructureStackedBarChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 住宅構造全国ダッシュボード
 */
export async function HousingStructureNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 一戸建住宅数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <DetachedHousesCard
          areaCode={areaCode}
          title="一戸建住宅数"
        />
      </div>

      {/* 共同住宅数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ApartmentBuildingsCard
          areaCode={areaCode}
          title="共同住宅数"
        />
      </div>

      {/* 長屋建住宅数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <RowHousesCard
          areaCode={areaCode}
          title="長屋建住宅数"
        />
      </div>

      {/* 住宅構造スタックバーチャート */}
      <div className="col-span-12 lg:col-span-8">
        <HousingStructureStackedBarChart
          areaCode={areaCode}
          title="住宅構造推移"
          description="年度別の一戸建、長屋建、共同住宅の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}