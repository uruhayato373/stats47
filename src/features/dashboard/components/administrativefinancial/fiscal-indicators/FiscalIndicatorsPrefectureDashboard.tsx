/**
 * 行財政 > 財政指標 > 都道府県ダッシュボード
 * 都道府県レベルの財政指標統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  FiscalStrengthIndexCard,
  RealBalanceRatioCard,
  RealPublicDebtServiceRatioCard,
  FiscalStrengthIndexTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 財政指標都道府県ダッシュボード
 */
export async function FiscalIndicatorsPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 財政力指数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <FiscalStrengthIndexCard
          areaCode={areaCode}
          title="財政力指数"
        />
      </div>

      {/* 実質収支比率統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <RealBalanceRatioCard
          areaCode={areaCode}
          title="実質収支比率"
        />
      </div>

      {/* 実質公債費比率統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <RealPublicDebtServiceRatioCard
          areaCode={areaCode}
          title="実質公債費比率"
        />
      </div>

      {/* 財政力指数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <FiscalStrengthIndexTrendChart
          areaCode={areaCode}
          title="財政力指数推移"
          description="年度別の財政力指数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}