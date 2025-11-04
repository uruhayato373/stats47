/**
 * 人口・世帯 > 総人口 > 都道府県ダッシュボード
 * 都道府県レベルの総人口統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  AgeDistributionChart,
  AgeGroupStackedBarChart,
  GenderRatioDonutChart,
  MedianAgeCard,
  PopulationTrendChart,
  TotalPopulationCard,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 総人口都道府県ダッシュボード
 */
export async function BasicPopulationPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 総人口統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalPopulationCard areaCode={areaCode} title="総人口" />
      </div>

      {/* 年齢中位数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <MedianAgeCard areaCode={areaCode} title="年齢中位数" />
      </div>

      {/* 総人口男女別割合ドーナツチャート */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <GenderRatioDonutChart areaCode={areaCode} />
      </div>

      {/* 総人口推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <PopulationTrendChart areaCode={areaCode} />
      </div>

      {/* 年齢区分別人口スタックバーチャート */}
      <div className="col-span-12 lg:col-span-8">
        <AgeGroupStackedBarChart areaCode={areaCode} />
      </div>

      {/* 年齢別人口分布チャート */}
      <div className="col-span-12">
        <AgeDistributionChart areaCode={areaCode} />
      </div>
    </DashboardLayout>
  );
}
