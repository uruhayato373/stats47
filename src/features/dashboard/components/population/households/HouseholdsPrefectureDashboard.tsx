/**
 * 人口・世帯 > 世帯 > 都道府県ダッシュボード
 * 都道府県レベルの世帯統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  AverageHouseholdMembersCard,
  HouseholdCompositionStackedBarChart,
  HouseholdCountCard,
  HouseholdTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 世帯都道府県ダッシュボード
 */
export async function HouseholdsPrefectureDashboard({
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
      {/* 世帯数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <HouseholdCountCard areaCode={areaCode} title="世帯数" />
      </div>

      {/* 一般世帯平均人員数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <AverageHouseholdMembersCard areaCode={areaCode} title="一般世帯平均人員数" />
      </div>

      {/* 世帯構成スタックバーチャート */}
      <div className="col-span-12 lg:col-span-8">
        <HouseholdCompositionStackedBarChart
          areaCode={areaCode}
          title="世帯構成"
          description="単独世帯、核家族世帯、核家族以外の世帯、その他の内訳を表示"
        />
      </div>

      {/* 世帯数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <HouseholdTrendChart
          areaCode={areaCode}
          title="世帯数推移"
          description="年度別の世帯数推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}