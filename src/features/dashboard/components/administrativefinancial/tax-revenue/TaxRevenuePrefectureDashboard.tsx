/**
 * 行財政 > 税収 > 都道府県ダッシュボード
 * 都道府県レベルの税収統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  LocalTaxCard,
  BusinessTaxCard,
  FixedAssetTaxCard,
  LocalTaxTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 税収都道府県ダッシュボード
 */
export async function TaxRevenuePrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 地方税（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <LocalTaxCard
          areaCode={areaCode}
          title="地方税（都道府県財政）"
        />
      </div>

      {/* 事業税統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <BusinessTaxCard
          areaCode={areaCode}
          title="事業税"
        />
      </div>

      {/* 固定資産税（都道府県税）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <FixedAssetTaxCard
          areaCode={areaCode}
          title="固定資産税（都道府県税）"
        />
      </div>

      {/* 地方税（都道府県財政）推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <LocalTaxTrendChart
          areaCode={areaCode}
          title="地方税（都道府県財政）推移"
          description="年度別の地方税（都道府県財政）の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}