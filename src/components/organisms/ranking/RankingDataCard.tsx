/**
 * ランキングデータ表示コンポーネント
 * ランキングデータの表示エリアを担当
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

interface RankingDataCardProps {
  rankingKey: string;
  className?: string;
}

/**
 * ランキングデータ表示カードコンポーネント
 */
export function RankingDataCard({
  rankingKey,
  className,
}: RankingDataCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>ランキングデータ</CardTitle>
        <CardDescription>
          都道府県別のランキングデータを表示します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            ランキングデータの表示機能は準備中です
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            ランキングキー: {rankingKey}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
