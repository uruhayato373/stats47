import React from "react";

import { BuzzMapCard, resolveFill, type BuzzMapSummaryEntry } from "./BuzzMapCard";
import { legendRowsWithCounts, rampColor, valueAtYear } from "./lib";
import { BUZZ_MAP_COLORS, type BuzzMapRatio } from "./tokens";
import type { BuzzMapSpec } from "./types";
import { useBuzzMapFonts } from "./useBuzzMapFonts";
import { useBuzzMapGeo } from "./useBuzzMapGeo";

interface BuzzMapStillProps {
  spec: BuzzMapSpec;
  ratio: BuzzMapRatio;
  /** 型B spec を静止画化するときの表示年（省略時は years.to） */
  year?: number;
  /** 型B spec の静止画にサマリー（最大・最小）を載せる */
  showSummary?: boolean;
}

/**
 * 型A（静止画・二値/少区分）— 型B spec の最終年静止画（併投稿用）も出せる
 */
export const BuzzMapStill: React.FC<BuzzMapStillProps> = ({
  spec,
  ratio,
  year,
  showSummary = false,
}) => {
  useBuzzMapFonts();
  const geo = useBuzzMapGeo(spec, ratio);
  if (!geo) return null;

  if (spec.type === "A") {
    const rows = legendRowsWithCounts(spec);
    const fillByKey = new Map(rows.map((r) => [r.key, resolveFill(r.fill, spec)]));
    const values = spec.data.values ?? {};
    const fillFor = (code: string) => {
      const key = values[code];
      return (key && fillByKey.get(key)) || BUZZ_MAP_COLORS.land;
    };
    const specWithCounts: BuzzMapSpec = {
      ...spec,
      legend: { ...spec.legend, rows },
    };
    return <BuzzMapCard spec={specWithCounts} geo={geo} ratio={ratio} fillFor={fillFor} />;
  }

  // 型C（点）/ 型D（線）: 白地図ベース。geo.points / geo.lines は Card 内で描画。
  // 型D は year 指定でその年以下の線のみ（未指定=全網図）。年カウンターは静止画では出さない。
  if (spec.type === "C" || spec.type === "D") {
    const fillFor = () => BUZZ_MAP_COLORS.land;
    return (
      <BuzzMapCard
        spec={spec}
        geo={geo}
        ratio={ratio}
        fillFor={fillFor}
        year={spec.type === "D" ? year : undefined}
      />
    );
  }

  // 型E（レイヤー合成）: 塗り（data.values があれば型A と同じ塗り分け・無ければ白地図）＋
  // 点（geo.points）＋線（geo.lines）を重ねる。Card が全レイヤーを同一 SVG に描画。
  if (spec.type === "E") {
    const rows = legendRowsWithCounts(spec);
    const fillByKey = new Map(rows.map((r) => [r.key, resolveFill(r.fill, spec)]));
    const values = spec.data.values ?? {};
    const fillFor = (code: string) => {
      const key = values[code];
      return (key && fillByKey.get(key)) || BUZZ_MAP_COLORS.land;
    };
    const specWithCounts: BuzzMapSpec = {
      ...spec,
      legend: { ...spec.legend, rows },
    };
    return (
      <BuzzMapCard
        spec={specWithCounts}
        geo={geo}
        ratio={ratio}
        fillFor={fillFor}
        year={year}
      />
    );
  }

  // 型B の静止画（最終年 or 指定年）
  const t = year ?? spec.years?.to ?? 0;
  const series = spec.data.series ?? {};
  const domain = spec.ramp?.domain ?? [0, 1];
  const fillFor = (code: string) => {
    const v = series[code] ? valueAtYear(series[code], t) : undefined;
    return v === undefined ? BUZZ_MAP_COLORS.land : rampColor(v, domain);
  };

  let summary: BuzzMapSummaryEntry[] | undefined;
  if (showSummary) {
    summary = buildSummary(spec, t);
  }

  return (
    <BuzzMapCard
      spec={spec}
      geo={geo}
      ratio={ratio}
      fillFor={fillFor}
      yearLabel={`${Math.round(t)}年`}
      summary={summary}
    />
  );
};

/** 最大・最小のサマリー行（名前は geo ではなく series のコード→名前が無いので上位値のみ） */
export function buildSummary(spec: BuzzMapSpec, t: number): BuzzMapSummaryEntry[] {
  const series = spec.data.series ?? {};
  const unit = spec.ramp?.unit ?? "";
  const entries = Object.entries(series)
    .map(([code, s]) => ({ code, value: valueAtYear(s, t) }))
    .filter((e): e is { code: string; value: number } => e.value !== undefined)
    .sort((a, b) => b.value - a.value);
  if (entries.length === 0) return [];
  const out: BuzzMapSummaryEntry[] = [];
  const names = spec.data.names ?? {};
  if (spec.summary?.max !== false) {
    const top = entries[0];
    out.push({
      label: "最大",
      name: names[top.code] ?? top.code,
      value: `${top.value.toFixed(1)}${unit}`,
    });
  }
  if (spec.summary?.min !== false) {
    const last = entries[entries.length - 1];
    out.push({
      label: "最小",
      name: names[last.code] ?? last.code,
      value: `${last.value.toFixed(1)}${unit}`,
    });
  }
  return out;
}
