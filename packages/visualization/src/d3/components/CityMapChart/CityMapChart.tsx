/**
 * 市区町村コロプレスマップコンポーネント
 *
 * D3.js を使用した市区町村別コロプレスマップ。
 * 都道府県内の市区町村を塗り分けて統計データを可視化する。
 *
 * ## 機能
 * - コロプレス（階級区分）地図の描画
 * - カラーレジェンド（凡例）表示
 * - ツールチップ（市区町村名・値）
 * - ズーム/パン（d3-zoom）
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { logger } from "@stats47/logger";

import { resolveChoroplethScale } from "../../utils/color-scale/resolve-choropleth-scale";
import { ChoroplethLegend, type ResolvedChoroplethScale } from "../ChoroplethLegend";
import type { D3Module, TopojsonModule } from "../../types/d3";
import type { MapDataPoint } from "../../types/map-chart";
import type { MapVisualizationConfig } from "../../types/map-chart";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";

import type { Feature, FeatureCollection } from "geojson";
import { DEFAULT_PREFECTURE_MAP_PROPS } from "../../constants/map-constants";

/** viewBox の固定サイズ */
const VIEWBOX_WIDTH = 600;
const VIEWBOX_HEIGHT = 480;
const PADDING = 20;

/** カラーレジェンドの設定 */

/** 市区町村 Feature 型 */
interface CityFeature extends Feature {
  properties: {
    /** 市区町村コード（e.g. "13101"） */
    cityCode: string;
    /** 市区町村名（e.g. "千代田区"） */
    cityName: string;
    /** 統計値 */
    value?: number | null;
    [key: string]: unknown;
  };
}

type ColorMapper = ((areaCode: string) => string) | null;

export interface CityMapChartProps {
  /** 統計データ */
  data: MapDataPoint[];
  /** カラー設定 */
  colorConfig: MapVisualizationConfig;
  /** TopoJSONデータ */
  topology: import("@stats47/types").TopoJSONTopology;
  /** 値の単位（ツールチップで表示） */
  unit?: string;
  /** 市区町村クリック時のコールバック */
  onCityClick?: (areaCode: string) => void;
  /** 選択中の市区町村コード */
  selectedCityCode?: string;
  /**
   * 投影フィット (fitExtent) の計算から除外する市区町村コード。
   * 東京の小笠原諸島のような遠隔離島を含む県で本土が極小になるのを防ぐ。
   * 描画からは除外しない (離島はキャンバス外に描かれ、パン/ズームで到達できる)。
   */
  fitExcludeCodes?: string[];
}

export function CityMapChart({
  data,
  colorConfig,
  topology,
  unit = "",
  onCityClick,
  selectedCityCode,
  fitExcludeCodes,
}: CityMapChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, updateTooltipPosition, hideTooltip } = useD3Tooltip();

  const [d3Module, setD3Module] = useState<D3Module | null>(null);
  const [topojsonModule, setTopojsonModule] = useState<TopojsonModule | null>(null);
  const [colorMapper, setColorMapper] = useState<ColorMapper>(null);
  const [colorScale, setColorScale] = useState<ResolvedChoroplethScale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. ライブラリ読み込み
  const loadLibraries = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [d3, topojson] = await Promise.all([
        import("d3"),
        import("topojson-client"),
      ]);

      setD3Module(d3);
      setTopojsonModule(topojson);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "ライブラリの読み込みに失敗しました";

      logger.error(
        {
          error: errorMessage,
          errorStack: err instanceof Error ? err.stack : undefined,
        },
        "[CityMapChart] Failed to load libraries"
      );

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLibraries();
  }, [loadLibraries]);

  // 2. カラーマッパー生成
  useEffect(() => {
    if (!d3Module || !data) {
      setColorMapper(null);
      return;
    }

    let isMounted = true;

    const generateColorMapper = async () => {
      const resolved = await resolveChoroplethScale(colorConfig, data);
      const valueByCode = new Map(data.map(point => [point.areaCode, point.value]));
      const mapper = (code: string) => {const value = valueByCode.get(code); return value === undefined ? resolved.noDataColor : resolved.colorAtValue(value);};
      if (isMounted) {
        setColorMapper(() => mapper);
        setColorScale(resolved);
      }
    };

    generateColorMapper();

    return () => {
      isMounted = false;
    };
  }, [d3Module, data, colorConfig]);

  // 3. 市区町村 Feature 準備
  const geojson = useMemo<CityFeature[] | null>(() => {
    if (!topojsonModule || !topology) return null;
    try {
      const objectName = Object.keys(topology.objects)[0];
      if (!objectName) return null;

      const featureCollection = topojsonModule.feature(
        topology as Parameters<typeof topojsonModule.feature>[0],
        topology.objects[objectName] as Parameters<typeof topojsonModule.feature>[1]
      ) as FeatureCollection;

      const dataMap = new Map(data.map((d) => [d.areaCode, d.value]));

      return featureCollection.features.map((feature: Feature) => {
        const properties = feature.properties || {};

        // N03_007: MLIT の市区町村コード
        const cityCode = String(properties.N03_007 || properties.areaCode || properties.cityCode || "");
        const cityName = String(
          properties.N03_004 || properties.cityName || properties.name || "不明"
        );

        return {
          ...feature,
          properties: {
            ...properties,
            cityCode,
            cityName,
            value: dataMap.get(cityCode) ?? null,
          },
        } as CityFeature;
      });
    } catch {
      return null;
    }
  }, [topojsonModule, topology, data]);

  // 4. 描画
  useEffect(() => {
    if (!d3Module || !geojson || !colorMapper || !svgRef.current) {
      return;
    }

    const svg = d3Module.select(svgRef.current);
    svg.selectAll("*").remove();

    // Projection: fitExtent で自動フィット。fitExcludeCodes は fit 計算からだけ外す
    // (全 feature が除外対象なら従来どおり全体で fit する)
    const fitExclude = new Set(fitExcludeCodes ?? []);
    const fitCandidates =
      fitExclude.size > 0
        ? geojson.filter((f) => !fitExclude.has(f.properties.cityCode))
        : geojson;
    const fitFeatures = fitCandidates.length > 0 ? fitCandidates : geojson;
    const projection = d3Module.geoMercator().fitExtent(
      [
        [PADDING, PADDING],
        [VIEWBOX_WIDTH - PADDING, VIEWBOX_HEIGHT - PADDING - 40],
      ],
      { type: "FeatureCollection", features: fitFeatures } as any
    );

    const pathGenerator = d3Module.geoPath().projection(projection);

    // メイングループ（ズーム対象）
    const mapGroup = svg.append("g").attr("class", "map-group");

    // 市区町村パスの描画
    const paths = mapGroup
      .selectAll("path")
      .data(geojson)
      .enter()
      .append("path")
      .attr("d", pathGenerator as (d: CityFeature) => string)
      .attr("fill", (d) => {
        return colorMapper?.(d.properties.cityCode) ?? DEFAULT_PREFECTURE_MAP_PROPS.noDataFillColor;
      })
      .attr("stroke", (d) =>
        d.properties.cityCode === selectedCityCode ? "#3b82f6" : "#94a3b8"
      )
      .attr("stroke-width", (d) =>
        d.properties.cityCode === selectedCityCode ? 2 : 0.5
      )
      .style("cursor", onCityClick ? "pointer" : "default");

    // ズーム/パン設定
    const zoom = d3Module
      .zoom()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [VIEWBOX_WIDTH, VIEWBOX_HEIGHT],
      ])
      .on("zoom", (event: any) => {
        mapGroup.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // ダブルクリックでズームリセット
    svg.on("dblclick.zoom", () => {
      svg
        .transition()
        .duration(500)
        .call(zoom.transform as any, d3Module.zoomIdentity);
    });

    // インタラクション
    paths
      .on("mouseenter", function (event, d) {
        if (d.properties.cityCode !== selectedCityCode) {
          d3Module.select(this).attr("stroke", "#3b82f6").attr("stroke-width", 2);
        }
        showTooltip(event, d.properties.cityName, {
          value: d.properties.value,
          unit,
        });
      })
      .on("mousemove", function (event) {
        updateTooltipPosition(event);
      })
      .on("mouseleave", function (_event, d) {
        if (d.properties.cityCode !== selectedCityCode) {
          d3Module
            .select(this)
            .attr("stroke", "#94a3b8")
            .attr("stroke-width", 0.5);
        }
        hideTooltip();
      })
      .on("click", (_event, d) => {
        onCityClick?.(d.properties.cityCode);
      });

  }, [
    d3Module,
    geojson,
    colorMapper,
    onCityClick,
    selectedCityCode,
    data,
    unit,
    fitExcludeCodes,
    showTooltip,
    updateTooltipPosition,
    hideTooltip,
  ]);

  // レンダリング
  if (isLoading) {
    return (
      <div
        className="relative w-full"
        style={{ aspectRatio: `${VIEWBOX_WIDTH} / ${VIEWBOX_HEIGHT}` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="relative w-full"
        style={{ aspectRatio: `${VIEWBOX_WIDTH} / ${VIEWBOX_HEIGHT}` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-negative mb-2 font-semibold">
              地図の読み込みに失敗しました
            </p>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full overflow-hidden">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        style={{ touchAction: "none" }}
        role="img"
        aria-label={`市区町村別コロプレス地図。データ数: ${data.length}。単位: ${unit || "未設定"}`}
      />
      <ChoroplethLegend scale={colorScale} unit={unit}/>
    </div>
  );
}
