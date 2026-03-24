/**
 * 地図描画 - 都道府県地図コンポーネント
 *
 * D3.js を使用した都道府県別コロプレスマップ。
 *
 * ## 機能
 * - コロプレス（階級区分）地図の描画
 * - カラーレジェンド（凡例）表示
 * - ツールチップ（カード内クランプ対応）
 * - ズーム/パン（d3-zoom）
 * - 北海道・沖縄シフトモード（トグル切り替え）
 * - 初期アニメーション（フェードイン）
 */

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { logger } from "@stats47/logger";


import { createChoroplethColorMapper } from "../../utils/color-scale/create-choropleth-color-mapper";
import { getThemeColors } from "../../utils/get-theme-colors";
import { preparePrefectureFeatures } from "../../utils/geojson/prepare-prefecture-features";
import type { D3Module, TopojsonModule } from "../../types/d3";
import type { MapDataPoint, PrefectureFeature, PrefectureMapProps } from "../../types/map-chart";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";

/** アスペクト比（幅:高さ = 1:1.2） */
const DEFAULT_ASPECT_RATIO = 1.2;

/** 通常モードの投影パラメータ */
const NORMAL_CENTER: [number, number] = [137, 38];
const NORMAL_SCALE = 1900;

/** シフトモードの投影パラメータ（北海道南西・沖縄北東シフト） */
const SHIFTED_CENTER: [number, number] = [137, 36];
const SHIFTED_SCALE = 1800;

/** viewBox の固定サイズ */
const VIEWBOX_WIDTH = 600;
const VIEWBOX_HEIGHT = VIEWBOX_WIDTH * DEFAULT_ASPECT_RATIO;

/** 北海道・沖縄のシフト量（シフトモード時） */
const HOKKAIDO_SHIFT = { x: -300, y: 100 };
const OKINAWA_SHIFT = { x: 500, y: -250 };

/** カラーレジェンドの設定 */
const LEGEND_HEIGHT = 12;
const LEGEND_WIDTH = 200;
const LEGEND_MARGIN_TOP = 16;

/**
 * カラーマッパー関数の型
 */
type ColorMapper = ((areaCode: string) => string) | null;

export function PrefectureMapChart({
  data,
  colorConfig,
  topology,
  onPrefectureClick,
  selectedPrefectureCode,
  width: propsWidth,
  height: propsHeight,
  unit = "",
  enableShiftMode = false,
}: PrefectureMapProps & { enableShiftMode?: boolean }) {
  const width = propsWidth ?? VIEWBOX_WIDTH;
  const height =
    propsHeight ?? (propsWidth ? propsWidth * DEFAULT_ASPECT_RATIO : VIEWBOX_HEIGHT);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<any>(null);
  const { showTooltip, updateTooltipPosition, hideTooltip } = useD3Tooltip();

  // 1. ライブラリ読み込み（D3.js、TopoJSONクライアント）
  const [d3Module, setD3Module] = useState<D3Module | null>(null);
  const [topojsonModule, setTopojsonModule] = useState<TopojsonModule | null>(null);
  const [colorMapper, setColorMapper] = useState<ColorMapper>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isShifted, setIsShifted] = useState(false);

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
      setError(null);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "ライブラリの読み込みに失敗しました";

      logger.error(
        {
          error: errorMessage,
          errorStack: err instanceof Error ? err.stack : undefined,
          errorName: err instanceof Error ? err.name : "UnknownError",
        },
        "[PrefectureMapChart] Failed to load libraries"
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
      const mapper = await createChoroplethColorMapper(colorConfig, data);
      if (isMounted) {
        setColorMapper(() => mapper);
      }
    };

    generateColorMapper();

    return () => {
      isMounted = false;
    };
  }, [d3Module, data, colorConfig]);

  // 3. 都道府県 Feature 準備
  const geojson = useMemo<PrefectureFeature[] | null>(() => {
    if (!topojsonModule || !topology) return null;
    try {
      const dataMap = new Map(data.map((d) => [d.areaCode, d.value]));
      const features = preparePrefectureFeatures(topojsonModule, topology);
      features.forEach((feature) => {
        feature.properties.value =
          dataMap.get(feature.properties.prefCode) ?? null;
      });
      return features;
    } catch {
      return null;
    }
  }, [topojsonModule, topology, data]);

  // 4. 投影法計算
  const projection = useMemo(() => {
    if (!d3Module || !geojson) return null;
    const center = isShifted ? SHIFTED_CENTER : NORMAL_CENTER;
    const scale = isShifted ? SHIFTED_SCALE : NORMAL_SCALE;
    return d3Module
      .geoMercator()
      .center(center)
      .scale(scale * (width / VIEWBOX_WIDTH))
      .translate([width / 2, height / 2]);
  }, [d3Module, geojson, isShifted, width, height]);



  // 6. 描画
  useEffect(() => {
    if (!d3Module || !geojson || !projection || !colorMapper || !svgRef.current) {
      return;
    }

    const themeColors = getThemeColors();

    const svg = d3Module.select(svgRef.current);
    svg.selectAll("*").remove();

    const pathGenerator = d3Module.geoPath().projection(projection);

    // メイングループ（ズーム対象）
    const mapGroup = svg.append("g").attr("class", "map-group");

    // 都道府県パスの描画
    const paths = mapGroup
      .selectAll("path")
      .data(geojson)
      .enter()
      .append("path")
      .attr("d", pathGenerator as (d: PrefectureFeature) => string)
      .attr("fill", (d) => {
        const areaCode = d.properties.prefCode;
        return colorMapper?.(areaCode) ?? themeColors.muted;
      })
      .attr("stroke", (d) =>
        d.properties.prefCode === selectedPrefectureCode ? "#3b82f6" : themeColors.border
      )
      .attr("stroke-width", (d) =>
        d.properties.prefCode === selectedPrefectureCode ? 2 : 0.5
      )
      .style("cursor", "pointer");

    // 北海道・沖縄シフト（シフトモード有効時）
    if (isShifted) {
      paths.attr("transform", (d) => {
        const code = d.properties.prefCode;
        if (code === "01000") {
          return `translate(${HOKKAIDO_SHIFT.x}, ${HOKKAIDO_SHIFT.y})`;
        }
        if (code === "47000") {
          return `translate(${OKINAWA_SHIFT.x}, ${OKINAWA_SHIFT.y})`;
        }
        return "";
      });
    }

    // 即時表示（アニメーションなし）
    mapGroup.attr("opacity", 1).attr("transform", "translate(0, 0) scale(1)");

    // ズーム/パン設定（d3-zoom）
    const zoom = d3Module
      .zoom()
      .scaleExtent([1, 8])
      .translateExtent([
        [0, 0],
        [width, height],
      ])
      .on("zoom", (event: any) => {
        mapGroup.attr("transform", event.transform);
      });

    svg.call(zoom as any);
    zoomRef.current = zoom;

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
        if (d.properties.prefCode !== selectedPrefectureCode) {
          d3Module.select(this).attr("stroke", "#3b82f6").attr("stroke-width", 2);
        }
        showTooltip(event, d.properties.prefName, {
          value: d.properties.value,
          unit,
        });
      })
      .on("mousemove", function (event) {
        updateTooltipPosition(event);
      })
      .on("mouseleave", function (event, d) {
        if (d.properties.prefCode !== selectedPrefectureCode) {
          d3Module
            .select(this)
            .attr("stroke", themeColors.border)
            .attr("stroke-width", 0.5);
        }
        hideTooltip();
      })
      .on("click", (event, d) => {
        onPrefectureClick?.(d.properties.prefCode);
      });

    // カラーレジェンド描画
    drawColorLegend(svg, d3Module, data, colorMapper, width, height);
  }, [
    d3Module,
    geojson,
    projection,
    colorMapper,
    onPrefectureClick,
    selectedPrefectureCode,
    isShifted,
    isShifted,
    width,
    height,
    showTooltip,
    updateTooltipPosition,
    hideTooltip,
  ]);

  // レンダリング
  if (isLoading) {
    return (
      <div
        className="relative w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="relative w-full"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-2 font-semibold">
              地図の読み込みに失敗しました
            </p>
            <p className="text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden">
      {/* 北海道/沖縄シフト切り替えボタン */}
      {enableShiftMode && (
        <button
          type="button"
          onClick={() => setIsShifted((prev) => !prev)}
          className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-md px-2 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-background transition-colors"
          title={isShifted ? "通常表示に戻す" : "北海道/沖縄をシフト"}
        >
          {isShifted ? "通常表示" : "シフト表示"}
        </button>
      )}

      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
        style={{ touchAction: "none" }}
      />

    </div>
  );
}

/**
 * カラーレジェンド（凡例）を SVG 内に描画する
 */
function drawColorLegend(
  svg: any,
  d3: D3Module,
  data: MapDataPoint[],
  colorMapper: (areaCode: string) => string,
  svgWidth: number,
  svgHeight: number
) {
  const values = data.map((d) => d.value).filter((v) => v != null);
  if (values.length === 0) return;

  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  if (minVal === maxVal) return;

  const legendX = (svgWidth - LEGEND_WIDTH) / 2;
  const legendY = svgHeight - LEGEND_HEIGHT - LEGEND_MARGIN_TOP;

  const legendGroup = svg.append("g").attr("class", "legend-group");

  // グラデーション定義
  const defs = svg.append("defs");
  const gradient = defs
    .append("linearGradient")
    .attr("id", "legend-gradient")
    .attr("x1", "0%")
    .attr("x2", "100%");

  // 10 段階のカラーストップを生成
  const steps = 10;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const value = minVal + t * (maxVal - minVal);
    // 仮の areaCode を生成して colorMapper から色を取得
    const closestData = data.reduce((prev, curr) =>
      Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev
    );
    const color = colorMapper(closestData.areaCode);
    gradient
      .append("stop")
      .attr("offset", `${t * 100}%`)
      .attr("stop-color", color);
  }

  // レジェンドバー
  legendGroup
    .append("rect")
    .attr("x", legendX)
    .attr("y", legendY)
    .attr("width", LEGEND_WIDTH)
    .attr("height", LEGEND_HEIGHT)
    .attr("rx", 3)
    .style("fill", "url(#legend-gradient)")
    .attr("opacity", 1);

  // レジェンドラベル（最小値）
  legendGroup
    .append("text")
    .attr("x", legendX)
    .attr("y", legendY + LEGEND_HEIGHT + 14)
    .attr("text-anchor", "start")
    .attr("font-size", "10px")
    .attr("fill", "hsl(var(--muted-foreground))")
    .text(formatLegendValue(minVal))
    .attr("opacity", 1);

  // レジェンドラベル（最大値）
  legendGroup
    .append("text")
    .attr("x", legendX + LEGEND_WIDTH)
    .attr("y", legendY + LEGEND_HEIGHT + 14)
    .attr("text-anchor", "end")
    .attr("font-size", "10px")
    .attr("fill", "hsl(var(--muted-foreground))")
    .text(formatLegendValue(maxVal))
    .attr("opacity", 1);
}

/**
 * レジェンド値のフォーマット
 */
function formatLegendValue(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(value) >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString();
}
