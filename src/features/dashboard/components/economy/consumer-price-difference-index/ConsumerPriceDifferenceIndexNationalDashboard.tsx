/**
 * 企業・家計・経済 > 消費者物価地域差指数 > 全国ダッシュボード
 * 全国レベルの消費者物価地域差指数統計を表示
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/atoms/ui/card";

import { DashboardLayout } from "../../shared/DashboardLayout";

import type { DashboardProps } from "../../../types/dashboard";

/**
 * 消費者物価地域差指数全国ダッシュボード
 */
export async function ConsumerPriceDifferenceIndexNationalDashboard({
  category,
  subcategory,
  areaCode,
  areaType,
  areaLevel,
}: DashboardProps) {
  // TODO: 実際のデータ取得処理を実装
  // const data = await getNationalConsumerPriceDifferenceIndexData(areaCode);

  return (
    <DashboardLayout columns={12} gap="1rem">
      <Card className="col-span-12">
        <CardHeader>
          <CardTitle>全国の消費者物価地域差指数</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            全国レベルの消費者物価地域差指数統計データを表示します。
          </p>
          {/* TODO: 実際のデータ表示を実装 */}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}