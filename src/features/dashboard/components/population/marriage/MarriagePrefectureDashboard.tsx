/**
 * 人口・世帯 > 婚姻・家族 > 都道府県ダッシュボード
 * 都道府県レベルの婚姻・家族統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  AverageMarriageAgeCard,
  DivorceCountCard,
  MarriageCountCard,
  MarriageDivorceTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 婚姻・家族都道府県ダッシュボード
 */
export async function MarriagePrefectureDashboard({
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
      {/* 婚姻件数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <MarriageCountCard areaCode={areaCode} title="婚姻件数" />
      </div>

      {/* 離婚件数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <DivorceCountCard areaCode={areaCode} title="離婚件数" />
      </div>

      {/* 平均婚姻年齢統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <AverageMarriageAgeCard areaCode={areaCode} title="平均婚姻年齢" />
      </div>

      {/* 婚姻・離婚推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <MarriageDivorceTrendChart
          areaCode={areaCode}
          title="婚姻・離婚推移"
          description="年度別の婚姻件数と離婚件数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}