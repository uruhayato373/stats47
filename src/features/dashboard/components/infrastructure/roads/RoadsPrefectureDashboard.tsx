/**
 * 社会基盤施設 > 道路 > 都道府県ダッシュボード
 * 都道府県レベルの道路統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  RoadLengthCard,
  MajorRoadLengthCard,
  PavedRoadLengthCard,
  RoadLengthTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 道路都道府県ダッシュボード
 */
export async function RoadsPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 道路実延長統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <RoadLengthCard areaCode={areaCode} title="道路実延長" />
      </div>

      {/* 道路実延長（主要道路）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <MajorRoadLengthCard
          areaCode={areaCode}
          title="道路実延長（主要道路）"
        />
      </div>

      {/* 舗装道路実延長統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PavedRoadLengthCard
          areaCode={areaCode}
          title="舗装道路実延長"
        />
      </div>

      {/* 道路実延長推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <RoadLengthTrendChart
          areaCode={areaCode}
          title="道路実延長推移"
          description="年度別の道路実延長の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}