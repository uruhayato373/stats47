/**
 * 国土・気象 > 自然環境 > 都道府県ダッシュボード
 * 都道府県レベルの自然環境統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  ConservationAreaCard,
  NationalParkRatioDonutChart,
  NaturalParkAreaCard,
  NaturalParkTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 自然環境都道府県ダッシュボード
 */
export async function NaturalEnvironmentPrefectureDashboard({
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
      {/* 自然公園面積統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <NaturalParkAreaCard areaCode={areaCode} title="自然公園面積" />
      </div>

      {/* 自然環境保全地域面積統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ConservationAreaCard areaCode={areaCode} title="自然環境保全地域面積" />
      </div>

      {/* 国立・国定公園面積割合ドーナツチャート */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <NationalParkRatioDonutChart
          areaCode={areaCode}
          title="国立・国定公園面積割合"
          description="国立公園と国定公園の面積割合を表示"
        />
      </div>

      {/* 自然公園面積推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <NaturalParkTrendChart
          areaCode={areaCode}
          title="自然公園面積推移"
          description="年度別の自然公園面積推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}