/**
 * 行財政 > 職員・議会・選挙 > 都道府県ダッシュボード
 * 都道府県レベルの職員・議会・選挙統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  PrefecturalStaffCountCard,
  PrefecturalAssemblyMembersCard,
  VoterListRegistrantsCard,
  PrefecturalStaffTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 職員・議会・選挙都道府県ダッシュボード
 */
export async function StaffAssemblyElectionPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 一般行政部門職員数（都道府県）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PrefecturalStaffCountCard
          areaCode={areaCode}
          title="一般行政部門職員数（都道府県）"
        />
      </div>

      {/* 都道府県議会議員数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PrefecturalAssemblyMembersCard
          areaCode={areaCode}
          title="都道府県議会議員数"
        />
      </div>

      {/* 選挙人名簿登録者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <VoterListRegistrantsCard
          areaCode={areaCode}
          title="選挙人名簿登録者数"
        />
      </div>

      {/* 一般行政部門職員数（都道府県）推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <PrefecturalStaffTrendChart
          areaCode={areaCode}
          title="一般行政部門職員数（都道府県）推移"
          description="年度別の一般行政部門職員数（都道府県）の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}