/**
 * 社会保障・衛生 > 健康・保健 > 市区町村ダッシュボード
 * 市区町村レベルの健康・保健統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 健康・保健市区町村ダッシュボード
 */
export async function HealthCareCityDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getCityHealthCareData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>市区町村の健康・保健</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            市区町村コード: {areaCode}
          </p>
          <p className="text-muted-foreground">
            市区町村レベルの健康・保健統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}