/**
 * 国際 > 外国人人口 > 都道府県ダッシュボード
 * 都道府県レベルの外国人人口統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  ForeignPopulationCountCard,
  RegisteredForeignerPopulationCard,
  ResidentForeignerPopulationCard,
  ForeignPopulationTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 外国人人口都道府県ダッシュボード
 */
export async function ForeignPopulationPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 外国人人口統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ForeignPopulationCountCard
          areaCode={areaCode}
          title="外国人人口"
        />
      </div>

      {/* 外国人登録人口統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <RegisteredForeignerPopulationCard
          areaCode={areaCode}
          title="外国人登録人口"
        />
      </div>

      {/* 在留外国人数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <ResidentForeignerPopulationCard
          areaCode={areaCode}
          title="在留外国人数"
        />
      </div>

      {/* 外国人人口推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <ForeignPopulationTrendChart
          areaCode={areaCode}
          title="外国人人口推移"
          description="年度別の外国人人口の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}