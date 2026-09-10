import type {
  MigrationDemographicsProfile,
  SingleHouseholdsProfile,
  FiveYearResidenceProfile,
} from '@stats47/data-configs/theme-catalog';

export type PopulationSex = '0' | '1' | '2';
export const SEX_LABELS: Record<PopulationSex, string> = {
  '0': '男女計',
  '1': '男性',
  '2': '女性',
};
export const PROFILE_KEYS = {
  migration: 'app/themes/population-dynamics/migration-demographics.json',
  households: 'app/themes/living-housing/single-households-demographics.json',
  residence: 'app/themes/population-dynamics/five-year-residence.json',
} as const;
export function isPopulationSex(value: string): value is PopulationSex {
  return value === '0' || value === '1' || value === '2';
}
export function formatPopulationCount(value: number, digits = 0) {
  return value.toLocaleString('ja-JP', { maximumFractionDigits: digits });
}
function selectedArea<T extends { areaCode: string }>(
  snapshot: { areas: T[]; national: T },
  code: string | null
): T | null {
  if (code === null || code === '00000') return snapshot.national;
  return snapshot.areas.find((area) => area.areaCode === code) ?? null;
}
function sexValue(values: number[][], sex: PopulationSex, age: number): number {
  return sex === '0'
    ? values[0][age] + values[1][age]
    : values[Number(sex) - 1][age];
}
export interface MigrationDisplayRow {
  areaCode: string;
  areaName: string;
  inbound: number;
  outbound: number;
  net: number;
}
export function selectMigrationView(
  snapshot: MigrationDemographicsProfile,
  areaCode: string | null,
  sex: PopulationSex,
  ageCode: string,
  partnerCode = 'all'
) {
  const area = selectedArea(snapshot, areaCode);
  const ageIndex = snapshot.ages.findIndex((age) => age.code === ageCode);
  if (!area || ageIndex < 0 || !isPopulationSex(sex)) return null;
  const isNational = area.areaCode === '00000';
  const partners = snapshot.areas.filter(
    (partner) => partner.areaCode !== area.areaCode
  );
  if (
    !isNational &&
    partnerCode !== 'all' &&
    !partners.some((partner) => partner.areaCode === partnerCode)
  )
    return null;
  let rows: MigrationDisplayRow[];
  if (isNational) {
    rows = snapshot.areas.map((row) => {
      const inbound = sexValue(row.inbound, sex, ageIndex);
      const outbound = sexValue(row.outbound, sex, ageIndex);
      return {
        areaCode: row.areaCode,
        areaName: row.areaName,
        inbound,
        outbound,
        net: inbound - outbound,
      };
    });
  } else {
    rows = partners
      .filter(
        (partner) => partnerCode === 'all' || partner.areaCode === partnerCode
      )
      .map((partner) => {
        const incoming = snapshot.flows.find(
          (flow) =>
            flow.originAreaCode === partner.areaCode &&
            flow.destinationAreaCode === area.areaCode
        );
        const outgoing = snapshot.flows.find(
          (flow) =>
            flow.originAreaCode === area.areaCode &&
            flow.destinationAreaCode === partner.areaCode
        );
        if (!incoming || !outgoing)
          throw Error('Validated population profile has a missing flow');
        const inbound = sexValue(incoming.counts, sex, ageIndex);
        const outbound = sexValue(outgoing.counts, sex, ageIndex);
        return {
          areaCode: partner.areaCode,
          areaName: partner.areaName,
          inbound,
          outbound,
          net: inbound - outbound,
        };
      });
  }
  const total = rows.reduce(
    (sum, row) => ({
      inbound: sum.inbound + row.inbound,
      outbound: sum.outbound + row.outbound,
      net: sum.net + row.net,
    }),
    { inbound: 0, outbound: 0, net: 0 }
  );
  return {
    area,
    isNational,
    partners,
    rows,
    total,
    ageLabel: snapshot.ages[ageIndex].label,
    withinPrefecture: area.withinPrefecture
      ? sexValue(area.withinPrefecture, sex, ageIndex)
      : null,
    ageResidual: sexValue(area.inbound, sex, snapshot.ages.length - 1),
  };
}
const RESIDENCE_LABELS: Record<string, string> = {
  '001': '5年前と同じ住所',
  '00211': '同じ市町村内の別住所',
  '00212': '同じ県の他市町村',
  '00213': '他の都道府県',
  '0022': '国外',
  '003': '5年前の常住市区町村が不詳',
  '004': '移動状況が不詳',
};
export function selectPartitionView(
  snapshot: SingleHouseholdsProfile | FiveYearResidenceProfile,
  areaCode: string | null,
  sex: PopulationSex
) {
  const area = selectedArea(snapshot, areaCode);
  if (!area || !isPopulationSex(sex)) return null;
  const selected = area.bySex.find((point) => point.sex === sex);
  if (!selected) return null;
  const classes =
    snapshot.kind === 'single-households-demographics'
      ? snapshot.ages
      : snapshot.classes;
  return {
    area,
    total: selected.total,
    rows: classes.map((point, index) => ({
      code: point.code,
      label:
        snapshot.kind === 'five-year-residence'
          ? RESIDENCE_LABELS[point.code]
          : point.label,
      value: selected.counts[index],
      share:
        selected.total === 0
          ? null
          : (selected.counts[index] / selected.total) * 100,
    })),
  };
}

/** Six adopted metrics share this exact projection with the release consistency gate. */
export function getPopulationProfileMetricValue(
  snapshot:
    | MigrationDemographicsProfile
    | SingleHouseholdsProfile
    | FiveYearResidenceProfile,
  metricKey: string,
  areaCode: string
): number | null {
  if (snapshot.kind === 'interprefecture-migration-demographics') {
    const codes =
      metricKey === 'interprefecture-net-migration-age15to24'
        ? ['204', '205']
        : metricKey === 'interprefecture-net-migration-age25to34'
          ? ['206', '207']
          : null;
    const area = selectedArea(snapshot, areaCode);
    if (!codes || !area) return null;
    return codes.reduce((value, code) => {
      const index = snapshot.ages.findIndex((age) => age.code === code);
      if (index < 0) throw Error('Missing age class in validated profile');
      return (
        value +
        sexValue(area.inbound, '0', index) -
        sexValue(area.outbound, '0', index)
      );
    }, 0);
  }
  if (snapshot.kind === 'single-households-demographics') {
    const sex =
      metricKey === 'single-households-age65plus-male'
        ? '1'
        : metricKey === 'single-households-age65plus-female'
          ? '2'
          : null;
    if (!sex) return null;
    const view = selectPartitionView(snapshot, areaCode, sex);
    return view
      ? view.rows
          .filter((row) => ['12', '13', '14', '15', '16'].includes(row.code))
          .reduce((value, row) => value + row.value, 0)
      : null;
  }
  const code =
    metricKey === 'five-year-residence-same-address'
      ? '001'
      : metricKey === 'five-year-residence-other-prefecture'
        ? '00213'
        : null;
  if (!code) return null;
  return (
    selectPartitionView(snapshot, areaCode, '0')?.rows.find(
      (row) => row.code === code
    )?.value ?? null
  );
}
