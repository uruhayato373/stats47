/** Current item schema first, then historical snapshots. */
export function resolveRankingOgpSource(item: {
  sourceConfig?: { source?: { name?: string } };
  source?: { source?: { name?: string }; name?: string };
}): string {
  return item.sourceConfig?.source?.name ?? item.source?.source?.name ?? item.source?.name ?? 'e-Stat';
}
