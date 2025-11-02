/**
 * 司法・安全・環境 > 消防・緊急事態 > 全国ダッシュボード
 * 全国レベルの消防・緊急事態統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 消防・緊急事態全国ダッシュボード
 */
export async function FireEmergencyNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getNationalFireEmergencyData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>全国の消防・緊急事態</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            全国レベルの消防・緊急事態統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}