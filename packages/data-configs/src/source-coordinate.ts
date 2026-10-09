export interface EstatRequestDep { statsDataId: string; filters: Record<string, string>; }
/** Canonical original-source coordinate identity; one table can contain many metrics. */
export function requestKey(request: EstatRequestDep): string {
  const filters = Object.keys(request.filters).sort().map((key) => `${key}=${request.filters[key]}`).join('&');
  return filters ? `${request.statsDataId}?${filters}` : request.statsDataId;
}
