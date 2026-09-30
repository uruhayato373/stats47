/**
 * `MetricConfig.supplementalSources` の合流規則 (page-data-batch が使う純関数)。
 *
 * 補完に指定した年は補完側の値を採り、主出典の同じ年は捨てる。主出典にも同じ年が
 * あった場合は `overlapYears` に返し、取り込みが「補完を外せる」と警告する。
 */

/** e-Stat getStatsData の VALUE 1 件のうち、合流に使う属性だけ */
export interface MergeableValue {
  "@area": string;
  "@time": string;
}

export interface SupplementBatch<V extends MergeableValue> {
  years: readonly number[];
  values: readonly V[];
}

export interface MergedValues<V extends MergeableValue> {
  values: V[];
  /** 補完が値を返した年 (4 桁・昇順) */
  suppliedYears: string[];
  /** 主出典も持っていた補完年 (4 桁・昇順)。補完を外す合図 */
  overlapYears: string[];
}

const yearOf = (v: MergeableValue): string => v["@time"].slice(0, 4);

export function mergeSupplementalValues<V extends MergeableValue>(
  primary: readonly V[],
  supplements: readonly SupplementBatch<V>[],
): MergedValues<V> {
  const suppliedYearSet = new Set(supplements.flatMap((s) => s.years.map(String)));
  if (suppliedYearSet.size === 0) {
    return { values: [...primary], suppliedYears: [], overlapYears: [] };
  }

  const overlap = new Set<string>();
  const kept = primary.filter((v) => {
    const y = yearOf(v);
    if (!suppliedYearSet.has(y)) return true;
    overlap.add(y);
    return false;
  });

  const supplied = new Set<string>();
  const added: V[] = [];
  for (const batch of supplements) {
    const years = new Set(batch.years.map(String));
    for (const v of batch.values) {
      const y = yearOf(v);
      if (!years.has(y)) continue;
      supplied.add(y);
      added.push(v);
    }
  }

  return {
    values: [...kept, ...added],
    suppliedYears: [...supplied].sort(),
    overlapYears: [...overlap].sort(),
  };
}
