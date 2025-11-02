/**
 * 国土・気象 > 土地利用 > 都道府県ダッシュボード
 * 都道府県レベルの土地利用統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 土地利用都道府県ダッシュボード
 */
export async function LandUsePrefectureDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getPrefectureLandUseData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>都道府県の土地利用</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            都道府県コード: {areaCode}
          </p>
          <p className="text-muted-foreground">
            都道府県レベルの土地利用統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}