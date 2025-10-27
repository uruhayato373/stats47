/**
 * ランキングマップ表示コンポーネント
 * 都道府県別マップの表示とイベント処理を担当
 */

import { useMemo } from "react";

import { Card, CardContent } from "@/components/atoms/ui/card";

import type { RankingValue } from "@/features/ranking/types/item";
import { PrefectureMap } from "@/features/visualization/map/common/PrefectureMap";
import type { ChoroplethData } from "@/features/visualization/map/types/index";

interface RankingMapCardProps {
  /** ランキングデータ */
  data?: RankingValue[];
  /** カラースキーム（デフォルト: "interpolateBlues"） */
  colorScheme?: string;
  /** 分岐点設定 */
  divergingMidpoint?: "zero" | "mean" | "median" | number;
  /** 地図の高さ（デフォルト: 600） */
  height?: number;
  /** CSSクラス名 */
  className?: string;
  /** 都道府県クリック時のコールバック */
  onPrefectureClick?: (areaCode: string, areaName?: string) => void;
}

/**
 * 都道府県別マップ表示カードコンポーネント
 */
export function RankingMapCard({
  data,
  colorScheme = "interpolateBlues",
  divergingMidpoint,
  height = 600,
  className,
  onPrefectureClick,
}: RankingMapCardProps) {
  // RankingValue[]をChoroplethData[]に変換
  const choroplethData = useMemo<ChoroplethData[] | undefined>(() => {
    if (!data) return undefined;

    return data.map((item) => ({
      areaCode: item.areaCode,
      value: item.value,
      areaName: item.areaName,
    }));
  }, [data]);

  return (
    <Card className={className}>
      <CardContent className="p-0">
        <PrefectureMap
          width={undefined}
          height={height}
          className="w-full h-full"
          center={[137, 38]}
          zoom={1}
          projection="mercator"
          data={choroplethData}
          colorScheme={colorScheme}
          divergingMidpoint={divergingMidpoint}
          strokeColor="#ffffff"
          strokeWidth={1}
          hoverColor="#3b82f6"
          selectedColor="#1d4ed8"
          labelFontSize={12}
          labelColor="#374151"
          enableAnimation={true}
          animationDuration={300}
          onPrefectureClick={(feature) => {
            onPrefectureClick?.(
              feature.properties.prefCode,
              feature.properties.prefName
            );
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
