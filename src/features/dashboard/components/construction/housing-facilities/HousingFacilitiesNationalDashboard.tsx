/**
 * 住宅・土地・建設 > 住宅設備 > 全国ダッシュボード
 * 全国レベルの住宅設備統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 住宅設備全国ダッシュボード
 */
export async function HousingFacilitiesNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType  
}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getNationalHousingFacilitiesData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>全国の住宅設備</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            全国レベルの住宅設備統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}