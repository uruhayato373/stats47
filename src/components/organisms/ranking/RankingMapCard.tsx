/**
 * ランキングマップ表示コンポーネント
 * 都道府県別マップの表示とイベント処理を担当
 */

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/atoms/ui/card";

import { PrefectureMap } from "@/features/visualization/map/common/PrefectureMap";

interface RankingMapCardProps {
  className?: string;
}

/**
 * 都道府県別マップ表示カードコンポーネント
 */
export function RankingMapCard({ className }: RankingMapCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>都道府県別マップ</CardTitle>
        <CardDescription>
          都道府県の境界とランキングデータを地図で表示します
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PrefectureMap
          width={800}
          height={600}
          className="w-full"
          center={[137, 38]}
          zoom={1}
          projection="mercator"
          fillColor="#e0e0e0"
          strokeColor="#ffffff"
          strokeWidth={1}
          hoverColor="#3b82f6"
          selectedColor="#1d4ed8"
          labelFontSize={12}
          labelColor="#374151"
          enableAnimation={true}
          animationDuration={300}
          onPrefectureClick={(feature) => {
            console.log("都道府県クリック:", feature.properties.prefName);
          }}
          onPrefectureHover={(feature) => {
            if (feature) {
              console.log("都道府県ホバー:", feature.properties.prefName);
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
