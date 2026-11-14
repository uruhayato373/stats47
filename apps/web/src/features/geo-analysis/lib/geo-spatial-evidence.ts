import { GEO_MAP_COLORS } from './geo-map.palette';
import { publicFacilityAuditRows } from './geo-public-facility-evidence';

import type { GeoAnalysisPrefDetail } from '@stats47/gis';
import type { FeatureCollection, Polygon } from 'geojson';


export type SpatialView = 'population' | 'facilities' | 'overlap' | 'audit';
export function isGeoSpatialView(
  value: string | undefined,
  slug: string
): value is SpatialView {
  return (
    value === 'population' ||
    value === 'overlap' ||
    value === 'audit' ||
    ((slug === 'population-public-facility-access' || slug === 'population-landslide-exposure') && value === 'facilities')
  );
}

export const LOW_ELEVATION_POPULATION_LEGEND =
  '2020年人口：灰＝0人、薄青＝100人未満、青＝1,000人未満、濃青＝5,000人未満、最濃＝5,000人以上（1kmメッシュあたり）。';

export const POPULATION_LEGEND =
  '人口変化：青緑＝維持・増加、青＝15%未満減少、橙＝15〜30%減少、赤＝30%以上減少、灰＝基準人口0。';

export function landPointCategory(
  detail: Extract<GeoAnalysisPrefDetail, { slug: 'population-land-price' }>,
  index: number,
  meshes: ReadonlyMap<
    string,
    Exclude<GeoAnalysisPrefDetail, { slug: 'population-snow-designation' | 'population-landslide-exposure' | 'population-low-elevation' }>['meshes'][number]
  > = new Map(detail.meshes.map((mesh) => [mesh[0], mesh]))
) {
  const point = detail.landPricePoints[index];
  const id = detail.pointMeshIds[index];
  const mesh = id ? meshes.get(id) : undefined;
  if (!point || !mesh) return { label: '人口メッシュ未接続', color: GEO_MAP_COLORS.landPriceCategory.unlinked };
  if (point[4] === null || mesh[5] <= 0)
    return { label: '比較対象外', color: GEO_MAP_COLORS.landPriceCategory.unlinked };
  const rising = point[4] > 0;
  const declining = mesh[6] < mesh[5];
  if (rising && declining)
    return { label: '地価上昇 × 人口減少', color: GEO_MAP_COLORS.landPriceCategory.risingDecline };
  if (rising) return { label: '地価上昇 × 人口維持・増加', color: GEO_MAP_COLORS.landPriceCategory.risingGrowth };
  if (declining)
    return { label: '地価横ばい・下落 × 人口減少', color: GEO_MAP_COLORS.landPriceCategory.flatDecline };
  return { label: '地価横ばい・下落 × 人口維持・増加', color: GEO_MAP_COLORS.landPriceCategory.flatGrowth };
}

export function buildSpatialMeshMap(
  detail: Exclude<
    GeoAnalysisPrefDetail,
    { slug: 'population-public-facility-access' | 'population-snow-designation' | 'population-landslide-exposure' | 'population-low-elevation' }
  >
): FeatureCollection<Polygon> {
  return {
    type: 'FeatureCollection',
    features: detail.meshes.map((mesh) => {
      const [id, w, s, e, n, p2020, p2050] = mesh;
      return {
        type: 'Feature',
        id,
        properties: {
          id,
          p2020,
          p2050,
          change: p2020 > 0 ? ((p2050 - p2020) / p2020) * 100 : null,
          included: (mesh[7] ?? 0) > 0,
        },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [w / 1e6, s / 1e6],
              [e / 1e6, s / 1e6],
              [e / 1e6, n / 1e6],
              [w / 1e6, n / 1e6],
              [w / 1e6, s / 1e6],
            ],
          ],
        },
      };
    }),
  };
}

/**
 * 検算の 1 行。数値タイル (値 24px) に出すので、`value` には式の結果 (合計・比率・一致の判定) だけを入れ、
 * 内訳の式 (「A + B + C」「分子 / 分母」) は `meta` (値の下の補足・12px) に分ける。
 * 式を丸ごと値に入れると、4 列のマスで 1 枚が 5〜7 行になる (UI-FOLLOWUP-01)。
 */
export interface SpatialAuditRow {
  /** 何の検算か。式の行は「内訳 = 結果」の名前を書く */
  label: string;
  /** 式の結果 */
  value: string;
  /** 内訳の式。結果が 1 つだけの行は持たない */
  meta?: string;
}

function lowElevationAuditRows(
  detail: Extract<GeoAnalysisPrefDetail, { slug: 'population-low-elevation' }>
): SpatialAuditRow[] {
  const s = detail.summary;
  const people = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}人`;
  const percent = (v: number | null) => (v === null ? '—' : `${v.toFixed(1)}%`);
  const [five] = s.thresholds.filter((row) => row.thresholdM === 5);
  return [
    {
      label: '標高不明 + 0m以下 + 0m超5m以下 + 5m超10m以下 + 10m超 = 県の1kmメッシュ人口',
      value: people(s.population2020),
      meta: s.bands.map((band) => people(band.population)).join(' + '),
    },
    {
      label: '1kmメッシュ人口の合計 / 国勢調査2020の都道府県人口',
      value: s.conservation.matchesCensus ? '一致' : '不一致',
      meta: `${people(s.conservation.meshPopulation)} / ${people(s.conservation.censusPopulation2020)}`,
    },
    {
      label: '平均標高5m以下の人口 / 県の人口',
      value: five ? percent(five.meanBased.sharePercent) : '—',
      meta: five ? `${people(five.meanBased.population)} / ${people(s.population2020)}` : undefined,
    },
    // 基準高ごとに 1 行。3 つの基準高を 1 枚に並べると値が 3 行になる
    ...s.thresholds.map((row) => ({
      label: `${row.thresholdM}m以下の人口割合（平均標高基準 / 最低標高基準）`,
      value: `${percent(row.meanBased.sharePercent)} / ${percent(row.minBased.sharePercent)}`,
    })),
  ];
}

/**
 * 1 万倍で持つ按分人口 (豪雪・土砂災害) を、数値タイルの値として人の単位に丸めて書く。
 * 小数 4 桁のまま値に入れると「2,201,271.9866人」が幅 1280px の 4 列のマスに収まらず、末尾の「人」だけが
 * 2 行目に折り返す (UI-FOLLOWUP-02)。丸め前の値は補足の内訳に残し、検算は丸め前の値で行う。
 */
function scaledPeopleValue(scaled: number): string {
  return `${Math.round(scaled / 10000).toLocaleString('ja-JP')}人`;
}

export function spatialAuditRows(
  detail: GeoAnalysisPrefDetail
): SpatialAuditRow[] {
  if (detail.slug === 'population-landslide-exposure') {
    // 理由の文章は値 (24px) に入れず補足 (12px) に置く。値に入れると 1 枚が 5 行になる (UI-FOLLOWUP-02)
    if (detail.status !== 'available') return [{ label: '土砂災害警戒区域の人口と施設', value: '対象外', meta: detail.reason }];
    const s=detail.summary, people=(v:number)=>(v/10000).toLocaleString('ja-JP',{maximumFractionDigits:4});
    return [
      { label: '入力面外 + 警戒のみ + 特別 = 基準人口', value: scaledPeopleValue(s.totalScaled), meta: s.exclusiveScaled.map(people).join(' + ') },
      { label: '市町村役場等：入力面外 + 警戒のみ + 特別 = 全施設', value: `${s.facilities.administrative.totalScaled}施設`, meta: s.facilities.administrative.exclusiveScaled.join(' + ') },
      { label: '公的集会施設：入力面外 + 警戒のみ + 特別 = 全施設', value: `${s.facilities.meeting.totalScaled}施設`, meta: s.facilities.meeting.exclusiveScaled.join(' + ') },
    ];
  }
  if (detail.slug === 'population-public-facility-access')
    return publicFacilityAuditRows(detail);
  if (detail.slug === 'population-low-elevation') return lowElevationAuditRows(detail);
  if (detail.slug === 'population-snow-designation') {
    const s=detail.summary, people=(v:number)=>`${(v/10000).toLocaleString('ja-JP',{maximumFractionDigits:4})}人`;
    return [
      {label:'区域外 + 通常豪雪 + 特別豪雪 = 基準人口',value:scaledPeopleValue(s.populationTotalScaled),meta:s.populationScaled.map(people).join(' + ')},
      // 採る値は中心包含。格子全体が区域に入る人口 (全格子包含) と、区域に少しでも掛かる格子の人口 (一部交差) が下限と上限
      {label:'指定区域の人口：中心包含（全格子包含 〜 一部交差）',value:scaledPeopleValue(s.populationScaled[1]+s.populationScaled[2]),meta:`全格子包含 ${people(s.lowerScaled[0])} 〜 一部交差 ${people(s.upperScaled[0])}`},
      {label:'境界を横切る格子人口',value:scaledPeopleValue(s.boundaryScaled[0])},
      {label:'通常区域 + 特別区域 = 指定区域面積',value:`${s.designatedAreaKm2.toFixed(3)} km²`,meta:`${s.regularOnlyAreaKm2.toFixed(3)} + ${s.specialAreaKm2.toFixed(3)}`},
    ];
  }
  const people = (v: number) => `${Math.round(v).toLocaleString('ja-JP')}人`;
  if (detail.slug === 'population-land-price') {
    const s = detail.summary;
    return [
      {
        label: '接続地点 + 未接続地点 = 全住宅地点',
        value: `${s.pointCount}地点`,
        meta: `${s.matchedPointCount} + ${s.unmatchedPointCount}`,
      },
      {
        label: '比較可能 / 接続したが比較不能',
        value: `${s.comparablePointCount} / ${s.matchedPointCount - s.comparablePointCount}地点`,
      },
      {
        label: '地価上昇 × 人口減少 / 比較可能地点',
        value: s.risingDecliningPointShare === null ? '算出不可' : `${s.risingDecliningPointShare}%`,
        meta: `${s.risingDecliningPointCount} / ${s.comparablePointCount}地点`,
      },
    ];
  }
  const s = detail.summary;
  const inside2020 =
    detail.slug === 'population-flood-risk'
      ? detail.summary.exposedPopulation2020
      : detail.summary.accessiblePopulation2020;
  const inside2050 =
    detail.slug === 'population-flood-risk'
      ? detail.summary.exposedPopulation2050
      : detail.summary.accessiblePopulation2050;
  return [
    {
      label: '2020年：判定内 + 判定外 = 全人口',
      value: people(s.population2020),
      meta: `${people(inside2020)} + ${people(s.population2020 - inside2020)}`,
    },
    {
      label: '2050年：判定内 + 判定外 = 全人口',
      value: people(s.population2050),
      meta: `${people(inside2050)} + ${people(s.population2050 - inside2050)}`,
    },
    {
      label: '同じ空間条件で比較した人口比率',
      value: `${s.population2020 > 0 ? ((inside2020 / s.population2020) * 100).toFixed(1) : '—'}% → ${s.population2050 > 0 ? ((inside2050 / s.population2050) * 100).toFixed(1) : '—'}%`,
    },
  ];
}
