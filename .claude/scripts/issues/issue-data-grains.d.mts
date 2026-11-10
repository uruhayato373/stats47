/** issue-data-grains.mjs の型 (TS のスクリプトから読むため) */
export function grainsOfMetricSource(text: string): Set<string>;
export function readMetricGrains(
  root: string,
  pages: Map<string, { kind: string; rankingKeys?: string[] }>,
): Map<string, Set<string>>;
export function readSeriesIds(root: string): Set<string>;
