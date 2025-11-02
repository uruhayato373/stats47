/**
 * 社会保障・衛生 > 死亡統計 > 都道府県ダッシュボード
 * 都道府県レベルの死亡統計統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  DeathCountCard,
  DeathCount65PlusCard,
  StandardizedMortalityRateCard,
  DeathCountTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 死亡統計都道府県ダッシュボード
 */
export async function DeathStatisticsPrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 死亡数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <DeathCountCard areaCode={areaCode} title="死亡数" />
      </div>

      {/* 死亡数（65歳以上）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <DeathCount65PlusCard
          areaCode={areaCode}
          title="死亡数（65歳以上）"
        />
      </div>

      {/* 標準化死亡率統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <StandardizedMortalityRateCard
          areaCode={areaCode}
          title="標準化死亡率"
        />
      </div>

      {/* 死亡数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <DeathCountTrendChart
          areaCode={areaCode}
          title="死亡数推移"
          description="年度別の死亡数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}