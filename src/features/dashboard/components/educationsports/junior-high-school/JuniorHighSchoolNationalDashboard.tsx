/**
 * 教育・文化・スポーツ > 中学校 > 全国ダッシュボード
 * 全国レベルの中学校統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  JuniorHighSchoolCountCard,
  JuniorHighSchoolStudentCountCard,
  JuniorHighSchoolTeacherCountCard,
  JuniorHighSchoolStudentTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 中学校全国ダッシュボード
 */
export async function JuniorHighSchoolNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 中学校数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <JuniorHighSchoolCountCard
          areaCode={areaCode}
          title="中学校数"
        />
      </div>

      {/* 中学校生徒数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <JuniorHighSchoolStudentCountCard
          areaCode={areaCode}
          title="中学校生徒数"
        />
      </div>

      {/* 中学校教員数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <JuniorHighSchoolTeacherCountCard
          areaCode={areaCode}
          title="中学校教員数"
        />
      </div>

      {/* 中学校生徒数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <JuniorHighSchoolStudentTrendChart
          areaCode={areaCode}
          title="中学校生徒数推移"
          description="年度別の中学校生徒数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}