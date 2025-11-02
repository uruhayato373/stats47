/**
 * 鉱工業 > 製造業 > 都道府県ダッシュボード
 * 都道府県レベルの製造業統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  ManufacturingEstablishmentsCard,
  ManufacturingEmployeesCard,
  ManufacturingShipmentAmountCard,
  ManufacturingShipmentTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 製造業都道府県ダッシュボード
 */
export async function ManufacturingPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 製造業事業所数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ManufacturingEstablishmentsCard
          areaCode={areaCode}
          title="製造業事業所数"
        />
      </div>

      {/* 製造業従業者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ManufacturingEmployeesCard
          areaCode={areaCode}
          title="製造業従業者数"
        />
      </div>

      {/* 製造品出荷額等統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ManufacturingShipmentAmountCard
          areaCode={areaCode}
          title="製造品出荷額等"
        />
      </div>

      {/* 製造品出荷額推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <ManufacturingShipmentTrendChart
          areaCode={areaCode}
          title="製造品出荷額推移"
          description="年度別の製造品出荷額等の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}