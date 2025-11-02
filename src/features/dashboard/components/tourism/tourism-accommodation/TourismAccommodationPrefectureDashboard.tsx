/**
 * 運輸・観光 > 観光・宿泊 > 都道府県ダッシュボード
 * 都道府県レベルの観光・宿泊統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  RyokanFacilitiesCard,
  HotelFacilitiesCard,
  TotalOvernightGuestsCard,
  ForeignOvernightGuestsCard,
  OvernightGuestsTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 観光・宿泊都道府県ダッシュボード
 */
export async function TourismAccommodationPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 旅館営業施設数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <RyokanFacilitiesCard
          areaCode={areaCode}
          title="旅館営業施設数（ホテルを含む）"
        />
      </div>

      {/* ホテル営業施設数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <HotelFacilitiesCard
          areaCode={areaCode}
          title="ホテル営業施設数"
        />
      </div>

      {/* 延べ宿泊者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalOvernightGuestsCard
          areaCode={areaCode}
          title="延べ宿泊者数"
        />
      </div>

      {/* 外国人延べ宿泊者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ForeignOvernightGuestsCard
          areaCode={areaCode}
          title="外国人延べ宿泊者数"
        />
      </div>

      {/* 延べ宿泊者数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <OvernightGuestsTrendChart
          areaCode={areaCode}
          title="延べ宿泊者数推移"
          description="年度別の延べ宿泊者数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}