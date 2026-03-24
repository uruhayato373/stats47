"use client";

import { useCallback, useRef } from "react";
import { GeoJSON } from "react-leaflet";
import type { Layer, PathOptions, GeoJSON as LeafletGeoJSON } from "leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";

interface ChoroplethGeoJsonLayerProps {
  /** GeoJSON データ */
  geojson: FeatureCollection<Geometry>;
  /** Feature → Leaflet PathOptions の変換関数 */
  styleFactory: (feature?: Feature<Geometry>) => PathOptions;
  /** Feature からエリアコードを抽出する関数 */
  codeExtractor: (feature: Feature<Geometry>) => string;
  /** Feature からエリア名を抽出する関数 */
  nameExtractor: (feature: Feature<Geometry>) => string;
  /** クリック時コールバック */
  onFeatureClick?: (code: string) => void;
  /** 選択中のエリアコード */
  selectedCode?: string | null;
  /** ホバー時のハイライト色 */
  highlightColor?: string;
  /** 値のフォーマッタ（ツールチップ用） */
  valueFormatter?: (feature: Feature<Geometry>) => string;
}

/**
 * コロプレス GeoJSON レイヤー
 *
 * hover ハイライト、click コールバック、選択状態を管理する汎用レイヤー。
 * 都道府県・市区町村の両方で使用可能。
 */
export function ChoroplethGeoJsonLayer({
  geojson,
  styleFactory,
  codeExtractor,
  nameExtractor,
  onFeatureClick,
  selectedCode,
  highlightColor = "#3b82f6",
  valueFormatter,
}: ChoroplethGeoJsonLayerProps) {
  const geoJsonRef = useRef<LeafletGeoJSON | null>(null);

  const onEachFeature = useCallback(
    (feature: Feature<Geometry>, layer: Layer) => {
      // ツールチップ
      const name = nameExtractor(feature);
      const valueText = valueFormatter?.(feature) ?? "";
      const tooltip = valueText ? `${name}: ${valueText}` : name;
      layer.bindTooltip(tooltip, { sticky: true, direction: "top", offset: [0, -8] });

      // ホバーハイライト
      layer.on({
        mouseover: (e) => {
          // 他レイヤーのツールチップを閉じる（sticky tooltip の残留防止）
          geoJsonRef.current?.eachLayer((l) => {
            if (l !== e.target) l.closeTooltip();
          });
          const target = e.target;
          target.setStyle({
            weight: 2,
            color: highlightColor,
            fillOpacity: 0.95,
          });
          target.bringToFront();
        },
        mouseout: (e) => {
          const target = e.target;
          const code = codeExtractor(feature);
          if (code === selectedCode) {
            target.setStyle({ weight: 2.5, color: highlightColor, fillOpacity: 0.95 });
          } else {
            target.setStyle(styleFactory(feature));
          }
        },
        click: () => {
          const code = codeExtractor(feature);
          onFeatureClick?.(code);
        },
      });
    },
    [nameExtractor, valueFormatter, highlightColor, codeExtractor, selectedCode, styleFactory, onFeatureClick]
  );

  // selectedCode 変更時もイベントハンドラを再バインドするため key に含める
  const geoJsonKey = `${JSON.stringify(geojson).length}-${selectedCode ?? ""}`;

  return (
    <GeoJSON
      ref={geoJsonRef}
      key={geoJsonKey}
      data={geojson}
      style={styleFactory}
      onEachFeature={onEachFeature}
    />
  );
}
