"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

import { resolveChoroplethScale } from "../../d3/utils/color-scale/resolve-choropleth-scale";
import type { MapVisualizationConfig, MapDataPoint } from "../../d3/types/map-chart";
import { createLegendFormatter } from "../../d3/utils/color-scale/legend-format";

interface MapColorLegendProps {
  colorConfig: MapVisualizationConfig;
  data: MapDataPoint[];
  unit?: string;
  position?: L.ControlPosition;
  /** 値の変換表示（conversionFactor, decimalPlaces, displayUnit） */
  valueDisplay?: {
    conversionFactor?: number;
    decimalPlaces?: number;
    displayUnit?: string;
  };
  /** データなし（非公表）の凡例エントリを表示するか */
  showNoDataLabel?: boolean;
}

/**
 * Leaflet コントロールとして表示する色凡例
 *
 * 指標定義で指定した階級と境界値、または連続グラデーションを描画。
 */
export function MapColorLegend({
  colorConfig,
  data,
  unit = "",
  position = "bottomright",
  valueDisplay,
  showNoDataLabel = false,
}: MapColorLegendProps) {
  const map = useMap();
  const controlRef = useRef<L.Control | null>(null);

  useEffect(() => {
    if (data.length === 0) return;

    let cancelled = false;

    resolveChoroplethScale(colorConfig, data).then((resolved) => {
      if (!resolved.domain) return;
      const [min, max] = resolved.domain;
      if (cancelled) return;

      // 既存コントロールを削除
      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }

      const legend = new L.Control({ position });

      legend.onAdd = () => {
        const div = L.DomUtil.create("div", "leaflet-legend");
        div.style.cssText =
          "background:hsl(var(--card));color:hsl(var(--foreground));padding:6px 10px;border-radius:6px;font-size:11px;line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,0.15);backdrop-filter:blur(4px);min-width:180px;";

        const factor = valueDisplay?.conversionFactor ?? 1;
        const dp = valueDisplay?.decimalPlaces;
        const displayUnit = valueDisplay?.displayUnit ?? unit;
        const fmt = createLegendFormatter([...resolved.boundaries, ...(resolved.midpoint !== undefined ? [resolved.midpoint] : [])], factor, resolved.method === 'threshold' ? undefined : dp);
        const heading = L.DomUtil.create("div", "", div);
        heading.textContent = resolved.method === "continuous" ? "値の大きさ" : resolved.method === "quantile" ? "分位区分" : resolved.method === "threshold" ? "指定した境界値" : "等間隔区分";
        const bar = L.DomUtil.create("div", "", div);
        bar.style.cssText = "height:12px;display:flex;margin:4px 0;";
        if (resolved.method === "continuous") {
          const stops = Array.from({ length: 21 }, (_, i) => resolved.colorAtValue(min + (max - min) * i / 20));
          bar.style.background = 'linear-gradient(to right,' + stops.join(',') + ')';
        } else for (let i = 0; i < resolved.colors.length; i++) {
          const segment = L.DomUtil.create("span", "", bar);
          segment.style.cssText = 'flex:1;background:' + resolved.colors[i] + ';';
          segment.title = fmt(resolved.boundaries[i]) + '〜' + fmt(resolved.boundaries[i + 1]) + (displayUnit ? ' ' + displayUnit : '');
        }
        const labels = L.DomUtil.create("div", "", div);
        labels.style.cssText = "display:flex;justify-content:space-between;gap:12px;";
        const low = L.DomUtil.create("span", "", labels);
        const high = L.DomUtil.create("span", "", labels);
        low.textContent = fmt(min); high.textContent = fmt(max) + (displayUnit ? ' ' + displayUnit : '');
        if (resolved.method !== 'continuous' && resolved.boundaries.length > 2) {
          const thresholds = L.DomUtil.create('div', '', div);
          thresholds.style.cssText = 'max-width:250px;margin-top:3px;white-space:normal;';
          thresholds.textContent = '境界: ' + resolved.boundaries.slice(1, -1).map(fmt).join(' / ') + (displayUnit ? ' ' + displayUnit : '');
        }
        if (resolved.midpoint !== undefined) {
          const reference = L.DomUtil.create("div", "", div);
          reference.style.cssText = 'display:flex;align-items:center;gap:4px;margin-top:3px;';
          const swatch = L.DomUtil.create('span', '', reference);
          swatch.style.cssText = 'width:10px;height:10px;background:' + resolved.colorAtValue(resolved.midpoint) + ';';
          const referenceLabel = L.DomUtil.create('span', '', reference);
          referenceLabel.textContent = '基準: ' + fmt(resolved.midpoint) + (displayUnit ? ' ' + displayUnit : '');
        }
        if (showNoDataLabel) {
          const missing = L.DomUtil.create("div", "", div);
          missing.style.cssText = "display:flex;align-items:center;gap:4px;margin-top:4px;";
          const swatch = L.DomUtil.create("span", "", missing);
          swatch.style.cssText = 'display:inline-block;width:10px;height:10px;background:' + resolved.noDataColor + ';';
          const text = L.DomUtil.create("span", "", missing);text.textContent = "データなし";
        }
        L.DomEvent.disableClickPropagation(div);
        return div;
      };

      legend.addTo(map);
      controlRef.current = legend;
    });

    return () => {
      cancelled = true;
      if (controlRef.current) {
        map.removeControl(controlRef.current);
        controlRef.current = null;
      }
    };
  }, [colorConfig, data, unit, position, map, valueDisplay, showNoDataLabel]);

  return null;
}
