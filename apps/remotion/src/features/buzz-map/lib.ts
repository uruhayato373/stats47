/**
 * buzz-map 純粋ロジック（時間→年の変換・値補間・ランプ配色）
 */

import { BUZZ_MAP_REEL_DEFAULTS, buzzMapRamp, type BuzzMapTheme } from "./tokens";
import type { BuzzMapSpec, BuzzMapSpeedSegment } from "./types";

/** speed 未指定時の既定（全区間 2年/秒） */
function segmentsOf(spec: BuzzMapSpec): BuzzMapSpeedSegment[] {
  if (!spec.years) return [];
  return spec.speed?.length
    ? spec.speed
    : [{ until: spec.years.to, yearsPerSec: 2 }];
}

/** アニメ部分（hold 除く）の総秒数 */
export function animSeconds(spec: BuzzMapSpec): number {
  if (!spec.years) return 0;
  let sec = 0;
  let from = spec.years.from;
  for (const seg of segmentsOf(spec)) {
    const to = Math.min(seg.until, spec.years.to);
    if (to > from) {
      sec += (to - from) / seg.yearsPerSec;
      from = to;
    }
  }
  return sec;
}

/** hold（ラスト静止）込みの総フレーム数 */
export function reelDurationInFrames(spec: BuzzMapSpec, fps: number): number {
  const hold = spec.holdSeconds ?? BUZZ_MAP_REEL_DEFAULTS.holdSeconds;
  return Math.max(1, Math.ceil((animSeconds(spec) + hold) * fps));
}

/** 経過秒 → 小数年（減速カーブを反映）。アニメ終了後は years.to に張り付く */
export function yearAtSeconds(spec: BuzzMapSpec, seconds: number): number {
  if (!spec.years) return 0;
  let t = seconds;
  let year = spec.years.from;
  for (const seg of segmentsOf(spec)) {
    const to = Math.min(seg.until, spec.years.to);
    if (to <= year) continue;
    const segSec = (to - year) / seg.yearsPerSec;
    if (t < segSec) return year + t * seg.yearsPerSec;
    t -= segSec;
    year = to;
  }
  return spec.years.to;
}

/** series（year→value の疎な系列）から小数年 t の値を線形補間で得る */
export function valueAtYear(
  series: Record<string, number>,
  t: number
): number | undefined {
  const years = Object.keys(series)
    .map(Number)
    .sort((a, b) => a - b);
  if (years.length === 0) return undefined;
  if (t <= years[0]) return series[String(years[0])];
  if (t >= years[years.length - 1]) return series[String(years[years.length - 1])];
  let lo = years[0];
  for (const y of years) {
    if (y <= t) lo = y;
    else {
      const a = series[String(lo)];
      const b = series[String(y)];
      return a + ((b - a) * (t - lo)) / (y - lo);
    }
  }
  return series[String(lo)];
}

/** 連続量 → ランプ7段の離散色（domain 外はクランプ）。theme 未指定は blue */
export function rampColor(
  value: number,
  domain: [number, number],
  theme?: BuzzMapTheme
): string {
  const ramp = buzzMapRamp(theme);
  const [min, max] = domain;
  const r = max > min ? (value - min) / (max - min) : 0;
  const i = Math.max(0, Math.min(ramp.length - 1, Math.floor(r * ramp.length)));
  return ramp[i];
}

/** 型A: 凡例 rows の count 未指定分を data.values から自動集計した rows を返す */
export function legendRowsWithCounts(spec: BuzzMapSpec) {
  const rows = spec.legend.rows ?? [];
  const values = spec.data.values ?? {};
  const counts = new Map<string, number>();
  for (const v of Object.values(values)) {
    counts.set(v, (counts.get(v) ?? 0) + 1);
  }
  const assigned = Object.keys(values).length;
  return rows.map((row, i) => {
    if (row.count !== undefined) return row;
    // 値が明示されない「その他」行（land 既定）は総数から引き当てられないため 0 のまま表示しない手もあるが、
    // 47都道府県の pref レベルだけは残数を自動補完する
    const counted = counts.get(row.key);
    if (counted !== undefined) return { ...row, count: counted };
    if (spec.level === "pref" && i === rows.length - 1) {
      return { ...row, count: 47 - assigned };
    }
    return row;
  });
}
