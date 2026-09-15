import type { StatsSchema } from "@stats47/types";

/**
 * チャート設定の明示単位を優先し、未指定なら取得済み系列から最初の有効単位を返す。
 * 単位の解釈・換算は行わず、表示層へ同じ文字列を引き渡すだけに限定する。
 */
export function resolveChartUnit(
  explicitUnit: string | undefined,
  rawDataLists: readonly (readonly StatsSchema[])[],
): string | undefined {
  const configured = explicitUnit?.trim();
  if (configured) return configured;

  for (const rows of rawDataLists) {
    for (const row of rows) {
      const observed = row.unit?.trim();
      if (observed) return observed;
    }
  }

  return undefined;
}
