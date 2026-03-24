"use client";

import { cn } from "@stats47/components";

import { Button } from "@stats47/components";
import { getMaxDecimalPlaces, formatValueWithPrecision } from "@stats47/utils";
import * as d3 from "d3";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { computeChartLayout, computeFontSize, computeMarginsByRatio } from "../../../shared/layout";
import { useD3Tooltip } from "../../hooks/useD3Tooltip";
import type { BarChartRaceProps, RankedBarItem } from "./types";

/**
 * Bar Chart Race — 時系列でカテゴリ別の順位変動をアニメーション表示する D3 チャート
 *
 * データは `BarChartRaceFrame[]` で受け取り、Play ボタンでフレームを順に描画する。
 * 各フレームで items を value 降順にソートし、上位 topN 件を棒グラフで表示する。
 */
export function BarChartRace({
    data,
    width = 800,
    height = 500,
    marginTop: propsMarginTop,
    marginRight: propsMarginRight,
    marginBottom: propsMarginBottom,
    marginLeft: propsMarginLeft,
    topN = 10,
    duration = 750,
    title,
    unit = "",
    className,
    isLoading = false,
    decimalPlaces: propDecimalPlaces,
}: BarChartRaceProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const svgWrapperRef = useRef<HTMLDivElement>(null);
    const updateRef = useRef<((index: number) => void) | null>(null);
    const { showTooltip, hideTooltip, updateTooltipPosition } = useD3Tooltip();
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentDate, setCurrentDate] = useState<string>("");
    const timerRef = useRef<d3.Timer | null>(null);
    const dateIndexRef = useRef(0);

    // --- コンテナサイズ測定 → viewBox に反映 ---
    const [measuredSize, setMeasuredSize] = useState<{ w: number; h: number } | null>(null);
    useLayoutEffect(() => {
        const el = svgWrapperRef.current;
        if (!el) return;
        const observer = new ResizeObserver((entries) => {
            const { width: w, height: h } = entries[0].contentRect;
            if (w > 0 && h > 0) setMeasuredSize({ w, h });
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // props のサイズをフォールバックに使用
    const viewWidth = measuredSize?.w ?? width;
    const viewHeight = measuredSize?.h ?? height;

    // --- 小数桁数の決定（props 優先、未指定時はデータから自動検出） ---
    const decimalPlaces = useMemo(() => {
        if (propDecimalPlaces !== undefined) return propDecimalPlaces;
        const allValues = data.flatMap((f) => f.items.map((i) => i.value));
        return getMaxDecimalPlaces(allValues);
    }, [propDecimalPlaces, data]);

    const formatValue = useMemo(
        () => (v: number) => formatValueWithPrecision(v, decimalPlaces),
        [decimalPlaces],
    );

    // --- レイアウト計算 ---
    const marginsByRatio = computeMarginsByRatio(viewWidth, viewHeight, {
        top: 30 / 500,     // 0.06
        right: 30 / 800,   // 0.0375
        bottom: 30 / 500,  // 0.06
        left: 100 / 800,   // 0.125
    });

    const layout = computeChartLayout(viewWidth, viewHeight, {
        marginTop: propsMarginTop ?? marginsByRatio.marginTop,
        marginRight: propsMarginRight ?? marginsByRatio.marginRight,
        marginBottom: propsMarginBottom ?? marginsByRatio.marginBottom,
        marginLeft: propsMarginLeft ?? marginsByRatio.marginLeft,
    });

    const { innerWidth, innerHeight, marginTop, marginLeft, marginRight, marginBottom } = layout;
    const dateLabelFontSize = computeFontSize(viewWidth, viewHeight, 0.06, 12);
    const axisFontSize = computeFontSize(viewWidth, viewHeight, 0.02);

    // Initialize
    useEffect(() => {
        if (data.length > 0) {
            setCurrentDate(data[0].date);
            dateIndexRef.current = 0;
        }
    }, [data]);

    // D3 Render Logic
    useEffect(() => {
        if (!svgRef.current || data.length === 0) return;

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        // 値ラベルの最大文字幅を事前計算し、バー領域から除外する
        const allValues = data.flatMap((f) => f.items.map((i) => i.value));
        const maxVal = d3.max(allValues) ?? 1;
        const maxLabelText = formatValue(maxVal);
        // 一時的な <text> で実測
        const tempText = svg.append("text")
            .attr("font-size", axisFontSize)
            .text(maxLabelText);
        const labelWidth = (tempText.node()?.getComputedTextLength() ?? maxLabelText.length * axisFontSize * 0.6) + 12; // 12 = gap (6px) + 余白
        tempText.remove();

        const globalMax = maxVal;
        const x = d3.scaleLinear([0, globalMax], [marginLeft, viewWidth - marginRight - labelWidth]);
        const barsTop = marginTop;
        const barsBottom = barsTop + innerHeight * 0.9;
        const y = d3
            .scaleBand()
            .domain(d3.range(topN).map((n) => n.toString()))
            .rangeRound([barsTop, barsBottom])
            .padding(0.1);

        // Color scale — collect all unique names across all frames for consistent colors
        const allNames = Array.from(new Set(data.flatMap((d) => d.items.map((i) => i.name))));
        const color = d3.scaleOrdinal(d3.schemeTableau10).domain(allNames);

        // ClipPath: バー領域のみに描画を制限（exit 要素が下にはみ出さないよう barsBottom + 1バー分で切る）
        const clipId = `bar-race-clip-${Math.random().toString(36).slice(2, 8)}`;
        svg.append("defs")
            .append("clipPath")
            .attr("id", clipId)
            .append("rect")
            .attr("x", 0)
            .attr("y", barsTop)
            .attr("width", viewWidth)
            .attr("height", barsBottom - barsTop + y.bandwidth());

        const g = svg.append("g").attr("clip-path", `url(#${clipId})`);

        // Date Label (large watermark in bottom-right)
        const dateLabel = svg
            .append("text")
            .attr("class", "date-label")
            .attr("text-anchor", "end")
            .attr("x", viewWidth - marginRight)
            .attr("y", viewHeight - marginBottom)
            .attr("dy", "0.35em")
            .style("font-size", `${dateLabelFontSize}px`)
            .style("font-weight", "bold")
            .style("fill", "#ccc")
            .text(currentDate);

        /** ランク付きデータを Y 座標に変換するヘルパー */
        const yPos = (d: RankedBarItem) => y(d.rank.toString())!;
        const yCenter = (d: RankedBarItem) => yPos(d) + y.bandwidth() / 2 + 1;
        const yExit = barsBottom + y.bandwidth();

        /**
         * 指定フレームインデックスのデータで D3 を更新する
         */
        const update = (frameIndex: number) => {
            const index = Math.floor(frameIndex);
            const frameData = data[index];
            if (!frameData) return;

            setCurrentDate(frameData.date);
            dateLabel.text(frameData.date);

            // ソート → 上位 topN 件を切り出し → rank を付与
            const rankedItems: RankedBarItem[] = [...frameData.items]
                .sort((a, b) => b.value - a.value)
                .slice(0, topN)
                .map((item, i) => ({ ...item, rank: i }));

            // --- Bars ---
            const bars = g
                .selectAll<SVGRectElement, RankedBarItem>("rect")
                .data(rankedItems, (d) => d.name);

            bars
                .enter()
                .append("rect")
                .attr("fill", (d) => color(d.name))
                .attr("x", x(0))
                .attr("y", (d) => yPos(d))
                .attr("height", y.bandwidth())
                .attr("width", (d) => x(d.value) - x(0))
                .style("cursor", "pointer")
                .on("mouseenter", (event, d) => {
                    showTooltip(event, d.name, { value: d.value, unit });
                })
                .on("mousemove", (event) => updateTooltipPosition(event))
                .on("mouseleave", () => hideTooltip())
                .merge(bars)
                .transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .attr("y", (d) => yPos(d))
                .attr("width", (d) => x(d.value) - x(0));

            bars
                .exit()
                .transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .attr("width", 0)
                .attr("y", yExit)
                .style("opacity", 0)
                .remove();

            // --- Labels (left side) ---
            const labels = g
                .selectAll<SVGTextElement, RankedBarItem>(".label")
                .data(rankedItems, (d) => d.name);

            labels
                .enter()
                .append("text")
                .attr("class", "label")
                .attr("text-anchor", "end")
                .attr("x", x(0) - 6)
                .attr("y", (d) => yCenter(d))
                .attr("dy", "0.35em")
                .attr("font-size", axisFontSize)
                .text((d) => d.name)
                .merge(labels)
                .transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .attr("y", (d) => yCenter(d))
                .attr("font-size", axisFontSize)
                .text((d) => d.name);

            labels
                .exit()
                .transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .attr("y", yExit)
                .style("opacity", 0)
                .remove();

            // --- Values (right side of bars) ---
            const values = g
                .selectAll<SVGTextElement, RankedBarItem>(".value")
                .data(rankedItems, (d) => d.name);

            values
                .enter()
                .append("text")
                .attr("class", "value")
                .attr("text-anchor", "start")
                .attr("x", (d) => x(d.value) + 6)
                .attr("y", (d) => yCenter(d))
                .attr("dy", "0.35em")
                .attr("font-size", axisFontSize)
                .text((d) => formatValue(d.value))
                .merge(values)
                .transition()
                .duration(duration)
                .ease(d3.easeLinear)
                .attr("x", (d) => x(d.value) + 6)
                .attr("y", (d) => yCenter(d))
                .attr("font-size", axisFontSize)
                .tween("text", function (d) {
                    const prev = parseFloat(this.textContent?.replace(/,/g, "") || "0");
                    const interp = d3.interpolateNumber(prev, d.value);
                    return function (t) {
                        this.textContent = formatValue(interp(t));
                    };
                });

            values
                .exit()
                .transition()
                .duration(duration)
                .attr("x", x(0))
                .style("opacity", 0)
                .remove();
        };

        // Store update function in ref (instead of DOM hack)
        updateRef.current = update;

        // Initial paint
        update(dateIndexRef.current);
    }, [data, viewWidth, viewHeight, topN, duration, marginTop, marginRight, marginBottom, marginLeft, innerWidth, axisFontSize, dateLabelFontSize, unit, formatValue, showTooltip, hideTooltip, updateTooltipPosition]);

    // Timer Loop
    useEffect(() => {
        if (isPlaying) {
            timerRef.current = d3.interval(() => {
                if (dateIndexRef.current >= data.length - 1) {
                    setIsPlaying(false);
                    timerRef.current?.stop();
                    return;
                }

                dateIndexRef.current += 1;
                updateRef.current?.(dateIndexRef.current);
            }, duration);
        } else {
            timerRef.current?.stop();
        }

        return () => {
            timerRef.current?.stop();
        };
    }, [isPlaying, data.length, duration]);

    const handlePlayPause = () => {
        if (dateIndexRef.current >= data.length - 1) {
            dateIndexRef.current = 0;
            updateRef.current?.(0);
        }
        setIsPlaying(!isPlaying);
    };

    const handleReset = () => {
        setIsPlaying(false);
        dateIndexRef.current = 0;
        updateRef.current?.(0);
    };

    return (
        <div
            className={cn(
                "relative flex flex-col w-full",
                className
            )}
            ref={containerRef}
        >
            {title && <h3 className="text-lg font-semibold mb-4 self-start">{title}</h3>}
            <div className="relative w-full overflow-hidden flex-1 min-h-0" ref={svgWrapperRef}>
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                    className="w-full h-full"
                />
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                    </div>
                )}
                {/* 再生ボタン: SVG左下に重ねて表示 */}
                <div className="absolute bottom-1 left-2 flex items-center gap-1">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleReset}>
                        <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" className="h-8" onClick={handlePlayPause}>
                        {isPlaying ? (
                            <><Pause className="h-3.5 w-3.5 mr-1" />Pause</>
                        ) : (
                            <><Play className="h-3.5 w-3.5 mr-1" />Play</>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

/** @deprecated Use BarChartRace */
export { BarChartRace as D3BarChartRace };
