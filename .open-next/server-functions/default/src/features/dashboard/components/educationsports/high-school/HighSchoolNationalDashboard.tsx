/**
 * 教育・文化・スポーツ > 高等学校 > 全国ダッシュボード
 * 全国レベルの高等学校統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  HighSchoolCountCard,
  HighSchoolStudentCountCard,
  HighSchoolTeacherCountCard,
  HighSchoolStudentTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 高等学校全国ダッシュボード
 */
export async function HighSchoolNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 高等学校数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <HighSchoolCountCard
          areaCode={areaCode}
          title="高等学校数"
        />
      </div>

      {/* 高等学校生徒数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <HighSchoolStudentCountCard
          areaCode={areaCode}
          title="高等学校生徒数"
        />
      </div>

      {/* 高等学校教員数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <HighSchoolTeacherCountCard
          areaCode={areaCode}
          title="高等学校教員数"
        />
      </div>

      {/* 高等学校生徒数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <HighSchoolStudentTrendChart
          areaCode={areaCode}
          title="高等学校生徒数推移"
          description="年度別の高等学校生徒数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}