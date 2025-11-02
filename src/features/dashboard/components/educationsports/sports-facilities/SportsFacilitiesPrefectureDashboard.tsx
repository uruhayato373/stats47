/**
 * 教育・文化・スポーツ > スポーツ施設 > 都道府県ダッシュボード
 * 都道府県レベルのスポーツ施設統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  PublicGymnasiumCountCard,
  PrivateGymnasiumCountCard,
  PublicSwimmingPoolCountCard,
  PublicGymnasiumTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * スポーツ施設都道府県ダッシュボード
 */
export async function SportsFacilitiesPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 体育館数（公共）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PublicGymnasiumCountCard
          areaCode={areaCode}
          title="体育館数（公共）"
        />
      </div>

      {/* 体育館数（民間）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PrivateGymnasiumCountCard
          areaCode={areaCode}
          title="体育館数（民間）"
        />
      </div>

      {/* 水泳プール数（公共）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PublicSwimmingPoolCountCard
          areaCode={areaCode}
          title="水泳プール数（公共）"
        />
      </div>

      {/* 体育館数（公共）推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <PublicGymnasiumTrendChart
          areaCode={areaCode}
          title="体育館数（公共）推移"
          description="年度別の体育館数（公共）の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}