/**
 * 地図描画ドメイン - 共通ラッパー
 * ライブラリ選択と統一インターフェース
 */

"use client";

import { PrefectureMapD3 } from "../d3/PrefectureMapD3";

import type { MapConfig } from "../types";

interface PrefectureMapProps extends MapConfig {
  /** 使用する地図ライブラリ */
  library?: "d3" | "leaflet" | "mapbox";
}

/**
 * 都道府県地図コンポーネント
 * 複数の地図ライブラリを抽象化した統一インターフェース
 */
export function PrefectureMap({
  library = "d3",
  ...props
}: PrefectureMapProps) {
  // 現在はD3.jsのみ実装
  // 将来的にLeafletやMapboxの実装を追加予定
  switch (library) {
    case "d3":
      return <PrefectureMapD3 {...props} />;

    case "leaflet":
      // TODO: Leaflet実装
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
          <p className="text-gray-500">Leaflet実装は準備中です</p>
        </div>
      );

    case "mapbox":
      // TODO: Mapbox実装
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
          <p className="text-gray-500">Mapbox実装は準備中です</p>
        </div>
      );

    default:
      return (
        <div className="flex items-center justify-center h-64 bg-gray-100 rounded">
          <p className="text-gray-500">
            サポートされていない地図ライブラリです
          </p>
        </div>
      );
  }
}
