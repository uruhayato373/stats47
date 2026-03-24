import type { BarChartRaceFrame } from "@stats47/visualization";
import type { StatsSchema } from "@stats47/types";
import { SCENE_DURATION } from "@/utils/constants";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** 補間結果の拡張型（opacity 追加） */
export interface InterpolatedBarItem {
  name: string;
  value: number;
  /** 補間中は小数値（0始まり） */
  rank: number;
  /** 0-1（フェード用） */
  opacity: number;
}

/** イベントラベル（年度付近に表示するテキスト） */
export interface EventLabel {
  /** "1991" 等 */
  year: string;
  /** "バブル崩壊" 等 */
  label: string;
}

// ---------------------------------------------------------------------------
// Data transform
// ---------------------------------------------------------------------------

/**
 * StatsSchema[] → BarChartRaceFrame[] 変換
 *
 * yearCode でグループ化し、yearCode 昇順ソート。date は yearName を使用。
 */
export function toBarChartRaceFrames(stats: StatsSchema[]): BarChartRaceFrame[] {
  const grouped = new Map<string, { yearName: string; items: { name: string; value: number }[] }>();

  for (const s of stats) {
    let group = grouped.get(s.yearCode);
    if (!group) {
      group = { yearName: s.yearName, items: [] };
      grouped.set(s.yearCode, group);
    }
    group.items.push({ name: s.areaName, value: s.value });
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, { yearName, items }]) => ({ date: yearName, items }));
}

// ---------------------------------------------------------------------------
// Interpolation
// ---------------------------------------------------------------------------

/**
 * 2フレーム間を t (0-1) で線形補間し、topN+5 件の InterpolatedBarItem[] を返す
 */
export function interpolateRaceFrame(
  frameA: BarChartRaceFrame,
  frameB: BarChartRaceFrame,
  t: number,
  topN: number,
): InterpolatedBarItem[] {
  const expandedN = topN + 5;

  // ランク付与（value 降順）
  const rank = (items: { name: string; value: number }[]) =>
    [...items]
      .sort((a, b) => b.value - a.value)
      .slice(0, expandedN)
      .map((item, i) => ({ ...item, rank: i }));

  const rankedA = rank(frameA.items);
  const rankedB = rank(frameB.items);

  const mapA = new Map(rankedA.map((item) => [item.name, item]));
  const mapB = new Map(rankedB.map((item) => [item.name, item]));

  // 両方に存在する名前 + 片方のみの名前を結合
  const allNames = new Set([...mapA.keys(), ...mapB.keys()]);

  const result: InterpolatedBarItem[] = [];
  for (const name of allNames) {
    const a = mapA.get(name);
    const b = mapB.get(name);

    if (a && b) {
      // 両方に存在: value/rank を補間
      result.push({
        name,
        value: a.value + (b.value - a.value) * t,
        rank: a.rank + (b.rank - a.rank) * t,
        opacity: 1,
      });
    } else if (a && !b) {
      // A のみ: フェードアウト
      result.push({
        name,
        value: a.value,
        rank: a.rank + (expandedN - a.rank) * t, // 画面外へ移動
        opacity: 1 - t,
      });
    } else if (b) {
      // B のみ: フェードイン
      result.push({
        name,
        value: b.value,
        rank: expandedN + (b.rank - expandedN) * t, // 画面外から移動
        opacity: t,
      });
    }
  }

  return result
    .filter((item) => item.rank < topN)
    .sort((a, b) => a.rank - b.rank);
}

// ---------------------------------------------------------------------------
// Timeline
// ---------------------------------------------------------------------------

/** Spoiler フック (2s) */
const SPOILER_DURATION = 60;

interface BarChartRaceTimelineOptions {
  /** フレームデータの件数（年度数） */
  frameCount: number;
  /** 1年度あたりのフレーム数 @default 36 */
  framesPerYear?: number;
  /** Spoiler Hook を有効にするか @default false */
  enableSpoilerHook?: boolean;
  /** 最終年度を固定表示するフレーム数 @default 90 (3秒) */
  endHoldFrames?: number;
}

export interface BarChartRaceTimeline {
  /** Spoiler の開始フレーム（enableSpoilerHook=false なら 0） */
  spoilerStart: number;
  /** Spoiler の持続フレーム数 */
  spoilerDuration: number;
  /** Intro (RankingTitle) の開始フレーム */
  introStart: number;
  /** Race 本体の開始フレーム */
  raceStart: number;
  /** Race 本体の持続フレーム数 */
  raceDuration: number;
  /** CTA (ReelLastPage) の開始フレーム */
  ctaStart: number;
  /** 全体の持続フレーム数 */
  totalDuration: number;
}

/**
 * Bar Chart Race Short のタイムライン計算
 */
export function getBarChartRaceTimeline(opts: BarChartRaceTimelineOptions): BarChartRaceTimeline {
  const { frameCount, framesPerYear = 36, enableSpoilerHook = false, endHoldFrames = 90 } = opts;

  const spoilerDuration = enableSpoilerHook ? SPOILER_DURATION : 0;
  const spoilerStart = 0;
  const introStart = spoilerDuration;
  const raceStart = introStart + SCENE_DURATION.intro;
  const raceDuration = Math.max(0, frameCount - 1) * framesPerYear + endHoldFrames;
  const ctaStart = raceStart + raceDuration;
  const totalDuration = ctaStart + SCENE_DURATION.last;

  return {
    spoilerStart,
    spoilerDuration,
    introStart,
    raceStart,
    raceDuration,
    ctaStart,
    totalDuration,
  };
}
