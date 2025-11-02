/**
 * 労働・賃金 > 賃金・労働条件 > 全国ダッシュボード
 * 全国レベルの賃金・労働条件統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  MinimumWageCard,
  MinimumWageTrendChart,
  WageSalaryCard,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 賃金・労働条件全国ダッシュボード
 */
export async function WagesWorkingConditionsNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}: DashboardProps) {
  // 未使用のパラメータは型定義の互換性のため必須
  void category;
  void subcategory;
  void areaType;
  void areaLevel;

  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 地域別最低賃金統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <MinimumWageCard areaCode={areaCode} title="地域別最低賃金" />
      </div>

      {/* 賃金・俸給統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <WageSalaryCard areaCode={areaCode} title="賃金・俸給" />
      </div>

      {/* 最低賃金推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <MinimumWageTrendChart
          areaCode={areaCode}
          title="最低賃金推移"
          description="年度別の地域別最低賃金推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}