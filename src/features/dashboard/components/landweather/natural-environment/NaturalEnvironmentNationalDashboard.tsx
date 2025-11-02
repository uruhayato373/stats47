/**
 * 国土・気象 > 自然環境 > 全国ダッシュボード
 * 全国レベルの自然環境統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 自然環境全国ダッシュボード
 */
export async function NaturalEnvironmentNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getNationalNaturalEnvironmentData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>全国の自然環境</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            全国レベルの自然環境統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}