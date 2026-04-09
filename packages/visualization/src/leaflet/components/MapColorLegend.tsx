"use client";

import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

import { createChoroplethColorMapper } from "../../d3/utils/color-scale/create-choropleth-color-mapper";
import type { MapVisualizationConfig, MapDataPoint } from "../../d3/types/map-chart";

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
 * 10段階のグラデーションバーと min/max ラベルを描画。
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

    const values = data.map((d) => d.value).filter((v) => v != null) as number[];
    if (values.length === 0) return;

    const min = Math.min(...values);
    const max = Math.max(...values);

    let cancelled = false;

    createChoroplethColorMapper(colorConfig, data).then((colorMapper) => {
      if (cancelled) return;

      // 既存コントロールを削除
      if (controlRef.current) {
        map.removeControl(controlRef.current);
      }

      const legend = new L.Control({ position });

      legend.onAdd = () => {
        const div = L.DomUtil.create("div", "leaflet-legend");
        div.style.cssText =
          "background:rgba(255,255,255,0.92);padding:6px 10px;border-radius:6px;font-size:11px;line-height:1.4;box-shadow:0 1px 4px rgba(0,0,0,0.15);backdrop-filter:blur(4px);min-width:180px;";

        // 10段階グラデーション
        const steps = 10;
        const gradientParts: string[] = [];
        for (let i = 0; i < steps; i++) {
          const ratio = i / (steps - 1);
          const val = min + (max - min) * ratio;
          const fakeCode = `__legend_${i}`;
          // ダミーの colorMapper 呼び出し用にデータの中間値を使う
          const idx = Math.round(ratio * (data.length - 1));
          const code = data[idx]?.areaCode ?? fakeCode;
          const color = colorMapper(code);
          gradientParts.push(color);
        }

        const factor = valueDisplay?.conversionFactor ?? 1;
        const dp = valueDisplay?.decimalPlaces;
        const displayUnit = valueDisplay?.displayUnit ?? unit;
        const fmtMin = formatValue(min * factor, dp);
        const fmtMax = formatValue(max * factor, dp);

        const gradientBar = `<div style="height:10px;border-radius:3px;background:linear-gradient(to right,${gradientParts.join(",")});margin:2px 0;"></div>`;
        const labels = `<div style="display:flex;justify-content:space-between;color:#64748b;"><span>${fmtMin}</span><span>${fmtMax}${displayUnit ? ` ${displayUnit}` : ""}</span></div>`;
        const noDataEntry = showNoDataLabel
          ? `<div style="display:flex;align-items:center;gap:4px;margin-top:4px;color:#64748b;"><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:#e0e0e0;"></span><span>データなし</span></div>`
          : "";

        div.innerHTML = gradientBar + labels + noDataEntry;
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
  }, [colorConfig, data, unit, position, map]);

  return null;
}

function formatValue(value: number, decimalPlaces?: number): string {
  if (decimalPlaces !== undefined) {
    return value.toLocaleString(undefined, { minimumFractionDigits: decimalPlaces, maximumFractionDigits: decimalPlaces });
  }
  if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(1) + "万";
  }
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toFixed(1);
}
