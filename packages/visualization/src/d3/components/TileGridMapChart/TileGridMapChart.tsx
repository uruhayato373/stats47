"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { logger } from "@stats47/logger";

import { useD3Tooltip } from "../../hooks/useD3Tooltip";

import { createChoroplethColorMapper } from "../../utils/color-scale/create-choropleth-color-mapper";
import { getThemeColors } from "../../utils/get-theme-colors";
import { TILE_GRID_LAYOUT, type TileGridCell } from "../../constants/tile-grid-layout";
import type { D3Module } from "../../types/d3";
import type { PrefectureMapProps } from "../../types/map-chart";

interface TileGridCellWithData extends TileGridCell {
  value: number | null;
}

const DEFAULT_ASPECT_RATIO = 1.2;

type ColorMapper = ((areaCode: string) => string) | null;

export function TileGridMap({
  data,
  colorConfig,
  onPrefectureClick,
  selectedPrefectureCode,
  width: propsWidth,
  height: propsHeight,
  unit = "",
}: PrefectureMapProps) {
  const width = propsWidth ?? 600;
  const height = propsHeight ?? (propsWidth ? propsWidth * DEFAULT_ASPECT_RATIO : 900);
  const svgRef = useRef<SVGSVGElement>(null);
  const { showTooltip, updateTooltipPosition, hideTooltip } = useD3Tooltip();
  const [isClient, setIsClient] = useState(false);
  const [d3Module, setD3Module] = useState<D3Module | null>(null);
  const [colorMapper, setColorMapper] = useState<ColorMapper>(null);

  // クライアントサイドでのみレンダリング
  useEffect(() => {
    setIsClient(true);
  }, []);

  // D3モジュールの読み込み
  useEffect(() => {
    import("d3").then(setD3Module);
  }, []);

  // カラーマッパー生成
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

  const drawMap = useCallback(async () => {
    if (!svgRef.current || !d3Module || !colorMapper) return;

    try {
      // SVG をクリア
      d3Module.select(svgRef.current).selectAll("*").remove();

      // 設定
      const cellSize = (width / 600) * 40;
      const gridOffsetX = 7 * cellSize;
      const gridOffsetY = 7.5 * cellSize;
      const cx = width / 2;
      const cy = height / 2;

      const themeColors = getThemeColors();

      // データマップの作成
      const dataMap = new Map<string, number>();
      data.forEach((d) => {
        // 5桁形式のareaCodeから2桁のprefCodeを抽出（"01000" -> 1）
        const prefCode = parseInt(d.areaCode.substring(0, 2), 10);
        dataMap.set(String(prefCode), d.value);
      });

      // SVG グループを作成
      const svg = d3Module.select(svgRef.current);
      const mapGroup = svg.append("g");

      // セルデータの作成
      const cellData = TILE_GRID_LAYOUT.map((cell) => ({
        ...cell,
        value: dataMap.get(String(cell.id)) ?? null,
      }));

      // セルグループの作成
      const cells = mapGroup
        .selectAll<SVGGElement, TileGridCellWithData>(".cell-group")
        .data(cellData, (d) => d.id)
        .enter()
        .append("g")
        .attr("class", "cell-group")
        .attr("transform", (d) => {
          const x = d.x * cellSize - gridOffsetX + cx;
          const y = d.y * cellSize - gridOffsetY + cy;
          return `translate(${x}, ${y}) scale(0)`;
        });

      // 矩形を描画
      cells
        .append("rect")
        .attr("class", "pref-box")
        .attr("width", (d) => (d.w || 1) * cellSize)
        .attr("height", (d) => (d.h || 1) * cellSize)
        .attr("rx", 4)
        .attr("ry", 4)
        .attr("fill", (d) => {
          if (d.value === null) return themeColors.muted;
          // prefCode (1, 2, ..., 47) を 5桁形式のareaCode ("01000", "02000", ...) に変換
          const areaCode = String(d.id).padStart(2, "0") + "000";
          return colorMapper(areaCode);
        })
        .attr("stroke", (d) => {
          const areaCode = String(d.id).padStart(2, "0") + "000";
          return areaCode === selectedPrefectureCode ? "#3b82f6" : themeColors.border;
        })
        .attr("stroke-width", (d) => {
          const areaCode = String(d.id).padStart(2, "0") + "000";
          return areaCode === selectedPrefectureCode ? 2.5 : 1.5;
        })
        .style("cursor", "pointer");

      // 都道府県名ラベル
      cells
        .append("text")
        .attr("class", "pref-label")
        .text((d) => d.name)
        .attr("x", (d) => ((d.w || 1) * cellSize) / 2)
        .attr("y", (d) => ((d.h || 1) * cellSize) / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "central")
        .attr("fill", themeColors.text)
        .attr("font-size", `${(cellSize / 40) * 12}px`)
        .attr("font-weight", "700")
        .attr("opacity", 0)
        .style("pointer-events", "none");

      // アニメーション
      cells
        .transition()
        .duration(800)
        .ease(d3Module.easeBackOut)
        .attr("transform", (d) => {
          const x = d.x * cellSize - gridOffsetX + cx;
          const y = d.y * cellSize - gridOffsetY + cy;
          return `translate(${x}, ${y}) scale(1)`;
        });

      cells
        .select(".pref-label")
        .transition()
        .delay(300)
        .duration(500)
        .attr("opacity", 1);

      // インタラクション

      cells.select("rect").on("mouseenter", function (event, d: any) {
        const areaCode = String(d.id).padStart(2, "0") + "000";
        if (areaCode !== selectedPrefectureCode) {
          d3Module.select(this)
            .transition()
            .duration(200)
            .attr("fill", "#fff")
            .style("stroke", d.value !== null ? colorMapper(areaCode) : "#666")
            .style("stroke-width", "2.5px");
        }

        showTooltip(event, d.name, {
          value: d.value,
          unit,
        });
      });

      cells.select("rect").on("mousemove", function (event) {
        updateTooltipPosition(event);
      });

      cells.select("rect").on("mouseleave", function (event, d: any) {
        const areaCode = String(d.id).padStart(2, "0") + "000";
        if (areaCode !== selectedPrefectureCode) {
          d3Module.select(this)
            .transition()
            .duration(200)
            .attr("fill", d.value !== null ? colorMapper(areaCode) : themeColors.muted)
            .style("stroke", themeColors.border)
            .style("stroke-width", "1.5px");
        }

        hideTooltip();
      });

      cells.select("rect").on("click", (event, d: any) => {
        const areaCode = String(d.id).padStart(2, "0") + "000";
        onPrefectureClick?.(areaCode);
      });

    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        },
        "TileGridMap描画エラー"
      );
    }
  }, [d3Module, colorMapper, data, onPrefectureClick, selectedPrefectureCode, showTooltip, updateTooltipPosition, hideTooltip]);

  useEffect(() => {
    if (!isClient || !svgRef.current || !colorMapper || !d3Module) return;

    drawMap();
  }, [
    isClient,
    data,
    colorMapper,
    d3Module,
    drawMap,
  ]);

  if (!isClient) {
    return <div>読み込み中...</div>;
  }

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-auto"
      />

    </div>
  );
}