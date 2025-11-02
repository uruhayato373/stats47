/**
 * 行財政 > 歳入 > 都道府県ダッシュボード
 * 都道府県レベルの歳入統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  TotalRevenueCard,
  IndependentRevenueCard,
  NationalTreasuryDisbursementCard,
  TotalRevenueTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 歳入都道府県ダッシュボード
 */
export async function RevenuePrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 歳入決算総額（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalRevenueCard
          areaCode={areaCode}
          title="歳入決算総額（都道府県財政）"
        />
      </div>

      {/* 自主財源額（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <IndependentRevenueCard
          areaCode={areaCode}
          title="自主財源額（都道府県財政）"
        />
      </div>

      {/* 国庫支出金（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <NationalTreasuryDisbursementCard
          areaCode={areaCode}
          title="国庫支出金（都道府県財政）"
        />
      </div>

      {/* 歳入決算総額（都道府県財政）推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <TotalRevenueTrendChart
          areaCode={areaCode}
          title="歳入決算総額（都道府県財政）推移"
          description="年度別の歳入決算総額（都道府県財政）の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}