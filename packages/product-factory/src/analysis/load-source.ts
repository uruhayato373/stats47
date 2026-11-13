import { buildMunicipalityEntityPolicy, listPublishableMunicipalities, PREFECTURE_AREA_CODES } from '@stats47/area';
import { fetchAnalysisSource, type AnalysisObservation, type AnalysisSource } from './fetch-estat';
import type { ResolvedSource } from './catalog';
import { listCapitalCityAreas } from './capital-city';

export function validateSourceRows(source: ResolvedSource, rows: AnalysisObservation[]): void {
  if (!source.id || !['prefecture', 'municipality', 'capital-city'].includes(source.grain) || !source.years.length ||
      new Set(source.years).size !== source.years.length || !source.metrics.length ||
      new Set(source.metrics.map(metric => metric.id)).size !== source.metrics.length)
    throw Error(`取得元の地域単位・年・指標が空または不正です: ${source.id}`);
  const expectedAreas = source.grain === 'capital-city' ? listCapitalCityAreas().map(area => area.code) : source.grain === 'prefecture' ? PREFECTURE_AREA_CODES :
    listPublishableMunicipalities(buildMunicipalityEntityPolicy()).map(area => area.code);
  const allowedAreas = new Set<string>(expectedAreas);
  const metrics = new Map(source.metrics.map(metric => [metric.id, metric]));
  const coordinates = new Set<string>();
  for (const row of rows) {
    const metric = metrics.get(row.metricId);
    if (row.sourceId !== source.id || !metric || !allowedAreas.has(row.areaCode) || !source.years.includes(row.year) || row.unit !== metric.unit)
      throw Error(`観測値の指標・地域・年・単位が取得指定と一致しません: ${source.id}`);
    if (row.value === null ? !row.missingReason?.trim() : !Number.isFinite(row.value))
      throw Error(`欠測理由または有限値が必要です: ${source.id}`);
    const coordinate = `${row.metricId}/${row.areaCode}/${row.year}`;
    if (coordinates.has(coordinate)) throw Error(`観測値が重複しています: ${coordinate}`);
    coordinates.add(coordinate);
  }
  for (const area of expectedAreas) for (const metric of source.metrics) for (const year of source.years) {
    if (!coordinates.has(`${metric.id}/${area}/${year}`))
      throw Error(`原典の地域・年・項目が欠落しています: ${source.id}/${metric.id}/${area}/${year}`);
  }
}

/** Group by actual source table; a logical analysis can join several tables at the same scope and years. */
export async function fetchResolvedSource(source: ResolvedSource, fetchSource = fetchAnalysisSource) {
  const groupKey = (input: ResolvedSource['inputs'][number]) => JSON.stringify([input.statsDataId, Object.entries(input.filters ?? {}).sort()]);
  const tables = [...new Set(source.inputs.map(groupKey))];
  const parts: (Awaited<ReturnType<typeof fetchAnalysisSource>> & { request: AnalysisSource })[] = [];
  for (const table of tables) {
    const inputs = source.inputs.filter(input => groupKey(input) === table);
    const { statsDataId, filters } = inputs[0];
    const request: AnalysisSource = { id: source.id, statsDataId, ...(filters ? { filters } : {}), grain: source.grain, years: source.years,
      metrics: inputs.map(input => ({ id: input.id, code: input.code, label: input.label, unit: input.rawUnit ?? input.unit })) };
    const result = await fetchSource(request);
    parts.push({ ...result, request });
  }
  const rows = parts.flatMap(part => part.rows.map(row => {
    const input = source.inputs.find(input => input.id === row.metricId && input.statsDataId === part.request.statsDataId);
    if (!input || row.unit !== (input.rawUnit ?? input.unit)) throw Error(`取得原票の指標・単位が一致しません: ${source.id}/${row.metricId}`);
    return { ...row, unit: input.unit };
  })).sort((a, b) => a.metricId.localeCompare(b.metricId) || a.areaCode.localeCompare(b.areaCode) || a.year - b.year);
  validateSourceRows(source, rows);
  return { rows, raw: parts.map(part => ({ request: part.request, raw: part.raw })),
    retrievedAt: new Date().toISOString(), tableTitle: [...new Set(parts.map(part => part.tableTitle))].join(' / ') };
}

/** Existing cached originals can be relabelled only if every acquisition coordinate is unchanged. */
export function relinkCachedRows(previous: AnalysisSource, source: ResolvedSource, rows: AnalysisObservation[]): AnalysisObservation[] {
  if (previous.grain !== source.grain || JSON.stringify(previous.years) !== JSON.stringify(source.years) ||
      previous.metrics.length !== source.inputs.length || new Set(previous.metrics.map(metric => metric.id)).size !== previous.metrics.length ||
      new Set(previous.metrics.map(metric => metric.code)).size !== previous.metrics.length ||
      source.inputs.some(input => input.statsDataId !== previous.statsDataId || JSON.stringify(Object.entries(input.filters ?? {}).sort()) !== JSON.stringify(Object.entries(previous.filters ?? {}).sort())))
    throw Error('取得対象が変わりました。原典の再取得が必要です');
  const mapping = new Map(previous.metrics.map(old => {
    const matches = source.inputs.filter(item => item.code === old.code && (item.rawUnit ?? item.unit) === old.unit);
    const input = matches[0];
    if (matches.length !== 1) throw Error('原典の項目・単位が変わりました。原典の再取得が必要です');
    return [old.id, input];
  }));
  const linked = rows.map(row => {
    const input = mapping.get(row.metricId);
    if (!input || row.sourceId !== previous.id || row.unit !== (input.rawUnit ?? input.unit)) throw Error('取得済み観測値と原典指定が一致しません');
    return { ...row, sourceId: source.id, metricId: input.id, unit: input.unit };
  });
  validateSourceRows(source, linked);
  return linked;
}
