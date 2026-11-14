"use client";

import { resolveColorEncoding } from '@stats47/types';
import { cn } from "@stats47/components";
import { select, scaleBand, interpolateRgb } from "d3";
import { useEffect, useRef } from "react";
import { computeChartLayout, computeMarginsByRatio, estimateTextWidth, thinTickLabels } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import { useReadableFontSize } from "../../hooks/useReadableFontSize";
import type { CategoryHeatmapProps } from "./types";
import { fitSvgViewBox } from "../../utils/fit-svg-viewbox";

/** 等倍表示の文字サイズ (viewBox 単位) */
const BASE_FONT_SIZE = 10;

/**
 * CategoryHeatmap — 年×品目のヒートマップ
 *
 * Observable @mbostock/electric-usage-2019 を参考に、
 * 時系列×カテゴリの2次元で値の変化を色濃度で表示する。
 */
export function CategoryHeatmap({
  data,
  baseline = 100,
  positiveColor = "#3b82f6",
  negativeColor = "#f97316",
  unit = "",
  width = 600,
  height = 300,
  className,
}: CategoryHeatmapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const plotRef = useRef<HTMLDivElement>(null);
  const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();

  const marginsByRatio = computeMarginsByRatio(width, height, {
    top: 24 / 300,
    right: 10 / 600,
    bottom: 8 / 300,
    left: 100 / 600,
  });

  const layout = computeChartLayout(width, height, {
    marginTop: marginsByRatio.marginTop,
    marginRight: marginsByRatio.marginRight,
    marginBottom: marginsByRatio.marginBottom,
    marginLeft: marginsByRatio.marginLeft,
  });

  const xLabels = [...new Set(data.map((item) => item.x))];
  const yLabels = [...new Set(data.map((item) => item.y))];

  // 縮小表示でも画面上で読める文字サイズ (viewBox 単位)。等倍以上なら従来の 10 のまま
  // (2026-11-14 CHART-AXIS-READABILITY-01。375px で 3.9px だった)
  const fontSize = useReadableFontSize(plotRef, width, BASE_FONT_SIZE);
  // 品目名が左端で切れない左余白と、年のラベルが上端で切れない上余白を文字サイズから決める
  const marginLeft = Math.max(
    layout.marginLeft,
    Math.ceil(Math.max(0, ...yLabels.map((label) => estimateTextWidth(label, fontSize))) + 10),
  );
  const marginTop = Math.max(layout.marginTop, Math.ceil(fontSize * 1.5));
  const innerWidth = width - marginLeft - layout.marginRight;
  // 行の高さが文字より低いときは viewBox を縦に伸ばす (品目名を重ねない)
  const innerHeight = Math.max(layout.innerHeight, yLabels.length * fontSize * 1.4);
  const drawHeight = marginTop + innerHeight + layout.marginBottom;
  const accessibleLabel = [
    "カテゴリヒートマップ",
    `横軸: ${xLabels.join("、")}`,
    `縦軸: ${yLabels.join("、")}`,
    `基準値: ${baseline}${unit}`,
  ].join("。");

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const svg = select(svgRef.current);
    svg.selectAll("*").remove();

    // X/Y ドメイン
    const xLabels = [...new Set(data.map((d) => d.x))];
    const yLabels = [...new Set(data.map((d) => d.y))];

    const x = scaleBand().domain(xLabels).range([0, innerWidth]).padding(0.05);
    const y = scaleBand().domain(yLabels).range([0, innerHeight]).padding(0.05);

    // 色スケール（基準値を中心にした diverging）
    const values = data.map((d) => d.value);
    const colorScale = resolveColorEncoding(
      { colorSchemeType: 'diverging', divergingMidpoint: baseline, isSymmetrized: true },
      values,
      (position) => {
        const t = position * 2 - 1;
        if (Math.abs(t) < 0.05) return 'hsl(var(--muted))';
        return t > 0
          ? interpolateRgb('#dbeafe', positiveColor)(t)
          : interpolateRgb('#ffedd5', negativeColor)(-t);
      },
      'hsl(var(--muted))',
    );
    if (!colorScale.domain) return;
    const getColor = colorScale.colorAtValue;
    const maxDeviation = colorScale.domain[1] - baseline;

    const g = svg
      .append("g")
      .attr("transform", `translate(${marginLeft},${marginTop})`);

    // X軸ラベル（上部、年）。文字を大きくして重なるときは等間隔に間引く (最新の年は残す)
    const xTickLabels = thinTickLabels(
      xLabels.map((label) => ({
        value: label,
        label: label.replace("年", ""),
        position: x(label)! + x.bandwidth() / 2,
      })),
      fontSize,
    ).map((tick) => tick.value);
    g.append("g")
      .selectAll("text")
      .data(xTickLabels)
      .join("text")
      .attr("x", (d) => x(d)! + x.bandwidth() / 2)
      .attr("y", -4)
      .attr("text-anchor", "middle")
      .attr("fill", "hsl(var(--muted-foreground))")
      .attr("font-size", fontSize)
      .text((d) => d.replace("年", ""));

    // Y軸ラベル（左側、品目）
    g.append("g")
      .selectAll("text")
      .data(yLabels)
      .join("text")
      .attr("x", -6)
      .attr("y", (d) => y(d)! + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", "end")
      .attr("fill", "hsl(var(--foreground))")
      .attr("font-size", fontSize)
      .text((d) => d);

    // セル
    g.selectAll("rect")
      .data(data)
      .join("rect")
      .attr("x", (d) => x(d.x)!)
      .attr("y", (d) => y(d.y)!)
      .attr("width", x.bandwidth())
      .attr("height", y.bandwidth())
      .attr("rx", 2)
      .attr("fill", (d) => getColor(d.value))
      .attr("stroke", "hsl(var(--background))")
      .attr("stroke-width", 1)
      .on("mouseenter", function (event, d) {
        select(this).attr("stroke", "hsl(var(--foreground))").attr("stroke-width", 2);
        const diff = d.value - baseline;
        const sign = diff >= 0 ? "+" : "";
        showTooltip(event, d.y, {
          value: d.value,
          metricTitle: `${d.x} / 全国平均比: ${sign}${diff.toFixed(1)}`,
          unit,
        });
      })
      .on("mousemove", (event) => updateTooltipPosition(event))
      .on("mouseleave", function () {
        select(this).attr("stroke", "hsl(var(--background))").attr("stroke-width", 1);
        hideTooltip();
      });

    // セル内に値テキスト。読める大きさの文字が入るときだけ書き、入らない狭い幅ではツールチップに任せる
    const widestCellText = Math.max(0, ...data.map((d) => estimateTextWidth(d.value.toFixed(1), fontSize)));
    if (x.bandwidth() >= widestCellText + 4 && y.bandwidth() >= fontSize * 1.2) {
      g.selectAll(".cell-text")
        .data(data)
        .join("text")
        .attr("class", "cell-text")
        .attr("x", (d) => x(d.x)! + x.bandwidth() / 2)
        .attr("y", (d) => y(d.y)! + y.bandwidth() / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .attr("fill", (d) => {
          const t = Math.abs((d.value - baseline) / maxDeviation);
          return t > 0.6 ? "#fff" : "hsl(var(--foreground))";
        })
        .attr("font-size", fontSize)
        .text((d) => d.value.toFixed(1));
    }

    fitSvgViewBox(svgRef.current, width, drawHeight);
  }, [data, baseline, positiveColor, negativeColor, unit, width, drawHeight, fontSize, innerWidth, innerHeight, marginTop, marginLeft, showTooltip, hideTooltip, updateTooltipPosition]);

  if (data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center min-h-[200px] text-sm text-muted-foreground", className)}>
        データがありません
      </div>
    );
  }

  return (
    <div ref={plotRef} className={cn("relative", className)}>
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`0 0 ${width} ${drawHeight}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={accessibleLabel}
      />
    </div>
  );
}
