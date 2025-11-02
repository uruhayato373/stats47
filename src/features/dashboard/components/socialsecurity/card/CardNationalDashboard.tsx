/**
 * 社会保障・衛生 > 社会保障指標 > 全国ダッシュボード
 * 全国レベルの社会保障指標統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  SocialWelfareExpensesCard,
  PublicAssistanceHouseholdsCard,
  WelfareExpensesCard,
  SocialWelfareExpensesTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 社会保障指標全国ダッシュボード
 */
export async function CardNationalDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 社会福祉費（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <SocialWelfareExpensesCard
          areaCode={areaCode}
          title="社会福祉費（都道府県財政）"
        />
      </div>

      {/* 生活保護被保護実世帯数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PublicAssistanceHouseholdsCard
          areaCode={areaCode}
          title="生活保護被保護実世帯数"
        />
      </div>

      {/* 民生費（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <WelfareExpensesCard
          areaCode={areaCode}
          title="民生費（都道府県財政）"
        />
      </div>

      {/* 社会福祉費推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <SocialWelfareExpensesTrendChart
          areaCode={areaCode}
          title="社会福祉費推移"
          description="年度別の社会福祉費（都道府県財政）の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}