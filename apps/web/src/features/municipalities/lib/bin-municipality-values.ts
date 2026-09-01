import type { MunicipalityRankingValue } from '@stats47/ranking/types';

export interface MunicipalityDistributionBin {
  /** ビン下限 (inclusive) */
  x0: number;
  /** ビン上限 (最終ビンのみ inclusive、それ以外 exclusive) */
  x1: number;
  /** 全国の件数 */
  count: number;
  /** 選択都道府県の件数 (未選択時は 0) */
  countInPref: number;
  /** 右裾を畳んだ overflow ビンか (x0 以上 max 以下をまとめて数える) */
  isOverflow: boolean;
  /** 左裾を畳んだ underflow ビンか (min 以上 x1 未満をまとめて数える) */
  isUnderflow: boolean;
}

export interface MunicipalityDistribution {
  bins: MunicipalityDistributionBin[];
  min: number;
  median: number;
  max: number;
  total: number;
  /** 選択都道府県の自治体数 (未選択時は 0) */
  prefTotal: number;
  /** 選択都道府県の値 (ラグ表示用。未選択時は空) */
  prefValues: number[];
}

const DEFAULT_BIN_COUNT = 30;

/**
 * 外れ値でヒストグラムが潰れないよう、2%/98% 分位の外側にある長い裾だけを
 * underflow / overflow ビンへ畳む。右歪み (総人口: 横浜 377 万 vs 中央値 2 万台) も
 * 左歪み (転入超過率: -15% の外れ村 vs 本体 -3〜3%) も本体の分布が読める。
 * 裾が短い指標では通常の等幅ビンのままになる。
 */
function resolveCaps(sorted: readonly number[]): { low: number; high: number } {
  const n = sorted.length;
  return {
    low: sorted[Math.max(0, Math.floor(n * 0.02))],
    high: sorted[Math.min(n - 1, Math.floor(n * 0.98))],
  };
}

export function binMunicipalityValues(
  values: readonly MunicipalityRankingValue[],
  options: { prefectureCode?: string; binCount?: number } = {}
): MunicipalityDistribution | null {
  if (values.length === 0) return null;
  const binCount = options.binCount ?? DEFAULT_BIN_COUNT;
  const prefectureCode = options.prefectureCode ?? '';

  const sorted = values.map((v) => v.value).sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  // page.tsx の「分布の要点」と同じ下側中央値 (表示値を一致させる)
  const median = sorted[Math.floor((sorted.length - 1) / 2)];

  const prefValues = prefectureCode
    ? values
        .filter((v) => v.prefectureCode === prefectureCode)
        .map((v) => v.value)
    : [];

  if (min === max) {
    return {
      bins: [
        {
          x0: min,
          x1: max,
          count: values.length,
          countInPref: prefValues.length,
          isOverflow: false,
          isUnderflow: false,
        },
      ],
      min,
      median,
      max,
      total: values.length,
      prefTotal: prefValues.length,
      prefValues,
    };
  }

  const caps = resolveCaps(sorted);
  const uniformBinCount = binCount;
  // 畳むのは「裾がビン幅より十分長い」側だけ。分位を機械的に使うと一様分布ですら
  // 上下 2% が畳まれてしまう (裾の長さ > ビン幅×2 を歪みの判定にする)。
  // caps.high === caps.low (本体が同値) は clippedWidth 0 になるので [min, max] 等幅へ。
  const clippedWidth = (caps.high - caps.low) / uniformBinCount;
  const useOverflow = clippedWidth > 0 && max - caps.high > clippedWidth * 2;
  const useUnderflow = clippedWidth > 0 && caps.low - min > clippedWidth * 2;
  const lower = useUnderflow ? caps.low : min;
  const upper = useOverflow ? caps.high : max;
  const effectiveWidth = (upper - lower) / uniformBinCount;

  const bins: MunicipalityDistributionBin[] = [];
  if (useUnderflow) {
    bins.push({
      x0: min,
      x1: lower,
      count: 0,
      countInPref: 0,
      isOverflow: false,
      isUnderflow: true,
    });
  }
  const uniformOffset = useUnderflow ? 1 : 0;
  for (let i = 0; i < uniformBinCount; i += 1) {
    bins.push({
      x0: lower + effectiveWidth * i,
      x1: lower + effectiveWidth * (i + 1),
      count: 0,
      countInPref: 0,
      isOverflow: false,
      isUnderflow: false,
    });
  }
  if (useOverflow) {
    bins.push({
      x0: upper,
      x1: max,
      count: 0,
      countInPref: 0,
      isOverflow: true,
      isUnderflow: false,
    });
  }

  const place = (value: number): MunicipalityDistributionBin => {
    if (useUnderflow && value < lower) return bins[0];
    if (useOverflow && value >= upper) return bins[bins.length - 1];
    const index = Math.min(
      uniformBinCount - 1,
      Math.max(0, Math.floor((value - lower) / effectiveWidth))
    );
    return bins[uniformOffset + index];
  };

  for (const row of values) {
    const bin = place(row.value);
    bin.count += 1;
    if (prefectureCode && row.prefectureCode === prefectureCode) {
      bin.countInPref += 1;
    }
  }

  return {
    bins,
    min,
    median,
    max,
    total: values.length,
    prefTotal: prefValues.length,
    prefValues,
  };
}
