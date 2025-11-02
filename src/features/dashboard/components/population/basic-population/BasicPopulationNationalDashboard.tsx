/**
 * 人口・世帯 > 総人口 > 全国ダッシュボード
 * 全国レベルの総人口統計を表示
 */

import { getNationalBasicPopulationData } from "../../../services/population/basic-population-data";
import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  AgeDistributionChart,
  PopulationTrendChart,
  TotalPopulationCard,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 総人口全国ダッシュボード
 */
export async function BasicPopulationNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  // データ取得
  let data;
  try {
    data = await getNationalBasicPopulationData(areaCode);
  } catch (error) {
    console.error(
      "[BasicPopulationNationalDashboard] データ取得エラー:",
      error
    );
    return (
      <DashboardLayout columns={12} gap="1rem">
        <div className="col-span-12 p-4">
          <p className="text-destructive">
            データの取得に失敗しました。
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  // 年齢別データをAgeDistributionChart用の形式に変換
  const ageGroupData = data.ageGroups.map((group) => ({
    itemCode: group.itemCode,
    itemName: group.itemName,
    data: group.data.map((item) => ({
      timeCode: item.timeCode,
      timeName: item.timeName,
      value: item.value,
      unit: item.unit,
    })),
  }));

  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 総人口統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalPopulationCard data={data.totalPopulation} title="総人口" />
      </div>

      {/* 総人口推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <PopulationTrendChart
          data={data.totalPopulation}
          title="総人口推移"
          description="年度別の総人口推移を表示"
        />
      </div>

      {/* 年齢別人口分布チャート */}
      <div className="col-span-12">
        <AgeDistributionChart
          ageGroups={ageGroupData}
          title="年齢別人口分布"
          description="年齢区分別の人口分布を表示"
        />
      </div>
    </DashboardLayout>
  );
}
