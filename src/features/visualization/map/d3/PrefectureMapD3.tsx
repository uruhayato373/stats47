/**
 * 地図描画ドメイン - D3.js実装
 * 都道府県地図のD3.js実装
 */

"use client";

import * as d3 from "d3";
import { useCallback, useEffect, useRef, useState } from "react";

import { GeoshapeService } from "@/features/gis/geoshape/services/geoshape-service";
import type { PrefectureFeature } from "@/features/gis/geoshape/types";
import type { MapConfig, MapState } from "../types";

interface PrefectureMapD3Props extends MapConfig {
  /** 地図の幅（デフォルト: 800） */
  width?: number;
  /** 地図の高さ（デフォルト: 600） */
  height?: number;
  /** CSSクラス名 */
  className?: string;
}

export function PrefectureMapD3({
  width = 800,
  height = 600,
  className,
  center = [137, 38],
  zoom = 1,
  projection = "mercator",
  fillColor = "#e0e0e0",
  strokeColor = "#ffffff",
  strokeWidth = 1,
  hoverColor = "#3b82f6",
  selectedColor = "#1d4ed8",
  labelFontSize = 12,
  labelColor = "#374151",
  enableAnimation = true,
  animationDuration = 300,
  onPrefectureClick,
  onPrefectureHover,
  onMapClick,
  onZoom,
  onPan,
}: PrefectureMapD3Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [mapState, setMapState] = useState<MapState>({
    zoom: zoom,
    center: center,
    selectedPrefecture: null,
    hoveredPrefecture: null,
    isLoading: true,
    error: null,
  });

  // 投影法を設定
  const createProjection = useCallback(() => {
    const projectionMap = {
      mercator: d3.geoMercator(),
      albers: d3.geoAlbers(),
      equalEarth: d3.geoEqualEarth(),
    };

    const proj = projectionMap[projection]
      .center(center)
      .scale(1200 * zoom)
      .translate([width / 2, height / 2]);

    return proj;
  }, [projection, center, zoom, width, height]);

  // 地図を描画
  const renderMap = useCallback(async () => {
    if (!svgRef.current) return;

    setMapState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // GeoJSONデータを取得
      const geojson = await GeoshapeService.getPrefectureFeatures({
        resolution: "low",
        useCache: true,
      });

      const svg = d3.select(svgRef.current);

      // 既存の要素をクリア
      svg.selectAll("*").remove();

      // 投影法とパス生成器を設定
      const projection = createProjection();
      const path = d3.geoPath().projection(projection);

      // ズーム動作を設定
      const zoomBehavior = d3
        .zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.5, 8])
        .on("zoom", (event) => {
          const { transform } = event;
          const newZoom = transform.k;
          const newCenter: [number, number] = [
            projection.center()[0] + (width / 2 - transform.x) / transform.k,
            projection.center()[1] + (height / 2 - transform.y) / transform.k,
          ];

          setMapState((prev) => ({
            ...prev,
            zoom: newZoom,
            center: newCenter,
          }));

          // 投影法を更新
          projection.scale(1200 * newZoom);
          projection.translate([transform.x, transform.y]);

          // パスを再描画
          svg.selectAll("path").attr("d", path);

          svg.selectAll("text").attr("transform", (d) => {
            const centroid = path.centroid(d as any);
            return `translate(${centroid[0]},${centroid[1]})`;
          });

          onZoom?.(newZoom);
          onPan?.(newCenter);
        });

      svg.call(zoomBehavior);

      // 都道府県境界を描画
      const prefecturePaths = svg
        .selectAll("path.prefecture")
        .data(geojson.features)
        .enter()
        .append("path")
        .attr("class", "prefecture")
        .attr("d", path)
        .attr("fill", fillColor)
        .attr("stroke", strokeColor)
        .attr("stroke-width", strokeWidth)
        .style("cursor", "pointer")
        .on("mouseover", function (event, d) {
          if (enableAnimation) {
            d3.select(this)
              .transition()
              .duration(animationDuration)
              .attr("fill", hoverColor);
          } else {
            d3.select(this).attr("fill", hoverColor);
          }

          setMapState((prev) => ({
            ...prev,
            hoveredPrefecture: d as PrefectureFeature,
          }));
          onPrefectureHover?.(d as PrefectureFeature);
        })
        .on("mouseout", function (event, d) {
          if (enableAnimation) {
            d3.select(this)
              .transition()
              .duration(animationDuration)
              .attr("fill", fillColor);
          } else {
            d3.select(this).attr("fill", fillColor);
          }

          setMapState((prev) => ({ ...prev, hoveredPrefecture: null }));
          onPrefectureHover?.(null);
        })
        .on("click", function (event, d) {
          const feature = d as PrefectureFeature;

          // 選択状態を更新
          setMapState((prev) => ({
            ...prev,
            selectedPrefecture:
              prev.selectedPrefecture?.properties.prefCode ===
              feature.properties.prefCode
                ? null
                : feature,
          }));

          // 選択された都道府県の色を変更
          svg.selectAll("path.prefecture").attr("fill", (pathData) => {
            const pathFeature = pathData as PrefectureFeature;
            if (
              pathFeature.properties.prefCode === feature.properties.prefCode
            ) {
              return mapState.selectedPrefecture?.properties.prefCode ===
                feature.properties.prefCode
                ? selectedColor
                : fillColor;
            }
            return fillColor;
          });

          onPrefectureClick?.(feature);
        });

      // 都道府県名ラベルを描画
      svg
        .selectAll("text.prefecture-label")
        .data(geojson.features)
        .enter()
        .append("text")
        .attr("class", "prefecture-label")
        .attr("font-size", labelFontSize)
        .attr("fill", labelColor)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .attr("transform", (d) => {
          const centroid = path.centroid(d as any);
          return `translate(${centroid[0]},${centroid[1]})`;
        })
        .text((d) => (d as PrefectureFeature).properties.prefName)
        .style("pointer-events", "none");

      // 地図クリックイベント
      svg.on("click", (event) => {
        if (event.target === svg.node()) {
          onMapClick?.(event);
        }
      });

      setMapState((prev) => ({ ...prev, isLoading: false, error: null }));
    } catch (error) {
      console.error("[PrefectureMapD3] Failed to render map:", error);
      setMapState((prev) => ({
        ...prev,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "地図の読み込みに失敗しました",
      }));
    }
  }, [
    width,
    height,
    center,
    zoom,
    projection,
    fillColor,
    strokeColor,
    strokeWidth,
    hoverColor,
    selectedColor,
    labelFontSize,
    labelColor,
    enableAnimation,
    animationDuration,
    onPrefectureClick,
    onPrefectureHover,
    onMapClick,
    onZoom,
    onPan,
    createProjection,
  ]);

  // 初期化
  useEffect(() => {
    renderMap();
  }, [renderMap]);

  // ズームリセット
  const resetZoom = useCallback(() => {
    if (svgRef.current) {
      const svg = d3.select(svgRef.current);
      svg
        .transition()
        .duration(animationDuration)
        .call(
          d3.zoom<SVGSVGElement, unknown>().transform,
          d3.zoomIdentity.scale(1).translate(0, 0)
        );
    }
  }, [animationDuration]);

  if (mapState.error) {
    return (
      <div
        className={`flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <p className="text-red-500 mb-2">地図の読み込みに失敗しました</p>
          <p className="text-sm text-gray-500">{mapState.error}</p>
          <button
            onClick={renderMap}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {mapState.isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">地図を読み込んでいます...</p>
          </div>
        </div>
      )}

      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="border border-gray-200 rounded-lg"
      />

      {/* ズームリセットボタン */}
      <button
        onClick={resetZoom}
        className="absolute top-2 right-2 px-3 py-1 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 text-sm"
        disabled={mapState.isLoading}
      >
        リセット
      </button>
    </div>
  );
}
