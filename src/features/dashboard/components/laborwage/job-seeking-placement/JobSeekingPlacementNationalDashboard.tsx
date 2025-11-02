/**
 * 労働・賃金 > 求職・求人 > 全国ダッシュボード
 * 全国レベルの求職・求人統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 求職・求人全国ダッシュボード
 */
export async function JobSeekingPlacementNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType  
}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getNationalJobSeekingPlacementData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>全国の求職・求人</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            全国レベルの求職・求人統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}