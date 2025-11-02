/**
 * 農林水産業 > 農業世帯 > 都道府県ダッシュボード
 * 都道府県レベルの農業世帯統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  AgriculturalHouseholdCountCard,
  AgriculturalHouseholdTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 農業世帯都道府県ダッシュボード
 */
export async function AgriculturalHouseholdPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 農家数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <AgriculturalHouseholdCountCard
          areaCode={areaCode}
          title="農家数"
        />
      </div>

      {/* 農家数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <AgriculturalHouseholdTrendChart
          areaCode={areaCode}
          title="農家数推移"
          description="年度別の農家数推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}