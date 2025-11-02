/**
 * 労働・賃金 > 産業・職業別 > 全国ダッシュボード
 * 全国レベルの産業・職業別統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 産業・職業別全国ダッシュボード
 */
export async function IndustryOccupationNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getNationalIndustryOccupationData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>全国の産業・職業別</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            全国レベルの産業・職業別統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}