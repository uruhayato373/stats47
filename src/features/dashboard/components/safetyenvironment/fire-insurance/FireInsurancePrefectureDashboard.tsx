/**
 * 司法・安全・環境 > 火災保険 > 都道府県ダッシュボード
 * 都道府県レベルの火災保険統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  FireInsuranceNewContractCountCard,
  FireInsurancePaymentCountCard,
  FireInsurancePaymentAmountCard,
  FireInsuranceNewContractTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 火災保険都道府県ダッシュボード
 */
export async function FireInsurancePrefectureDashboard({
  category: _category,
  subcategory: _subcategory,
  areaCode,
  areaType: _areaType,
  }: DashboardProps) {
  return (
    <DashboardLayout columns={12} gap="1rem">
      {/* 火災保険新契約件数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <FireInsuranceNewContractCountCard
          areaCode={areaCode}
          title="火災保険新契約件数"
        />
      </div>

      {/* 火災保険保険金支払件数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <FireInsurancePaymentCountCard
          areaCode={areaCode}
          title="火災保険保険金支払件数"
        />
      </div>

      {/* 火災保険保険金支払金額統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <FireInsurancePaymentAmountCard
          areaCode={areaCode}
          title="火災保険保険金支払金額"
        />
      </div>

      {/* 火災保険新契約件数推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <FireInsuranceNewContractTrendChart
          areaCode={areaCode}
          title="火災保険新契約件数推移"
          description="年度別の火災保険新契約件数の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}