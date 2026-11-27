import { niceTicks } from '@stats47/types';

import { buildMunicipalityPrefectureRanking } from './municipality-prefecture-ranking';

import type { MunicipalityRankingValue } from '../types/municipality-snapshot';

/**
 * 市区町村ランキングの「都道府県別の分布」(県ごとに県内の市区町村を点で並べる帯) のデータと軸 (純粋関数)。
 * 県内の中央値は県別ページと同じ定義 (`buildMunicipalityPrefectureRanking` の下側中央値) を使い、食い違わせない。
 */
export interface PrefectureStripGroup {
  prefectureCode: string;
  prefectureName: string;
  values: number[];
  median: number;
}

/** 都道府県ごとに値をまとめ、県内の中央値の大きい順に並べる。値の無い県は外す */
export function buildPrefectureStripGroups(
  values: readonly MunicipalityRankingValue[],
  prefectures: readonly { prefCode: string; prefName: string }[],
  specialWardCodes: ReadonlySet<string>
): PrefectureStripGroup[] {
  return prefectures
    .flatMap((prefecture) => {
      const ranking = buildMunicipalityPrefectureRanking(values, prefecture.prefCode, specialWardCodes);
      if (!ranking) return [];
      return [{
        prefectureCode: prefecture.prefCode,
        prefectureName: prefecture.prefName,
        values: ranking.rows.map((row) => row.value),
        median: ranking.median,
      }];
    })
    .sort((a, b) => b.median - a.median || a.prefectureCode.localeCompare(b.prefectureCode));
}

/**
 * 最大 ÷ 最小がこの倍率以上の正の値は対数の軸にする。
 * 総人口 (168〜375 万人・約 2 万倍) は普通の軸だと 9 割の点が左端の 1% に重なる。率 (高齢化率 10〜60% など) は数倍なので普通の軸のまま
 */
export const LOG_SCALE_MIN_RATIO = 100;

export interface StripScale {
  kind: 'linear' | 'log';
  min: number;
  max: number;
  ticks: number[];
  /** 軸の外にあり、端に寄せて描く値があるか (普通の軸で長い裾を切ったとき) */
  clipped: boolean;
}

/**
 * 普通の軸は 2%〜98% の値の範囲にする (全国分布のヒストグラムの `binMunicipalityValues` と同じ裾の切り方)。
 * 転入超過率は 1 村の -15% で軸が広がり、47 県の点が右端に固まっていた。外の値は端に寄せて描く
 */
const LINEAR_TAIL_QUANTILE = 0.02;

function quantileOf(sorted: readonly number[], q: number): number {
  return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * q)))]!;
}

export function resolveStripScale(values: readonly number[]): StripScale | null {
  const sorted = values.filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const low = sorted[0]!;
  const high = sorted[sorted.length - 1]!;
  if (low > 0 && high / low >= LOG_SCALE_MIN_RATIO) {
    const from = Math.floor(Math.log10(low));
    const to = Math.ceil(Math.log10(high));
    const ticks = Array.from({ length: to - from + 1 }, (_, index) => 10 ** (from + index));
    return { kind: 'log', min: 10 ** from, max: 10 ** to, ticks, clipped: false };
  }
  const min = quantileOf(sorted, LINEAR_TAIL_QUANTILE);
  const max = quantileOf(sorted, 1 - LINEAR_TAIL_QUANTILE);
  if (max === min) return { kind: 'linear', min: min - 1, max: max + 1, ticks: [min], clipped: low < min || high > max };
  return { kind: 'linear', min, max, ticks: niceTicks(min, max, 5), clipped: low < min || high > max };
}

/** 軸の上の位置 (左端 0・右端 100) */
export function stripPosition(scale: StripScale, value: number): number {
  const ratio = scale.kind === 'log'
    ? (Math.log10(value) - Math.log10(scale.min)) / (Math.log10(scale.max) - Math.log10(scale.min))
    : (value - scale.min) / (scale.max - scale.min);
  return Math.max(0, Math.min(100, ratio * 100));
}

/** 対数の軸の目盛り (10 の累乗) を「100・1,000・1万・10万・100万・1億」と短く書く。単位は付けない */
export function formatPowerOfTenTick(value: number): string {
  if (value >= 1e8) return `${(value / 1e8).toLocaleString('ja-JP')}億`;
  if (value >= 1e4) return `${(value / 1e4).toLocaleString('ja-JP')}万`;
  return value.toLocaleString('ja-JP');
}
