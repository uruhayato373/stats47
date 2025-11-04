/**
 * 教育・文化・スポーツ > 幼稚園 > 都道府県ダッシュボード
 * 都道府県レベルの幼稚園統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  KindergartenCountCard,
  KindergartenEnrollmentCard,
  KindergartenTeacherCountCard,
  KindergartenEnrollmentTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 幼稚園都道府県ダッシュボード
 */
export async function KindergartenPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 幼稚園数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <KindergartenCountCard
          areaCode={areaCode}
          title="幼稚園数"
        />
      </div>

      {/* 幼稚園在園者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <KindergartenEnrollmentCard
          areaCode={areaCode}
          title="幼稚園在園者数"
        />
      </div>

      {/* 幼稚園教員数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <KindergartenTeacherCountCard
          areaCode={areaCode}
          title="幼稚園教員数"
        />
      </div>

      {/* 幼稚園在園者数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <KindergartenEnrollmentTrendChart
          areaCode={areaCode}
          title="幼稚園在園者数推移"
          description="年度別の幼稚園在園者数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}