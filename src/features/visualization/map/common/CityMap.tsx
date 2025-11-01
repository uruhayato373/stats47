/**
 * 地図描画ドメイン - 共通ラッパー
 * 市区町村地図のライブラリ選択と統一インターフェース
 */

"use client";

import { CityMapD3 } from "../d3/CityMapD3";

import type { MapConfig } from "../types/index";

interface CityMapProps extends MapConfig {
  /** 使用する地図ライブラリ */
  library?: "d3" | "leaflet" | "mapbox";
  /** 市区町村クリック時のコールバック */
  onCityClick?: (feature: any) => void;
  /** 市区町村ホバー時のコールバック */
  onCityHover?: (feature: any | null) => void;
}

/**
 * 市区町村地図コンポーネント
 * 複数の地図ライブラリを抽象化した統一インターフェース
 */
export function CityMap({
  library = "d3",
  ...props
}: CityMapProps) {
  // 現在はD3.jsのみ実装
  // 将来的にLeafletやMapboxの実装を追加予定
  switch (library) {
    case "d3":
      return <CityMapD3 {...props} />;

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
