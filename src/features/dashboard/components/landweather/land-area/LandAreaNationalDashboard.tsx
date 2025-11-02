/**
 * 国土・気象 > 土地面積 > 全国ダッシュボード
 * 全国レベルの土地面積統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  AssessedLandAreaStackedBarChart,
  ForestRatioDonutChart,
  HabitableAreaCard,
  TotalAreaCard,
  TotalAreaTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 土地面積全国ダッシュボード
 */
export async function LandAreaNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}: DashboardProps) {
  // 未使用のパラメータは型定義の互換性のため必須
  void category;
  void subcategory;
  void areaType;
  void areaLevel;
  
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 総面積統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalAreaCard areaCode={areaCode} title="総面積" />
      </div>

      {/* 可住地面積統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <HabitableAreaCard areaCode={areaCode} title="可住地面積" />
      </div>

      {/* 林野・森林面積割合ドーナツチャート */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ForestRatioDonutChart
          areaCode={areaCode}
          title="林野面積内訳"
          description="森林面積とその他の林野面積の割合を表示"
        />
      </div>

      {/* 総面積推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <TotalAreaTrendChart
          areaCode={areaCode}
          title="総面積推移"
          description="年度別の総面積推移を表示"
        />
      </div>

      {/* 評価総地積内訳スタックバーチャート */}
      <div className="col-span-12 lg:col-span-8">
        <AssessedLandAreaStackedBarChart
          areaCode={areaCode}
          title="評価総地積内訳"
          description="田、畑、宅地、山林、牧場、原野、その他の評価総地積推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}

