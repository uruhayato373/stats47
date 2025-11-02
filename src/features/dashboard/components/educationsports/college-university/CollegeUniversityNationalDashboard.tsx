/**
 * 教育・文化・スポーツ > 短大・大学 > 全国ダッシュボード
 * 全国レベルの短大・大学統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  UniversityCountCard,
  JuniorCollegeCountCard,
  UniversityStudentCountCard,
  JuniorCollegeStudentCountCard,
  UniversityStudentTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 短大・大学全国ダッシュボード
 */
export async function CollegeUniversityNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 大学数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3">
        <UniversityCountCard
          areaCode={areaCode}
          title="大学数"
        />
      </div>

      {/* 短期大学数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3">
        <JuniorCollegeCountCard
          areaCode={areaCode}
          title="短期大学数"
        />
      </div>

      {/* 大学学生数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3">
        <UniversityStudentCountCard
          areaCode={areaCode}
          title="大学学生数"
        />
      </div>

      {/* 短期大学学生数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-3">
        <JuniorCollegeStudentCountCard
          areaCode={areaCode}
          title="短期大学学生数"
        />
      </div>

      {/* 大学学生数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <UniversityStudentTrendChart
          areaCode={areaCode}
          title="大学学生数推移"
          description="年度別の大学学生数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}