/**
 * 住宅・土地・建設 > 建設・製造 > 全国ダッシュボード
 * 全国レベルの建設・製造統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  ConstructionEstablishmentsCard,
  ManufacturingEstablishmentsCard,
  PrimeContractorCompletedConstructionCard,
  ManufacturingShipmentTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 建設・製造全国ダッシュボード
 */
export async function ConstructionManufacturingNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 建設業事業所数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ConstructionEstablishmentsCard
          areaCode={areaCode}
          title="建設業事業所数"
        />
      </div>

      {/* 製造業事業所数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ManufacturingEstablishmentsCard
          areaCode={areaCode}
          title="製造業事業所数"
        />
      </div>

      {/* 元請完成工事高統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PrimeContractorCompletedConstructionCard
          areaCode={areaCode}
          title="元請完成工事高"
        />
      </div>

      {/* 製造品出荷額等推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <ManufacturingShipmentTrendChart
          areaCode={areaCode}
          title="製造品出荷額等推移"
          description="年度別の製造品出荷額等の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}