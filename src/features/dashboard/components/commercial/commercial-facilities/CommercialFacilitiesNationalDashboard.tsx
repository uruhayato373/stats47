/**
 * 商業・サービス業 > 商業施設 > 全国ダッシュボード
 * 全国レベルの商業施設統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  RyokanFacilitiesCard,
  HotelFacilitiesCard,
  HotelRoomsCard,
  RyokanFacilitiesTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 商業施設全国ダッシュボード
 */
export async function CommercialFacilitiesNationalDashboard({
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
      {/* 旅館営業施設数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <RyokanFacilitiesCard
          areaCode={areaCode}
          title="旅館営業施設数"
        />
      </div>

      {/* ホテル営業施設数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <HotelFacilitiesCard
          areaCode={areaCode}
          title="ホテル営業施設数"
        />
      </div>

      {/* ホテル営業施設客室数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <HotelRoomsCard
          areaCode={areaCode}
          title="ホテル営業施設客室数"
        />
      </div>

      {/* 旅館営業施設数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <RyokanFacilitiesTrendChart
          areaCode={areaCode}
          title="旅館営業施設数推移"
          description="年度別の旅館営業施設数（ホテルを含む）の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}