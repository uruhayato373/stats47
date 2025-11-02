/**
 * 社会保障・衛生 > 健康・保健 > 都道府県ダッシュボード
 * 都道府県レベルの健康・保健統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 健康・保健都道府県ダッシュボード
 */
export async function HealthCarePrefectureDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getPrefectureHealthCareData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>都道府県の健康・保健</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            都道府県コード: {areaCode}
          </p>
          <p className="text-muted-foreground">
            都道府県レベルの健康・保健統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}