import { lookupArea, to2DigitPrefCode } from '@stats47/area';
import { hrefFor } from '@stats47/data-configs/content/href';
import { formatUnitForDisplay } from "@stats47/data-configs/unit";
import { fetchMunicipalityTopologyForWardMode } from '@stats47/gis/server';
import { municipalityLeafName } from '@stats47/ranking';

import { SectionHeader } from '@/components/section';

import { UrlPolicy } from '@/lib/url-policy';


import { MunicipalityCityMapClient } from './MunicipalityCityMapClient';

import type { MunicipalityRankingValue } from '@stats47/ranking/types';
import type { MetricPresentation, TopoJSONTopology } from '@stats47/types';

import { TOKYO_ISLAND_EXCLUDE_CODES } from '@/constants/tokyo-islands';

interface Props {
  visualization: MetricPresentation;
  unit: string;
  /** 5 桁の都道府県コード (?pref=) */
  prefectureCode: string;
  values: readonly MunicipalityRankingValue[];
}


// 東京島嶼部 (伊豆・小笠原諸島)。小笠原が 1,000km 南にあるため fit に含めると本土が
// 極小になる。fit 計算からだけ外し、描画とランキング表からは外さない
// (region-comparison の TOKYO_ISLAND_CODES はデータごと除外する別用途)。
const FIT_EXCLUDE_BY_PREF: Readonly<Record<string, readonly string[]>> = {
  // 都全域の集約 shape 13000 (島嶼を含む MultiPolygon) も含む。外さないと island 除外が無効化される
  '13000': TOKYO_ISLAND_EXCLUDE_CODES,
};

/**
 * ?pref=XX で絞り込んだときだけ描く県内コロプレス。
 * topology (県別 R2 topojson) はこの Server Component が取得するので、
 * pref 未指定時は一切読み込まれない。取得失敗は地図なしへ degrade する。
 */
export async function MunicipalityRankingMapSection({
  visualization,
  unit,
  prefectureCode,
  values,
}: Props) {
  const rows = values.filter((v) => v.prefectureCode === prefectureCode);
  if (rows.length === 0) return null;

  const pref2 = to2DigitPrefCode(prefectureCode);
  // 市区町村ランキングは基礎自治体の単位 (政令指定都市は市全体・特別区は区ごと) なので merged の地図を使う
  const topology = await fetchMunicipalityTopologyForWardMode(pref2, 'merged').catch(
    () => null as TopoJSONTopology | null
  );
  if (!topology) return null;

  const prefName = lookupArea(prefectureCode)?.areaName ?? '';

  const hrefByCode: Record<string, string> = {};
  for (const row of rows) {
    if (UrlPolicy.city.isIndexable(row.prefectureCode, row.areaCode)) {
      hrefByCode[row.areaCode] =
        hrefFor('city', { areaCode: row.prefectureCode, cityCode: row.areaCode });
    }
  }

  return (
    <section aria-label={`${prefName}の分布地図`} className="mt-5">
      <SectionHeader title={`${prefName}の分布地図`} hideRule className="mb-0" />
      <div className="mt-2 border border-border p-2">
        <MunicipalityCityMapClient
          topology={topology}
          points={rows.map((row) => ({
            areaCode: row.areaCode,
            areaName: municipalityLeafName(row.areaName),
            value: row.value,
            rank: row.rank,
          }))}
          unit={formatUnitForDisplay(unit)}
          visualization={visualization}
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
