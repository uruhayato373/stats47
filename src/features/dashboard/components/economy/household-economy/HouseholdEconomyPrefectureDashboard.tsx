/**
 * 企業・家計・経済 > 家計 > 都道府県ダッシュボード
 * 都道府県レベルの家計統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  PrivateConsumptionExpenditureCard,
  ConsumerPriceIndexCard,
  PrivateConsumptionTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 家計都道府県ダッシュボード
 */
export async function HouseholdEconomyPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 民間最終消費支出統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PrivateConsumptionExpenditureCard
          areaCode={areaCode}
          title="民間最終消費支出"
        />
      </div>

      {/* 消費者物価指数変化率統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ConsumerPriceIndexCard
          areaCode={areaCode}
          title="消費者物価指数変化率"
        />
      </div>

      {/* 民間最終消費支出推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <PrivateConsumptionTrendChart
          areaCode={areaCode}
          title="民間最終消費支出推移"
          description="年度別の民間最終消費支出の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}