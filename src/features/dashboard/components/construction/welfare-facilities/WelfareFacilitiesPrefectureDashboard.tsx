/**
 * 住宅・土地・建設 > 福祉施設 > 都道府県ダッシュボード
 * 都道府県レベルの福祉施設統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  WelfareEstablishmentsCard,
  WelfareEmployeesCard,
  WelfareExpensesCard,
  WelfareEstablishmentsTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 福祉施設都道府県ダッシュボード
 */
export async function WelfareFacilitiesPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 福祉事業所数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <WelfareEstablishmentsCard
          areaCode={areaCode}
          title="福祉事業所数"
        />
      </div>

      {/* 福祉従業者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <WelfareEmployeesCard
          areaCode={areaCode}
          title="福祉従業者数"
        />
      </div>

      {/* 福祉費統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <WelfareExpensesCard
          areaCode={areaCode}
          title="福祉費"
        />
      </div>

      {/* 福祉事業所数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <WelfareEstablishmentsTrendChart
          areaCode={areaCode}
          title="福祉事業所数推移"
          description="年度別の福祉事業所数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}