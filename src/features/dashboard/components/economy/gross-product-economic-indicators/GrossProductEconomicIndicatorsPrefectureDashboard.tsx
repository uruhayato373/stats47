/**
 * 企業・家計・経済 > 総生産・経済指標 > 都道府県ダッシュボード
 * 都道府県レベルの総生産・経済指標統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  GrossPrefecturalProductCard,
  GrossPrefecturalProductSecondaryCard,
  GrossPrefecturalProductTertiaryCard,
  GrossPrefecturalProductTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 総生産・経済指標都道府県ダッシュボード
 */
export async function GrossProductEconomicIndicatorsPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 県内総生産額統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <GrossPrefecturalProductCard
          areaCode={areaCode}
          title="県内総生産額"
        />
      </div>

      {/* 県内総生産額（第2次産業）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <GrossPrefecturalProductSecondaryCard
          areaCode={areaCode}
          title="県内総生産額（第2次産業）"
        />
      </div>

      {/* 県内総生産額（第3次産業）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <GrossPrefecturalProductTertiaryCard
          areaCode={areaCode}
          title="県内総生産額（第3次産業）"
        />
      </div>

      {/* 県内総生産額推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <GrossPrefecturalProductTrendChart
          areaCode={areaCode}
          title="県内総生産額推移"
          description="年度別の県内総生産額の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}