import type { ComponentProps } from 'react';

import {
  PREFECTURE_BOUNDARY_PATH,
  infraHistoryPath,
  municipalityBoundaryPath,
  prefName,
  type ResolvedInfraScope,
} from './infra-history-scope';
import { seriesForScope } from './infra-history-structured-data';

import type { InfraHistoryExplorer, InfraHistoryRow } from '../components/InfraHistoryExplorer';
import type { InfraHistorySummary, InfraNetworkDefinition } from '@stats47/gis/infra-history';

type InfraHistoryExplorerProps = ComponentProps<typeof InfraHistoryExplorer>;

function scopeRows(
  network: InfraNetworkDefinition,
  scope: ResolvedInfraScope,
  summary: InfraHistorySummary,
): { rows: InfraHistoryRow[]; label: string } {
  if (scope.kind === 'prefecture') return { rows: [], label: '' };
  return {
    label: scope.kind === 'national' ? '都道府県別' : `${scope.name}の県別`,
    rows: scope.prefCodes.map((code) => ({
      code,
      name: prefName(code),
      href: infraHistoryPath(network.key, code),
      total: summary.prefectures[code]?.total ?? [],
      byCategory: summary.prefectures[code]?.byCategory ?? {},
    })),
  };
}

/**
 * InfraHistoryExplorer に渡す props (出典の footer を除く)。変遷のページとテーマの節が同じ地図を描くために共有する。
 * 範囲の系列が summary に無ければ null (画面は欠損として表示する)
 */
export function buildInfraHistoryExplorerProps(
  network: InfraNetworkDefinition,
  scope: ResolvedInfraScope,
  summary: InfraHistorySummary,
): Omit<InfraHistoryExplorerProps, 'footer'> | null {
  const series = seriesForScope(summary, scope);
  if (!series) return null;
  const { rows, label } = scopeRows(network, scope, summary);
  return {
    networkLabel: network.label,
    scopeName: scope.name,
    years: summary.years,
    categories: network.categories,
    series,
    rows,
    rowsLabel: label,
    topologyUrl: scope.topologyPath,
    boundaryUrl: PREFECTURE_BOUNDARY_PATH,
    municipalityUrl: scope.kind === 'prefecture' && scope.slug ? municipalityBoundaryPath(scope.slug) : null,
    prefCodes: scope.prefCodes,
    geometry: network.geometry,
    measure: network.measure,
  };
}
