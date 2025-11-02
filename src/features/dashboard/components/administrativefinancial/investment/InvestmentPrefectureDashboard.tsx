/**
 * 行財政 > 投資 > 都道府県ダッシュボード
 * 都道府県レベルの投資統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  InvestmentExpensesCard,
  TotalAdministrativeInvestmentCard,
  TotalGeneralProjectInvestmentCard,
  InvestmentExpensesTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 投資都道府県ダッシュボード
 */
export async function InvestmentPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 投資的経費（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <InvestmentExpensesCard
          areaCode={areaCode}
          title="投資的経費（都道府県財政）"
        />
      </div>

      {/* 行政総投資額統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalAdministrativeInvestmentCard
          areaCode={areaCode}
          title="行政総投資額"
        />
      </div>

      {/* 一般事業総投資額統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalGeneralProjectInvestmentCard
          areaCode={areaCode}
          title="一般事業総投資額"
        />
      </div>

      {/* 投資的経費（都道府県財政）推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <InvestmentExpensesTrendChart
          areaCode={areaCode}
          title="投資的経費（都道府県財政）推移"
          description="年度別の投資的経費（都道府県財政）の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}