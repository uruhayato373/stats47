/**
 * 労働・賃金 > 労働力構造 > 全国ダッシュボード
 * 全国レベルの労働力構造統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  EmployedCountCard,
  LaborForceCompositionDonutChart,
  LaborForcePopulationCard,
  LaborForceTrendChart,
  UnemployedCountCard,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 労働力構造全国ダッシュボード
 */
export async function LaborForceStructureNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType  
}: DashboardProps) {
  // 未使用のパラメータは型定義の互換性のため必須
  void category;
  void subcategory;
  void areaType;


  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 労働力人口統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <LaborForcePopulationCard areaCode={areaCode} title="労働力人口" />
      </div>

      {/* 就業者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <EmployedCountCard areaCode={areaCode} title="就業者数" />
      </div>

      {/* 完全失業者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <UnemployedCountCard areaCode={areaCode} title="完全失業者数" />
      </div>

      {/* 労働力構造ドーナツチャート */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <LaborForceCompositionDonutChart
          areaCode={areaCode}
          title="労働力構造"
          description="労働力人口と非労働力人口の割合を表示"
        />
      </div>

      {/* 労働力人口・就業者数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <LaborForceTrendChart
          areaCode={areaCode}
          title="労働力人口・就業者数推移"
          description="年度別の労働力人口と就業者数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}