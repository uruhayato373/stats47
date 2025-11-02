/**
 * 国土・気象 > 気象・気候 > 全国ダッシュボード
 * 全国レベルの気象・気候統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  AnnualPrecipitationCard,
  AverageTemperatureCard,
  PrecipitationSunshineChart,
  TemperatureTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 気象・気候全国ダッシュボード
 */
export async function WeatherClimateNationalDashboard({
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
      {/* 年平均気温統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <AverageTemperatureCard areaCode={areaCode} title="年平均気温" />
      </div>

      {/* 年間降水量統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <AnnualPrecipitationCard areaCode={areaCode} title="年間降水量" />
      </div>

      {/* 気温推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <TemperatureTrendChart
          areaCode={areaCode}
          title="気温推移"
          description="年平均気温、最高気温、最低気温の推移を表示"
        />
      </div>

      {/* 降水量・日照時間推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <PrecipitationSunshineChart
          areaCode={areaCode}
          title="降水量・日照時間推移"
          description="年間降水量と年間日照時間の推移を表示（2軸チャート）"
        />
      </div>
    </DashboardLayout>
  );
}