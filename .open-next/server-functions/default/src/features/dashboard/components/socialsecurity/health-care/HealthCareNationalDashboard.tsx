/**
 * 社会保障・衛生 > 健康・保健 > 全国ダッシュボード
 * 全国レベルの健康・保健統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  HospitalCountCard,
  GeneralClinicCountCard,
  DentalClinicCountCard,
  HospitalCountTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 健康・保健全国ダッシュボード
 */
export async function HealthCareNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 病院数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <HospitalCountCard areaCode={areaCode} title="病院数" />
      </div>

      {/* 一般診療所数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <GeneralClinicCountCard
          areaCode={areaCode}
          title="一般診療所数"
        />
      </div>

      {/* 歯科診療所数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <DentalClinicCountCard
          areaCode={areaCode}
          title="歯科診療所数"
        />
      </div>

      {/* 病院数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <HospitalCountTrendChart
          areaCode={areaCode}
          title="病院数推移"
          description="年度別の病院数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}