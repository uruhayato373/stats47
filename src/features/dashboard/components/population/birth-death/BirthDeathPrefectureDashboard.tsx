/**
 * 人口・世帯 > 出生・死亡 > 都道府県ダッシュボード
 * 都道府県レベルの出生・死亡統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  BirthCountCard,
  BirthDeathTrendChart,
  DeathCountCard,
  TotalFertilityRateCard,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 出生・死亡都道府県ダッシュボード
 */
export async function BirthDeathPrefectureDashboard({
  category,
  subcategory,
  areaCode,
  areaType  
}: DashboardProps) {
  // 未使用のパラメータは型定義の互換性のため必須
  void category;
  void subcategory;
  void areaType;


  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 出生数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <BirthCountCard areaCode={areaCode} title="出生数" />
      </div>

      {/* 死亡数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <DeathCountCard areaCode={areaCode} title="死亡数" />
      </div>

      {/* 合計特殊出生率統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalFertilityRateCard areaCode={areaCode} title="合計特殊出生率" />
      </div>

      {/* 出生・死亡推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <BirthDeathTrendChart
          areaCode={areaCode}
          title="出生・死亡推移"
          description="年度別の出生数と死亡数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}