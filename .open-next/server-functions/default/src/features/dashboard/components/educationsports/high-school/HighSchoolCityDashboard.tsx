/**
 * 教育・文化・スポーツ > 高等学校 > 市区町村ダッシュボード
 * 市区町村レベルの高等学校統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 高等学校市区町村ダッシュボード
 */
export async function HighSchoolCityDashboard({
  category,
  subcategory,
  areaCode,
  areaType  
}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getCityHighSchoolData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>市区町村の高等学校</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            市区町村コード: {areaCode}
          </p>
          <p className="text-muted-foreground">
            市区町村レベルの高等学校統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}