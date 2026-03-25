"use client";

import "leaflet/dist/leaflet.css";

import { useCallback, useMemo } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { TopoJSONTopology } from "@stats47/types";

import type { MapVisualizationConfig, MapDataPoint } from "../../d3/types/map-chart";
import { useTopoJsonToGeoJson } from "../hooks/useTopoJsonToGeoJson";
import { useChoroplethStyle } from "../hooks/useChoroplethStyle";
import { ChoroplethGeoJsonLayer } from "./ChoroplethGeoJsonLayer";
import { MapColorLegend } from "./MapColorLegend";
import {
  JAPAN_CENTER,
  JAPAN_ZOOM,
  JAPAN_MIN_ZOOM,
  JAPAN_MAX_ZOOM,
} from "../constants/tile-providers";

export interface LeafletChoroplethMapProps {
  /** 都道府県 TopoJSON */
  topology: TopoJSONTopology | null;
  /** ランキングデータ（areaCode=00000 除外済み想定） */
  data: MapDataPoint[];
  /** 色スケール設定 */
  colorConfig: MapVisualizationConfig;
  /** タイル URL（light/dark） */
  tileUrl: string;
  /** タイル attribution */
  attribution: string;
  /** 値の単位 */
  unit?: string;
  /** 都道府県クリック時コールバック */
  onPrefectureClick?: (code: string) => void;
  /** 選択中の都道府県コード */
  selectedPrefectureCode?: string | null;
  /** 市区町村 GeoJSON（ドリルダウン時） */
  municipalityGeojson?: FeatureCollection<Geometry> | null;
  /** 市区町村データ */
  municipalityData?: MapDataPoint[];
  /** 市区町村の色スケール設定 */
  municipalityColorConfig?: MapVisualizationConfig;
  /** 市区町村クリック時コールバック */
  onMunicipalityClick?: (code: string) => void;
  /** 地図の境界線色 */
  borderColor?: string;
  /** CSS クラス */
  className?: string;
  /** 凡例の値変換表示設定 */
  valueDisplay?: {
    conversionFactor?: number;
    decimalPlaces?: number;
    displayUnit?: string;
  };
}

/** Feature から都道府県コード（XX000 形式）を抽出 */
function extractPrefCode(feature: Feature<Geometry>): string {
  const props = feature.properties ?? {};
  if (props.prefCode) return String(props.prefCode);
  const raw = String(props.N03_007 ?? props.code ?? "").padStart(2, "0");
  return raw.length <= 2 ? raw + "000" : raw;
}

/** Feature から都道府県名を抽出 */
function extractPrefName(feature: Feature<Geometry>): string {
  const props = feature.properties ?? {};
  return String(props.prefName ?? props.N03_001 ?? props.name ?? "不明");
}

/** Feature から市区町村コードを抽出 */
function extractCityCode(feature: Feature<Geometry>): string {
  const props = feature.properties ?? {};
  return String(props.N03_007 ?? props.cityCode ?? props.areaCode ?? "");
}

/** Feature から市区町村名を抽出 */
function extractCityName(feature: Feature<Geometry>): string {
  const props = feature.properties ?? {};
  return String(props.cityName ?? props.N03_004 ?? props.N03_003 ?? props.name ?? "不明");
}

/**
 * Leaflet コロプレスマップ
 *
 * 都道府県レイヤー + オプションで市区町村レイヤーを表示。
 * タイル背景付きのインタラクティブなコロプレスマップ。
 */
export function LeafletChoroplethMap({
  topology,
  data,
  colorConfig,
  tileUrl,
  attribution,
  unit,
  onPrefectureClick,
  selectedPrefectureCode,
  municipalityGeojson,
  municipalityData,
  municipalityColorConfig,
  onMunicipalityClick,
  borderColor = "#94a3b8",
  className,
  valueDisplay,
}: LeafletChoroplethMapProps) {
  const prefGeojson = useTopoJsonToGeoJson(topology);

  const prefStyle = useChoroplethStyle(colorConfig, data, extractPrefCode, borderColor);

  const muniStyle = useChoroplethStyle(
    municipalityColorConfig ?? colorConfig,
    municipalityData ?? [],
    extractCityCode,
    borderColor
  );

  const prefValueFormatter = useCallback(
    (feature: Feature<Geometry>) => {
      const code = extractPrefCode(feature);
      const item = data.find((d) => d.areaCode === code);
      if (item?.value == null) return "";
      return `${item.value.toLocaleString()}${unit ? ` ${unit}` : ""}`;
    },
    [data, unit]
  );

  const muniValueFormatter = useCallback(
    (feature: Feature<Geometry>) => {
      if (!municipalityData) return "";
      const code = extractCityCode(feature);
      const item = municipalityData.find((d) => d.areaCode === code);
      if (item?.value == null) return "";
      return `${item.value.toLocaleString()}${unit ? ` ${unit}` : ""}`;
    },
    [municipalityData, unit]
  );

  // 表示するデータ（凡例用）
  const legendData = municipalityData && municipalityData.length > 0 ? municipalityData : data;
  const legendConfig = municipalityData && municipalityData.length > 0
    ? (municipalityColorConfig ?? colorConfig)
    : colorConfig;

  if (!prefGeojson || !prefStyle) {
    return (
      <div className={`flex items-center justify-center min-h-[400px] rounded-md bg-muted/50 text-muted-foreground text-sm ${className ?? ""}`}>
        地図を読み込み中...
      </div>
    );
  }

  return (
    <div className={className}>
      <MapContainer
        center={JAPAN_CENTER}
        zoom={JAPAN_ZOOM}
        minZoom={JAPAN_MIN_ZOOM}
        maxZoom={JAPAN_MAX_ZOOM}
        scrollWheelZoom
        style={{ height: "100%", width: "100%", minHeight: 400, borderRadius: "0.375rem" }}
      >
        <TileLayer url={tileUrl} attribution={attribution} />

        {/* 都道府県レイヤー */}
        <ChoroplethGeoJsonLayer
          geojson={prefGeojson}
          styleFactory={
            municipalityGeojson
              ? (feature?: Feature<Geometry>) => ({
                  ...prefStyle(feature),
                  fillOpacity: 0.3,
                  weight: 0.3,
                })
              : prefStyle
          }
          codeExtractor={extractPrefCode}
          nameExtractor={extractPrefName}
          onFeatureClick={onPrefectureClick}
          selectedCode={selectedPrefectureCode}
          valueFormatter={prefValueFormatter}
        />

        {/* 市区町村レイヤー（ドリルダウン時） */}
        {municipalityGeojson && muniStyle && (
          <ChoroplethGeoJsonLayer
            geojson={municipalityGeojson}
            styleFactory={muniStyle}
            codeExtractor={extractCityCode}
            nameExtractor={extractCityName}
            onFeatureClick={onMunicipalityClick}
            valueFormatter={muniValueFormatter}
          />
        )}

        <MapColorLegend
          colorConfig={legendConfig}
          data={legendData}
          unit={unit}
          valueDisplay={valueDisplay}
        />
      </MapContainer>
    </div>
  );
}
