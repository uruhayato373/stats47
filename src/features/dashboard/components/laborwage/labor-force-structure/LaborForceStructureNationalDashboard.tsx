/**
 * 労働・賃金 > 労働力構造 > 全国ダッシュボード
 * 全国レベルの労働力構造統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 労働力構造全国ダッシュボード
 */
export async function LaborForceStructureNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getNationalLaborForceStructureData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>全国の労働力構造</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            全国レベルの労働力構造統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}