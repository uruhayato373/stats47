import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

/**
 * 市区町村ダッシュボードのProps型定義
 */
interface CityashboardProps {
  /** 地域コード */
  areaCode: string;
}

/**
 * 市区町村ダッシュボードコンポーネント
 *
 * 市区町村レベルの統計データを表示するダッシュボードです。
 * 現在は準備中の状態で、将来的にデータ取得機能を追加予定です。
 *
 * @param props - コンポーネントのProps
 * @returns 市区町村ダッシュボードのJSX要素
 */
export function Cityashboard({
  areaCode,
}: CityDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>市区町村ダッシュボード</CardTitle>
        <CardDescription>
          選択された市区町村の統計データを表示しています
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            市区町村データのダッシュボード表示機能は準備中です
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            地域コード: {areaCode}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
