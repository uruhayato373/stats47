import { lookupArea } from '@stats47/area';
import { getMetricConfig, resolveColorScheme } from '@stats47/data-configs';
import { fetchMunicipalityTopology } from '@stats47/gis/server';


import { UrlPolicy } from '@/lib/url-policy';

import { municipalityLeafName } from '../lib/filter-municipality-ranking';

import { MunicipalityCityMapClient } from './MunicipalityCityMapClient';

import type { MunicipalityRankingValue } from '@stats47/ranking/types';
import type { TopoJSONTopology } from '@stats47/types';

interface Props {
  rankingKey: string;
  unit: string;
  /** 5 桁の都道府県コード (?pref=) */
  prefectureCode: string;
  values: readonly MunicipalityRankingValue[];
}

const MIDPOINT_VALUES = ['zero', 'mean', 'median'] as const;

// 東京島嶼部 (伊豆・小笠原諸島)。小笠原が 1,000km 南にあるため fit に含めると本土が
// 極小になる。fit 計算からだけ外し、描画とランキング表からは外さない
// (region-comparison の TOKYO_ISLAND_CODES はデータごと除外する別用途)。
const FIT_EXCLUDE_BY_PREF: Readonly<Record<string, readonly string[]>> = {
  '13000': [
    // 都全域の集約 shape (島嶼を含む MultiPolygon)。これを外さないと island 除外が無効化される
    '13000',
    '13361',
    '13362',
    '13363',
    '13364',
    '13381',
    '13382',
    '13401',
    '13402',
    '13421',
  ],
};

function resolveDivergingMidpoint(
  raw: string | undefined,
  customValue: number | undefined
): 'zero' | 'mean' | 'median' | number {
  if (raw === 'custom' && typeof customValue === 'number') return customValue;
  if ((MIDPOINT_VALUES as readonly string[]).includes(raw ?? '')) {
    return raw as (typeof MIDPOINT_VALUES)[number];
  }
  return 'zero';
}

/**
 * ?pref=XX で絞り込んだときだけ描く県内コロプレス。
 * topology (県別 R2 topojson) はこの Server Component が取得するので、
 * pref 未指定時は一切読み込まれない。取得失敗は地図なしへ degrade する。
 */
export async function MunicipalityRankingMapSection({
  rankingKey,
  unit,
  prefectureCode,
  values,
}: Props) {
  const rows = values.filter((v) => v.prefectureCode === prefectureCode);
  if (rows.length === 0) return null;

  const pref2 = prefectureCode.slice(0, 2);
  const topology = await fetchMunicipalityTopology(pref2, 'merged').catch(
    () => null as TopoJSONTopology | null
  );
  if (!topology) return null;

  const prefName = lookupArea(prefectureCode)?.areaName ?? '';
  const metric = getMetricConfig(rankingKey);
  const decision = resolveColorScheme({
    key: rankingKey,
    explicit: metric?.visualization?.colorScheme ?? null,
    colorSchemeType: metric?.visualization?.colorSchemeType ?? null,
    category: metric?.category ?? null,
  });
  const isDiverging = metric?.visualization?.colorSchemeType === 'diverging';

  const hrefByCode: Record<string, string> = {};
  for (const row of rows) {
    if (UrlPolicy.city.isIndexable(row.prefectureCode, row.areaCode)) {
      hrefByCode[row.areaCode] =
        `/areas/${row.prefectureCode}/cities/${row.areaCode}`;
    }
  }

  return (
    <section aria-label={`${prefName}の分布地図`} className="mt-5">
      <h2 className="text-sm font-semibold">{prefName}の分布地図</h2>
      <div className="mt-2 border border-border p-2">
        <MunicipalityCityMapClient
          topology={topology}
          points={rows.map((row) => ({
            areaCode: row.areaCode,
            areaName: municipalityLeafName(row.areaName),
            value: row.value,
            rank: row.rank,
          }))}
          unit={unit}
          colorScheme={decision.scheme}
          colorSchemeType={isDiverging ? 'diverging' : 'sequential'}
          divergingMidpoint={
            isDiverging
              ? resolveDivergingMidpoint(
                  metric?.visualization?.divergingMidpoint,
                  metric?.visualization?.divergingMidpointValue
                )
              : undefined
          }
          hrefByCode={hrefByCode}
          fitExcludeCodes={
            FIT_EXCLUDE_BY_PREF[prefectureCode]
              ? [...FIT_EXCLUDE_BY_PREF[prefectureCode]]
              : undefined
          }
        />
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        政令指定都市は市単位で表示しています。灰色は比較対象外
        (データなし) の地域です。
        {FIT_EXCLUDE_BY_PREF[prefectureCode]
          ? '島嶼部は初期表示範囲の外にあります (地図を縮小すると表示されます)。'
          : ''}
      </p>
    </section>
  );
}
