/**
 * 労働・賃金 > 賃金・労働条件 > 市区町村ダッシュボード
 * 市区町村レベルの賃金・労働条件統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 賃金・労働条件市区町村ダッシュボード
 */
export async function WagesWorkingConditionsCityDashboard({
  category,
  subcategory,
  areaCode,
  areaType  
}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getCityWagesWorkingConditionsData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>市区町村の賃金・労働条件</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            市区町村コード: {areaCode}
          </p>
          <p className="text-muted-foreground">
            市区町村レベルの賃金・労働条件統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}