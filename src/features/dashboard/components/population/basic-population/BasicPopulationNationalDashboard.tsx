/**
 * 人口・世帯 > 総人口 > 全国ダッシュボード
 * 全国レベルの総人口統計を表示
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
 * 総人口全国ダッシュボード
 */
export async function BasicPopulationNationalDashboard({
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
        <GenderRatioDonutChart
          areaCode={areaCode}
          title="総人口男女別割合"
          description="総人口の男女別割合を表示"
        />
      </div>

      {/* 総人口推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <PopulationTrendChart
          areaCode={areaCode}
          title="総人口推移"
          description="年度別の総人口推移を表示"
        />
      </div>

      {/* 年齢区分別人口スタックバーチャート */}
      <div className="col-span-12 lg:col-span-8">
        <AgeGroupStackedBarChart
          areaCode={areaCode}
          title="年齢区分別人口推移"
          description="15歳未満、15～64歳、65歳以上の人口推移を表示"
        />
      </div>

      {/* 年齢別人口分布チャート */}
      <div className="col-span-12">
        <AgeDistributionChart
          areaCode={areaCode}
          title="年齢別人口分布"
          description="年齢区分別の人口分布を表示"
        />
      </div>
    </DashboardLayout>
  );
}
