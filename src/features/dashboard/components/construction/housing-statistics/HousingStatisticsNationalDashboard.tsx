/**
 * 住宅・土地・建設 > 住宅統計 > 全国ダッシュボード
 * 全国レベルの住宅統計統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  TotalHousingUnitsCard,
  OwnerOccupiedHousingCard,
  VacantHousingUnitsCard,
  TotalHousingUnitsTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 住宅統計全国ダッシュボード
 */
export async function HousingStatisticsNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 総住宅数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalHousingUnitsCard
          areaCode={areaCode}
          title="総住宅数"
        />
      </div>

      {/* 持ち家数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <OwnerOccupiedHousingCard
          areaCode={areaCode}
          title="持ち家数"
        />
      </div>

      {/* 空き家数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <VacantHousingUnitsCard
          areaCode={areaCode}
          title="空き家数"
        />
      </div>

      {/* 総住宅数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <TotalHousingUnitsTrendChart
          areaCode={areaCode}
          title="総住宅数推移"
          description="年度別の総住宅数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}