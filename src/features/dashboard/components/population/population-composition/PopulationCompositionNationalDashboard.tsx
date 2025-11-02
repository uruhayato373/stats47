/**
 * 人口・世帯 > 人口構成 > 全国ダッシュボード
 * 全国レベルの人口構成統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 人口構成全国ダッシュボード
 */
export async function PopulationCompositionNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType  
}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getNationalPopulationCompositionData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>全国の人口構成</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            全国レベルの人口構成統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}