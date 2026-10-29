/**
 * 交通網の変遷の決定的な計算 (純関数)。
 *
 * 1 本の区間 (LineString) を、頂点間の線分ごとに中点の県で分け、同じ県が続く線分を
 * 1 つの piece にまとめる。県の判定は `prefecture-assign.ts` の locator (ポリゴン → 海岸線
 * 許容) だけを使い、どちらでも決まらない線分は未帰属 (null) として延長だけ数える。
 * 推測で近い県へ寄せない。
 */

import type { InfraLengthSeries } from "./types";

/** 継続中を表す終了年 (原典の仕様) */
export const OPEN_END_YEAR = 9999;
/** 年不明を表す値 (原典の仕様)。開始・終了のどちらかがこれなら時系列に載せない */
export const UNKNOWN_YEAR = 999;

const EARTH_RADIUS_KM = 6371.0088;
const DEG_TO_RAD = Math.PI / 180;

export type Position = readonly [number, number];

export function haversineKm(a: Position, b: Position): number {
  const dLon = (b[0] - a[0]) * DEG_TO_RAD;
  const dLat = (b[1] - a[1]) * DEG_TO_RAD;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(a[1] * DEG_TO_RAD) * Math.cos(b[1] * DEG_TO_RAD) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export function lineLengthKm(coords: readonly Position[]): number {
  let total = 0;
  for (let i = 1; i < coords.length; i++) total += haversineKm(coords[i - 1], coords[i]);
  return total;
}

/** 区間が year 年に存在したか。原典の終了年は「廃止の 1 年前」なので両端を含む */
export function isActiveInYear(start: number, end: number, year: number): boolean {
  return start <= year && year <= end;
}

/** 原典の年属性 (文字列・数値) を整数年へ。読めなければ null */
export function parseSourceYear(value: unknown): number | null {
  const year = typeof value === "number" ? value : Number(String(value ?? "").trim());
  return Number.isInteger(year) && year > 0 ? year : null;
}

export type SegmentAssignMethod = "polygon" | "coastline";

export interface SegmentAssignment {
  readonly prefCode: string;
  readonly method: SegmentAssignMethod;
}

export interface LinePiece {
  /** 2 桁県コード。どの県にも決まらなければ null */
  readonly prefCode: string | null;
  readonly method: SegmentAssignMethod | null;
  readonly coords: readonly Position[];
  readonly km: number;
  /** この piece を作った線分の数 */
  readonly segments: number;
}

/**
 * 線を県ごとの piece に分ける。境目の頂点は前後の piece の両方に含め、地図上で線を途切れさせない。
 * 長さ 0 の線分 (重複頂点) は直前の piece にまとめる。
 */
export function splitLineByPrefecture(
  coords: readonly Position[],
  assign: (lon: number, lat: number) => SegmentAssignment | null,
): LinePiece[] {
  const pieces: LinePiece[] = [];

  for (let i = 1; i < coords.length; i++) {
    const a = coords[i - 1];
    const b = coords[i];
    const km = haversineKm(a, b);
    const hit = assign((a[0] + b[0]) / 2, (a[1] + b[1]) / 2);
    const prefCode = hit?.prefCode ?? null;
    const last = pieces[pieces.length - 1];
    if (last && (last.prefCode === prefCode || km === 0)) {
      pieces[pieces.length - 1] = {
        ...last,
        coords: [...last.coords, b],
        km: last.km + km,
        segments: last.segments + 1,
      };
      continue;
    }
    pieces.push({ prefCode, method: hit?.method ?? null, coords: [a, b], km, segments: 1 });
  }
  return pieces;
}

export interface YearSpan {
  readonly start: number;
  readonly end: number;
  readonly category: string;
  readonly km: number;
}

/** 年ごとの延長系列を作る。値は小数 3 桁 (m 単位) に丸める */
export function buildLengthSeries(
  spans: readonly YearSpan[],
  years: readonly number[],
  categoryCodes: readonly string[],
): InfraLengthSeries {
  const byCategory: Record<string, number[]> = Object.fromEntries(
    categoryCodes.map((code) => [code, years.map(() => 0)]),
  );
  const total = years.map(() => 0);
  for (const span of spans) {
    const series = byCategory[span.category];
    if (!series) throw new Error(`台帳に無い種別コード: ${span.category}`);
    years.forEach((year, i) => {
      if (!isActiveInYear(span.start, span.end, year)) return;
      series[i] += span.km;
      total[i] += span.km;
    });
  }
  return {
    total: total.map(roundKm),
    byCategory: Object.fromEntries(
      Object.entries(byCategory).map(([code, values]) => [code, values.map(roundKm)]),
    ),
  };
}

export function sumLengthSeries(
  series: readonly InfraLengthSeries[],
  length: number,
  categoryCodes: readonly string[],
): InfraLengthSeries {
  const add = (pick: (s: InfraLengthSeries) => readonly number[]) =>
    Array.from({ length }, (_, i) => roundKm(series.reduce((sum, s) => sum + (pick(s)[i] ?? 0), 0)));
  return {
    total: add((s) => s.total),
    byCategory: Object.fromEntries(
      categoryCodes.map((code) => [code, add((s) => s.byCategory[code] ?? [])]),
    ),
  };
}

/** 2 系列の差の最大値 (km)。保存則の検査に使う */
export function maxSeriesDiffKm(a: InfraLengthSeries, b: InfraLengthSeries): number {
  let max = 0;
  a.total.forEach((value, i) => {
    max = Math.max(max, Math.abs(value - (b.total[i] ?? 0)));
  });
  for (const [code, values] of Object.entries(a.byCategory)) {
    values.forEach((value, i) => {
      max = Math.max(max, Math.abs(value - (b.byCategory[code]?.[i] ?? 0)));
    });
  }
  return max;
}

export function yearRange(first: number, last: number): number[] {
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

function roundKm(value: number): number {
  return Math.round(value * 1000) / 1000;
}
