import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

/**
 * 全国ダッシュボードのProps型定義
 */
interface NationalDashboardProps {
  /** 地域コード */
  areaCode: string;
}

/**
 * 全国ダッシュボードコンポーネント
 *
 * 全国レベルの統計データを表示するダッシュボードです。
 * 現在は準備中の状態で、将来的にデータ取得機能を追加予定です。
 *
 * @param props - コンポーネントのProps
 * @returns 全国ダッシュボードのJSX要素
 */
export function NationalDashboard({ areaCode }: NationalDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>全国ダッシュボード</CardTitle>
        <CardDescription>全国の統計データを表示しています</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            全国データのダッシュボード表示機能は準備中です
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            地域コード: {areaCode}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
