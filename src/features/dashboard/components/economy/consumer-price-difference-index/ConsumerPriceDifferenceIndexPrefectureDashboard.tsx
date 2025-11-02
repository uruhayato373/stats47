/**
 * 企業・家計・経済 > 消費者物価地域差指数 > 都道府県ダッシュボード
 * 都道府県レベルの消費者物価地域差指数統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  ConsumerPriceDifferenceIndexOverallCard,
  ConsumerPriceDifferenceIndexFoodCard,
  ConsumerPriceDifferenceIndexHousingCard,
  ConsumerPriceDifferenceIndexTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 消費者物価地域差指数都道府県ダッシュボード
 */
export async function ConsumerPriceDifferenceIndexPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 消費者物価地域差指数（総合）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ConsumerPriceDifferenceIndexOverallCard
          areaCode={areaCode}
          title="消費者物価地域差指数（総合）"
        />
      </div>

      {/* 消費者物価地域差指数（食料）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ConsumerPriceDifferenceIndexFoodCard
          areaCode={areaCode}
          title="消費者物価地域差指数（食料）"
        />
      </div>

      {/* 消費者物価地域差指数（住居）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ConsumerPriceDifferenceIndexHousingCard
          areaCode={areaCode}
          title="消費者物価地域差指数（住居）"
        />
      </div>

      {/* 消費者物価地域差指数（総合）推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <ConsumerPriceDifferenceIndexTrendChart
          areaCode={areaCode}
          title="消費者物価地域差指数（総合）推移"
          description="年度別の消費者物価地域差指数（総合）の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}