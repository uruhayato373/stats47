/**
 * 社会保障・衛生 > 生活保護・福祉 > 都道府県ダッシュボード
 * 都道府県レベルの生活保護・福祉統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  PublicAssistanceHouseholdsCard,
  PublicAssistanceExpensesCard,
  PublicAssistancePersonsCard,
  PublicAssistanceHouseholdsTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 生活保護・福祉都道府県ダッシュボード
 */
export async function PublicAssistanceWelfarePrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  areaLevel: _areaLevel,
}: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 生活保護被保護実世帯数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PublicAssistanceHouseholdsCard
          areaCode={areaCode}
          title="生活保護被保護実世帯数"
        />
      </div>

      {/* 生活保護費（都道府県財政）統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PublicAssistanceExpensesCard
          areaCode={areaCode}
          title="生活保護費（都道府県財政）"
        />
      </div>

      {/* 生活保護被保護実人員統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <PublicAssistancePersonsCard
          areaCode={areaCode}
          title="生活保護被保護実人員"
        />
      </div>

      {/* 生活保護被保護実世帯数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <PublicAssistanceHouseholdsTrendChart
          areaCode={areaCode}
          title="生活保護被保護実世帯数推移"
          description="年度別の生活保護被保護実世帯数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}