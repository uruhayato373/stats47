/**
 * 教育・文化・スポーツ > 社会活動 > 全国ダッシュボード
 * 全国レベルの社会活動統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  SocialEducationStaffCard,
  VolunteerActivityRateCard,
  SocialEducationStaffTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 社会活動全国ダッシュボード
 */
export async function SocialActivitiesNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 社会教育関係職員数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <SocialEducationStaffCard
          areaCode={areaCode}
          title="社会教育関係職員数"
        />
      </div>

      {/* ボランティア活動行動者率統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <VolunteerActivityRateCard
          areaCode={areaCode}
          title="ボランティア活動行動者率"
        />
      </div>

      {/* 社会教育関係職員数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <SocialEducationStaffTrendChart
          areaCode={areaCode}
          title="社会教育関係職員数推移"
          description="年度別の社会教育関係職員数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}