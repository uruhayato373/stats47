/**
 * 行財政 > 歳出 > 都道府県ダッシュボード
 * 都道府県レベルの歳出統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  TotalExpenditureCard,
  PersonnelExpensesCard,
  PublicBondExpensesCard,
  TotalExpenditureTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 歳出都道府県ダッシュボード
 */
export async function ExpenditurePrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 歳出決算総額（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <TotalExpenditureCard
          areaCode={areaCode}
          title="歳出決算総額（都道府県財政）"
        />
      </div>

      {/* 人件費（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PersonnelExpensesCard
          areaCode={areaCode}
          title="人件費（都道府県財政）"
        />
      </div>

      {/* 公債費（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PublicBondExpensesCard
          areaCode={areaCode}
          title="公債費（都道府県財政）"
        />
      </div>

      {/* 歳出決算総額（都道府県財政）推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <TotalExpenditureTrendChart
          areaCode={areaCode}
          title="歳出決算総額（都道府県財政）推移"
          description="年度別の歳出決算総額（都道府県財政）の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}