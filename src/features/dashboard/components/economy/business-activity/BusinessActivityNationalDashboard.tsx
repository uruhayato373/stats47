/**
 * 企業・家計・経済 > 事業活動 > 全国ダッシュボード
 * 全国レベルの事業活動統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  EstablishmentsCard,
  PrivateEstablishmentsCard,
  EmployeesCard,
  EstablishmentsTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 事業活動全国ダッシュボード
 */
export async function BusinessActivityNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 事業所数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <EstablishmentsCard areaCode={areaCode} title="事業所数" />
      </div>

      {/* 事業所数（民営）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PrivateEstablishmentsCard
          areaCode={areaCode}
          title="事業所数（民営）"
        />
      </div>

      {/* 従業者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <EmployeesCard areaCode={areaCode} title="従業者数" />
      </div>

      {/* 事業所数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <EstablishmentsTrendChart
          areaCode={areaCode}
          title="事業所数推移"
          description="年度別の事業所数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}