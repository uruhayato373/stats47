import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

/**
 * 都道府県ダッシュボードのProps型定義
 */
interface PrefectureDashboardProps {
  /** 地域コード */
  areaCode: string;
}

/**
 * 都道府県ダッシュボードコンポーネント
 *
 * 都道府県レベルの統計データを表示するダッシュボードです。
 * 現在は準備中の状態で、将来的にデータ取得機能を追加予定です。
 *
 * @param props - コンポーネントのProps
 * @returns 都道府県ダッシュボードのJSX要素
 */
export function PrefectureDashboard({ areaCode }: PrefectureDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>都道府県ダッシュボード</CardTitle>
        <CardDescription>
          選択された都道府県の統計データを表示しています
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            都道府県データのダッシュボード表示機能は準備中です
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            地域コード: {areaCode}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
