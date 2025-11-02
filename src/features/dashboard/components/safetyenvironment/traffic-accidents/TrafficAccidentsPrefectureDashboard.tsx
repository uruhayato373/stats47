/**
 * 司法・安全・環境 > 交通事故 > 都道府県ダッシュボード
 * 都道府県レベルの交通事故統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  TrafficAccidentCountCard,
  TrafficAccidentDeathCountCard,
  TrafficAccidentCasualtiesCard,
  TrafficAccidentCountTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 交通事故都道府県ダッシュボード
 */
export async function TrafficAccidentsPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 交通事故発生件数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TrafficAccidentCountCard
          areaCode={areaCode}
          title="交通事故発生件数"
        />
      </div>

      {/* 交通事故死者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TrafficAccidentDeathCountCard
          areaCode={areaCode}
          title="交通事故死者数"
        />
      </div>

      {/* 交通事故死傷者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TrafficAccidentCasualtiesCard
          areaCode={areaCode}
          title="交通事故死傷者数"
        />
      </div>

      {/* 交通事故発生件数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <TrafficAccidentCountTrendChart
          areaCode={areaCode}
          title="交通事故発生件数推移"
          description="年度別の交通事故発生件数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}