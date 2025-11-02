"use client";

/**
 * ランキングマップ表示コンポーネント
 * 都道府県別マップの表示とイベント処理を担当
 */

import { useMemo, useState } from "react";

import { Home, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/atoms/ui/button";
import { Card, CardContent } from "@/components/atoms/ui/card";

import { PrefectureMap } from "@/features/visualization/map/common/PrefectureMap";
import type { ChoroplethData } from "@/features/visualization/map/types/index";

import type { StatsSchema } from "@/types/stats";

interface RankingMapCardProps {
  /** ランキングデータ */
  data?: StatsSchema[];
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
  /** 初期ズームレベル（デフォルト: 1） */
  initialZoom?: number;
  /** 初期中心座標（デフォルト: [137, 38]） */
  initialCenter?: [number, number];
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
  initialZoom = 1,
  initialCenter = [137, 38],
}: RankingMapCardProps) {
  // 初期位置に戻すために使用するkey（変更するとコンポーネントが再マウントされる）
  const [mapKey, setMapKey] = useState(0);
  // ズームレベルの状態管理
  const [currentZoom, setCurrentZoom] = useState(initialZoom);

  // StatsSchema[]をChoroplethData[]に変換
  // areaCode=00000（全国合計）のデータを除外し、47都道府県のデータのみを表示
  const choroplethData = useMemo<ChoroplethData[] | undefined>(() => {
    if (!data) return undefined;

    return data
      .filter((item) => item.areaCode !== "00000")
      .map((item) => ({
        areaCode: item.areaCode,
        value: item.value,
        areaName: item.areaName,
      }));
  }, [data]);

  // 拡大ボタンのハンドラー
  const handleZoomIn = () => {
    setCurrentZoom((prev) => Math.min(prev * 1.5, 8));
    // keyを変更して地図を再マウント（簡易実装）
    setMapKey((prev) => prev + 1);
  };

  // 縮小ボタンのハンドラー
  const handleZoomOut = () => {
    setCurrentZoom((prev) => Math.max(prev / 1.5, 0.5));
    // keyを変更して地図を再マウント（簡易実装）
    setMapKey((prev) => prev + 1);
  };

  // ズームリセットボタンのハンドラー
  const handleResetZoom = () => {
    setCurrentZoom(initialZoom);
    // keyを変更して地図を再マウント（初期状態に戻る）
    setMapKey((prev) => prev + 1);
  };

  return (
    <Card className={className}>
      <CardContent className="p-0 relative">
        {/* 地図コントロールボタン */}
        <div className="absolute bottom-4 right-4 z-10 flex flex-row gap-2">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={handleZoomIn}
            title="拡大"
            className="bg-white/90 hover:bg-white shadow-md"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={handleZoomOut}
            title="縮小"
            className="bg-white/90 hover:bg-white shadow-md"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            onClick={handleResetZoom}
            title="ズームをリセット"
            className="bg-white/90 hover:bg-white shadow-md"
          >
            <Home className="h-4 w-4" />
          </Button>
        </div>

        <PrefectureMap
          key={mapKey}
          width={undefined}
          height={height}
          className="w-full h-full"
          center={initialCenter}
          zoom={currentZoom}
          projection="mercator"
          data={choroplethData}
          colorScheme={colorScheme}
          divergingMidpoint={divergingMidpoint}
          strokeColor="#ffffff"
          strokeWidth={1}
          hoverColor="#3b82f6"
          selectedColor="#1d4ed8"
          labelFontSize={0}
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
