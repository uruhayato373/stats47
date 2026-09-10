import {
  validatePublicFacilityDetail,
  type GeoAnalysisSnapshotRow,
  type GeoPublicFacilityPrefDetail,
} from '@stats47/gis';

export const PUBLIC_FACILITY_GROUPS = {
  administrative: '市町村役場・支所・行政サービス施設',
  meeting: '公民館・公的集会施設',
} as const;
export type PublicFacilityGroup = keyof typeof PUBLIC_FACILITY_GROUPS;
export const PUBLIC_FACILITY_BAND_LABELS = [
  '500m以内',
  '500m超〜1km以内',
  '1km超〜3km以内',
  '3km超〜5km以内',
  '5km超',
] as const;
export const PUBLIC_FACILITY_BAND_COLORS = [
  '#0f766e',
  '#0284c7',
  '#d97706',
  '#c2410c',
  '#7f1d1d',
] as const;
export const PUBLIC_FACILITY_LIMIT =
  '1km人口メッシュ中心から原典施設地点までの大円距離です。500m帯は粗い近似で、各住居からの道路距離・徒歩時間ではありません。施設位置は2022年4月固定、2020年人口と2050年推計人口を比較します。県外の最寄り施設を含み、窓口の利用資格・業務・開館時間・将来の施設存続は判定しません。';

export function parseGeoPublicFacilityPrefDetail(
  value: unknown,
  expectedAreaCode: string
): GeoPublicFacilityPrefDetail | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    return null;
  const detail = value as GeoPublicFacilityPrefDetail;
  if (
    detail.schemaVersion !== 1 ||
    detail.slug !== 'population-public-facility-access' ||
    detail.areaCode !== expectedAreaCode ||
    !/^(0[1-9]|[1-3][0-9]|4[0-7])000$/.test(expectedAreaCode) ||
    typeof detail.generatedAt !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T/.test(detail.generatedAt) ||
    !Number.isFinite(Date.parse(detail.generatedAt))
  )
    return null;
  try {
    validatePublicFacilityDetail(detail);
    return detail;
  } catch {
    return null;
  }
}

const numeric = (
  values: Readonly<Record<string, number | null>>,
  key: string
): number => {
  const value = values[key];
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    throw new Error(`Invalid public-facility value: ${key}`);
  return value;
};

/** Reject omitted bands, averaged ratios, and cross-group population addition. */
export function validPublicFacilityRows(
  rows: readonly GeoAnalysisSnapshotRow[]
): boolean {
  try {
    if (
      rows.length !== 47 ||
      new Set(rows.map((row) => row.areaCode)).size !== 47
    )
      return false;
    for (const row of rows)
      for (const group of ['administrative', 'meeting'] as const) {
        if (!Number.isSafeInteger(numeric(row.values, `${group}FacilityCount`)))
          return false;
        for (const year of [2020, 2050] as const) {
          const total = numeric(row.values, `population${year}`);
          let sum = 0;
          for (let band = 0; band < 5; band++) {
            const value = numeric(
              row.values,
              `${group}Band${band}Population${year}`
            );
            const share = row.values[`${group}Band${band}Share${year}`];
            if (
              total === 0
                ? share !== null
                : typeof share !== 'number' ||
                  Math.abs(share - (value / total) * 100) > 1e-7
            )
              return false;
            sum += value;
          }
          if (Math.abs(sum - total) > Math.max(1e-6, total * 1e-12))
            return false;
          const within =
            numeric(row.values, `${group}Band0Population${year}`) +
            numeric(row.values, `${group}Band1Population${year}`);
          if (
            Math.abs(
              numeric(row.values, `${group}Within1000mPopulation${year}`) -
                within
            ) > Math.max(1e-6, total * 1e-12)
          )
            return false;
          const share = row.values[`${group}Within1000mShare${year}`];
          if (
            total === 0
              ? share !== null
              : typeof share !== 'number' ||
                Math.abs(share - (within / total) * 100) > 1e-7
          )
            return false;
        }
      }
    return true;
  } catch {
    return false;
  }
}

/** National is a sum of the same population once per facility group, never a mean of prefecture ratios. */
export function publicFacilityNationalValues(
  rows: readonly GeoAnalysisSnapshotRow[]
): Record<string, number | null> {
  const values: Record<string, number | null> = {};
  const sum = (key: string) =>
    rows.reduce((total, row) => total + numeric(row.values, key), 0);
  for (const year of [2020, 2050] as const)
    values[`population${year}`] = sum(`population${year}`);
  for (const group of ['administrative', 'meeting'] as const) {
    values[`${group}FacilityCount`] = sum(`${group}FacilityCount`);
    for (const year of [2020, 2050] as const) {
      const total = Number(values[`population${year}`]);
      for (let band = 0; band < 5; band++) {
        const value = sum(`${group}Band${band}Population${year}`);
        values[`${group}Band${band}Population${year}`] = value;
        values[`${group}Band${band}Share${year}`] =
          total > 0 ? (value / total) * 100 : null;
      }
    }
  }
  return values;
}

export function publicFacilityAuditRows(
  detail: GeoPublicFacilityPrefDetail
): { label: string; value: string }[] {
  const people = (value: number) =>
    `${Math.round(value).toLocaleString('ja-JP')}人`;
  return (['administrative', 'meeting'] as const).flatMap((group) => {
    const bands = detail.summary[group];
    return [
      ...([2020, 2050] as const).map((year) => ({
        label: `${PUBLIC_FACILITY_GROUPS[group]}・${year}年：5帯の合計 = 入力人口`,
        value: `${people(bands.reduce((sum, band) => sum + band[`population${year}`], 0))} = ${people(detail.meshes.reduce((sum, mesh) => sum + mesh[year === 2020 ? 3 : 4], 0))}`,
      })),
      {
        label: `${PUBLIC_FACILITY_GROUPS[group]}：5帯メッシュ合計 / 県外最寄り`,
        value: `${bands.reduce((sum, band) => sum + band.meshCount, 0).toLocaleString('ja-JP')} / ${bands.reduce((sum, band) => sum + band.crossPrefNearest, 0).toLocaleString('ja-JP')}メッシュ`,
      },
    ];
  });
}
