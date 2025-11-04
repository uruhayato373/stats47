/**
 * 商業・サービス業 > 商業・サービス産業 > 全国ダッシュボード
 * 全国レベルの商業・サービス産業統計を表示
 */

import { DashboardLayout } from "../../shared/DashboardLayout";

import {
  CommercialSalesAmountCard,
  CommercialEstablishmentsCard,
  CommercialEmployeesCard,
  CommercialSalesTrendChart,
} from "./charts";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 商業・サービス産業全国ダッシュボード
 */
export async function CommerceServiceIndustryNationalDashboard({
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
      {/* 商業年間商品販売額統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <CommercialSalesAmountCard
          areaCode={areaCode}
          title="商業年間商品販売額"
        />
      </div>

      {/* 商業事業所数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <CommercialEstablishmentsCard
          areaCode={areaCode}
          title="商業事業所数"
        />
      </div>

      {/* 商業従業者数統計カード */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4">
        <CommercialEmployeesCard
          areaCode={areaCode}
          title="商業従業者数"
        />
      </div>

      {/* 商業年間商品販売額推移チャート */}
      <div className="col-span-12 lg:col-span-8">
        <CommercialSalesTrendChart
          areaCode={areaCode}
          title="商業年間商品販売額推移"
          description="年度別の商業年間商品販売額の推移を表示"
        />
      </div>
    </DashboardLayout>
  );
}