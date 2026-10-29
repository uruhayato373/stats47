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

// ─── 開通・廃止の判定 ─────────────────────────────────────────
//
// 原典は会社名・事業者・車線などの属性が変わると、同じ区間でも記録を分ける。記録の開始年を
// そのまま「開通」と扱うと、箱根登山鉄道→小田急箱根のような名前の変更まで開通に見える。
// 同じ区間の記録どうしは「関係 ID」(と関係備考に並ぶ別の関係 ID) で結ばれているので、
//   - 開始年: 前年まで同じ関係 ID の記録が無ければ「開通」。あれば、前年の線から離れた部分だけを「延伸」
//   - 終了年: 翌年に同じ関係 ID の記録が無ければ「廃止」。あれば、翌年の線から離れた部分だけを「短縮」
// とし、どちらでもない記録の区切りは「変更」(地図では強調しない) とする。

/** 線が「同じ場所」とみなす距離 (km)。原典の座標の精度と、版ごとの細かな引き直しを吸収する */
export const SAME_PLACE_TOLERANCE_KM = 0.1;
/** 延伸・短縮と扱う最小の長さ (km)。これより短い差は線の引き直しとみなす */
export const MIN_TRANSITION_KM = 0.5;

export interface TransitionRecord {
  readonly start: number;
  readonly end: number;
  /** 関係 ID と関係備考の別 ID */
  readonly relationIds: readonly string[];
  readonly lines: readonly (readonly Position[])[];
}

export type TransitionKind = "open" | "extend" | "close" | "shorten";

export interface TransitionEvent {
  readonly recordIndex: number;
  readonly kind: TransitionKind;
  /** 地図で強調する年。開通・延伸は開始年、廃止・短縮は最後に存在した年の翌年 */
  readonly year: number;
  /** 強調する部分の線 (開通・廃止は記録の線全体、延伸・短縮は離れた部分だけ) */
  readonly lines: readonly (readonly Position[])[];
  readonly km: number;
}

const KM_PER_DEGREE = 111.2;

/** 点から線群への最短距離 (km)。経度は緯度の cos で縮めた平面近似 (数百 m の判定に十分) */
export function distanceToLinesKm(point: Position, lines: readonly (readonly Position[])[]): number {
  const cosLat = Math.cos(point[1] * DEG_TO_RAD);
  let best = Infinity;
  for (const line of lines) {
    for (let i = 1; i < line.length; i++) {
      const ax = (line[i - 1][0] - point[0]) * cosLat;
      const ay = line[i - 1][1] - point[1];
      const dx = (line[i][0] - point[0]) * cosLat - ax;
      const dy = line[i][1] - point[1] - ay;
      const len2 = dx * dx + dy * dy;
      const t = len2 > 0 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
      const d = Math.hypot(ax + t * dx, ay + t * dy) * KM_PER_DEGREE;
      if (d < best) best = d;
    }
  }
  return best;
}

/** lines のうち、others から tolerance を超えて離れた線分をつないだ部分線と、その長さ */
export function linesAwayFrom(
  lines: readonly (readonly Position[])[],
  others: readonly (readonly Position[])[],
  toleranceKm = SAME_PLACE_TOLERANCE_KM,
): { lines: Position[][]; km: number } {
  const out: Position[][] = [];
  let km = 0;
  for (const line of lines) {
    let current: Position[] | null = null;
    for (let i = 1; i < line.length; i++) {
      const a = line[i - 1];
      const b = line[i];
      const mid: Position = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const isAway = others.length === 0 || distanceToLinesKm(mid, others) > toleranceKm;
      if (!isAway) {
        current = null;
        continue;
      }
      km += haversineKm(a, b);
      if (current) current.push(b);
      else {
        current = [a, b];
        out.push(current);
      }
    }
  }
  return { lines: out, km };
}

function shareRelation(a: TransitionRecord, b: TransitionRecord): boolean {
  return a.relationIds.some((id) => b.relationIds.includes(id));
}

/**
 * 全記録の開始・終了を開通・延伸・廃止・短縮に分ける。変更 (同じ場所の記録の付け替え) は返さない。
 * `firstYear` 以前から存在した記録 (原典が開始年を丸めた記録) の開始は開通にしない。
 * `lastYear` まで続く記録 (継続中) の終了は廃止にしない。
 */
export function classifyTransitions(
  records: readonly TransitionRecord[],
  firstYear: number,
  lastYear: number,
): TransitionEvent[] {
  const byRelation = new Map<string, number[]>();
  records.forEach((record, index) => {
    for (const id of record.relationIds) byRelation.set(id, [...(byRelation.get(id) ?? []), index]);
  });
  const related = (record: TransitionRecord, pick: (other: TransitionRecord) => boolean) => {
    const indexes = new Set(record.relationIds.flatMap((id) => byRelation.get(id) ?? []));
    return [...indexes].map((i) => records[i]).filter((o) => o !== record && shareRelation(o, record) && pick(o));
  };

  const events: TransitionEvent[] = [];
  records.forEach((record, recordIndex) => {
    if (record.start > firstYear) {
      const before = related(record, (o) => o.end === record.start - 1);
      const away = linesAwayFrom(record.lines, before.flatMap((o) => o.lines));
      if (before.length === 0) {
        events.push({ recordIndex, kind: "open", year: record.start, lines: record.lines.map((l) => [...l]), km: lineSetKm(record.lines) });
      } else if (away.km >= MIN_TRANSITION_KM) {
        events.push({ recordIndex, kind: "extend", year: record.start, lines: away.lines, km: away.km });
      }
    }
    if (record.end < lastYear) {
      const after = related(record, (o) => o.start === record.end + 1);
      const away = linesAwayFrom(record.lines, after.flatMap((o) => o.lines));
      if (after.length === 0) {
        events.push({ recordIndex, kind: "close", year: record.end + 1, lines: record.lines.map((l) => [...l]), km: lineSetKm(record.lines) });
      } else if (away.km >= MIN_TRANSITION_KM) {
        events.push({ recordIndex, kind: "shorten", year: record.end + 1, lines: away.lines, km: away.km });
      }
    }
  });
  return events;
}

function lineSetKm(lines: readonly (readonly Position[])[]): number {
  return lines.reduce((sum, line) => sum + lineLengthKm(line), 0);
}

export function yearRange(first: number, last: number): number[] {
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}

function roundKm(value: number): number {
  return Math.round(value * 1000) / 1000;
}
