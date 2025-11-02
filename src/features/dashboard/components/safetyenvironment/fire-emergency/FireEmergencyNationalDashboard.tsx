/**
 * 司法・安全・環境 > 消防・緊急事態 > 全国ダッシュボード
 * 全国レベルの消防・緊急事態統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  FireDepartmentCountCard,
  FireDepartmentEmployeesCountCard,
  EmergencyDispatchCountCard,
  EmergencyDispatchTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 消防・緊急事態全国ダッシュボード
 */
export async function FireEmergencyNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 消防本部・署数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <FireDepartmentCountCard
          areaCode={areaCode}
          title="消防本部・署数"
        />
      </div>

      {/* 消防職員数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <FireDepartmentEmployeesCountCard
          areaCode={areaCode}
          title="消防職員数"
        />
      </div>

      {/* 救急出動件数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <EmergencyDispatchCountCard
          areaCode={areaCode}
          title="救急出動件数"
        />
      </div>

      {/* 救急出動件数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <EmergencyDispatchTrendChart
          areaCode={areaCode}
          title="救急出動件数推移"
          description="年度別の救急出動件数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}