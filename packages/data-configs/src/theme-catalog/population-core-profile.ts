/** Population profiles: direct official cells, distinct populations/years, no imputed unknowns. */
type ClassLabel = { code: string; label: string };
type SourcePin = {
  tableId: string;
  url: string;
  parameters: Record<string, string>;
  rawSha256: string;
  statisticalDataSha256: string;
  bytes: number;
  fetchedAt: string;
};
type Common = {
  schemaVersion: 1;
  period: string;
  unit: string;
  generatedAt: string;
  population: string;
  sources: SourcePin[];
  notes: string[];
};
export type MigrationDemographicsArea = {
  areaCode: string;
  areaName: string;
  inbound: number[][];
  outbound: number[][];
  withinPrefecture?: number[][];
};
export type MigrationDemographicsProfile = Common & {
  kind: 'interprefecture-migration-demographics';
  sexes: ['1', '2'];
  ages: ClassLabel[];
  areas: MigrationDemographicsArea[];
  national: MigrationDemographicsArea;
  flows: {
    originAreaCode: string;
    destinationAreaCode: string;
    counts: number[][];
  }[];
};
export type PopulationPartitionArea = {
  areaCode: string;
  areaName: string;
  bySex: { sex: string; total: number; counts: number[] }[];
};
export type SingleHouseholdsProfile = Common & {
  kind: 'single-households-demographics';
  ages: ClassLabel[];
  areas: PopulationPartitionArea[];
  national: PopulationPartitionArea;
};
export type FiveYearResidenceProfile = Common & {
  kind: 'five-year-residence';
  comparisonDate: '2015-10-01';
  classes: ClassLabel[];
  areas: PopulationPartitionArea[];
  national: PopulationPartitionArea;
};
export type PopulationCoreProfile =
  | MigrationDemographicsProfile
  | SingleHouseholdsProfile
  | FiveYearResidenceProfile;
const PREFS = Array.from(
  { length: 47 },
  (_, i) => String(i + 1).padStart(2, '0') + '000'
);
function insist(value: unknown, message: string): asserts value {
  if (!value) throw Error('population profile: ' + message);
}
function object(v: unknown): Record<string, unknown> {
  insist(typeof v === 'object' && v !== null && !Array.isArray(v), 'object');
  return v as Record<string, unknown>;
}
function list(v: unknown): unknown[] {
  insist(Array.isArray(v), 'array');
  return v;
}
function same(a: unknown, b: unknown, label: string) {
  insist(JSON.stringify(a) === JSON.stringify(b), label);
}
function count(v: unknown): number {
  insist(
    typeof v === 'number' && Number.isSafeInteger(v) && v >= 0,
    'nonnegative integer'
  );
  return v;
}
function text(v: unknown): string {
  insist(typeof v === 'string' && v.length > 0, 'text');
  return v;
}
function exact(v: Record<string, unknown>, keys: string[]) {
  same(Object.keys(v).sort(), keys.sort(), 'unexpected/missing keys');
}
const sum = (v: number[]) => v.reduce((s, n) => s + n, 0);
function vec(v: unknown, length: number): number[] {
  const a = list(v).map(count);
  same(a.length, length, 'vector length');
  return a;
}
function sexMatrix(v: unknown): number[][] {
  const a = list(v).map((r) => vec(r, 21));
  same(a.length, 2, 'two sexes');
  for (const r of a)
    same(sum(r.slice(1)), r[0], 'age partition includes residual');
  return a;
}
function add(v: number[][]): number[] {
  insist(v.length > 0, 'empty sum');
  return v[0].map((_, i) => sum(v.map((r) => r[i])));
}
function labels(value: unknown, codes: string[]) {
  const rows = list(value);
  same(
    rows.map((r) => object(r).code),
    codes,
    'class identity'
  );
  for (const r of rows) {
    exact(object(r), ['code', 'label']);
    text(object(r).label);
  }
}
const SOURCE_QUERIES: Record<string, Record<string, string>> = {
  '0003419946': {
    statsDataId: '0003419946',
    cdTime: '2025000000',
    cdCat01: PREFS.join(','),
    cdCat03: '1,2',
    cdCat04: '60000',
    lvArea: '1-2',
    limit: '100000',
  },
  '0003419944': {
    statsDataId: '0003419944',
    cdTime: '2025000000',
    cdTab: '02,03,04',
    cdCat03: '60000',
    lvArea: '1-2',
    limit: '100000',
  },
  '0003445081': {
    statsDataId: '0003445081',
    cdTime: '2020000000',
    cdCat02: '0',
    cdCat04: '3',
    lvArea: '1-2',
    limit: '100000',
  },
  '0003447398': {
    statsDataId: '0003447398',
    cdTime: '2020000000',
    cdCat02: 'R1',
    lvArea: '1-2',
    limit: '100000',
  },
};
function source(value: unknown, ids: string[]) {
  const rows = list(value);
  same(
    rows.map((r) => object(r).tableId),
    ids,
    'source table identity'
  );
  for (const raw of rows) {
    const r = object(raw);
    exact(r, [
      'tableId',
      'url',
      'parameters',
      'rawSha256',
      'statisticalDataSha256',
      'bytes',
      'fetchedAt',
    ]);
    same(
      r.url,
      'https://www.e-stat.go.jp/dbview?sid=' + r.tableId,
      'official source url'
    );
    const query = object(r.parameters);
    same(
      Object.keys(query).sort(),
      Object.keys(SOURCE_QUERIES[String(r.tableId)]).sort(),
      'source query keys'
    );
    for (const [k, v] of Object.entries(SOURCE_QUERIES[String(r.tableId)]))
      same(query[k], v, 'source query ' + k);
    for (const hash of [r.rawSha256, r.statisticalDataSha256])
      insist(
        typeof hash === 'string' && /^[a-f0-9]{64}$/.test(hash),
        'source SHA'
      );
    insist(count(r.bytes) > 0, 'source bytes');
    insist(Number.isFinite(Date.parse(text(r.fetchedAt))), 'source date');
    insist(
      !Object.keys(object(r.parameters)).some((k) => /appid/i.test(k)),
      'credential leak'
    );
  }
}
function areaNames(value: unknown, national: unknown) {
  const rows = list(value);
  same(
    rows.map((r) => object(r).areaCode),
    PREFS,
    '47 ordered unique prefectures'
  );
  for (const r of rows) text(object(r).areaName);
  same(object(national).areaCode, '00000', 'national identity');
  same(object(national).areaName, '全国', 'national name');
}
export function parsePopulationCoreProfile(
  value: unknown
): PopulationCoreProfile {
  const p = object(value);
  same(p.schemaVersion, 1, 'version');
  insist(Number.isFinite(Date.parse(text(p.generatedAt))), 'generation date');
  text(p.population);
  list(p.notes).forEach(text);
  areaNames(p.areas, p.national);
  const common = [
    'schemaVersion',
    'kind',
    'period',
    'unit',
    'generatedAt',
    'population',
    'sources',
    'notes',
    'areas',
    'national',
  ];
  if (p.kind === 'interprefecture-migration-demographics') {
    exact(p, [...common, 'sexes', 'ages', 'flows']);
    same(p.period, '2025', 'migration period');
    same(p.unit, '人', 'migration unit');
    same(
      p.population,
      '移動者（外国人を含む）、国内の住所移動、男女別',
      'migration population'
    );
    same(p.sexes, ['1', '2'], 'sex identity');
    source(p.sources, ['0003419946', '0003419944']);
    labels(p.ages, [
      '000',
      ...Array.from({ length: 18 }, (_, i) => String(i + 201)),
      '402',
      'unallocated',
    ]);
    const areas = list(p.areas).map(object),
      national = object(p.national),
      flows = list(p.flows).map(object);
    same(flows.length, 47 * 46, 'complete offdiagonal OD matrix');
    const seen = new Set<string>();
    const inbound = new Map(PREFS.map((c) => [c, [] as number[][][]])),
      outbound = new Map(PREFS.map((c) => [c, [] as number[][][]]));
    for (const f of flows) {
      exact(f, ['originAreaCode', 'destinationAreaCode', 'counts']);
      const origin = text(f.originAreaCode),
        destination = text(f.destinationAreaCode);
      insist(
        PREFS.includes(origin) &&
          PREFS.includes(destination) &&
          origin !== destination,
        'offdiagonal prefectures'
      );
      const key = origin + '|' + destination;
      insist(!seen.has(key), 'duplicate OD pair');
      seen.add(key);
      const values = sexMatrix(f.counts);
      inbound.get(destination)!.push(values);
      outbound.get(origin)!.push(values);
    }
    for (const a of areas) {
      exact(a, [
        'areaCode',
        'areaName',
        'inbound',
        'outbound',
        'withinPrefecture',
      ]);
      const code = text(a.areaCode),
        i = sexMatrix(a.inbound),
        o = sexMatrix(a.outbound);
      sexMatrix(a.withinPrefecture);
      for (let s = 0; s < 2; s++) {
        same(
          i[s],
          add(inbound.get(code)!.map((f) => f[s])),
          'inbound reconstruction'
        );
        same(
          o[s],
          add(outbound.get(code)!.map((f) => f[s])),
          'outbound reconstruction'
        );
      }
    }
    exact(national, ['areaCode', 'areaName', 'inbound', 'outbound']);
    const ni = sexMatrix(national.inbound),
      no = sexMatrix(national.outbound);
    for (let s = 0; s < 2; s++) {
      same(
        ni[s],
        add(areas.map((a) => (a.inbound as number[][])[s])),
        'national inbound'
      );
      same(
        no[s],
        add(areas.map((a) => (a.outbound as number[][])[s])),
        'national outbound'
      );
      same(ni[s], no[s], 'national inflow-outflow conservation');
    }
    same(sum(ni.map((r) => r[0])), 2515731, 'official national migration');
    same(sum(ni.map((r) => r[20])), 2, 'age residual preserved');
  } else {
    const household = p.kind === 'single-households-demographics';
    insist(household || p.kind === 'five-year-residence', 'kind');
    exact(
      p,
      household ? [...common, 'ages'] : [...common, 'classes', 'comparisonDate']
    );
    same(p.period, '2020-10-01', 'census period');
    same(p.unit, household ? '世帯' : '人', 'census unit');
    source(p.sources, [household ? '0003445081' : '0003447398']);
    if (household) {
      same(
        p.population,
        '単独世帯・一般世帯・国籍と配偶関係総数・世帯主の男女と年齢',
        'household population'
      );
      labels(
        p.ages,
        Array.from({ length: 17 }, (_, i) => String(i + 1).padStart(2, '0'))
      );
    } else {
      same(p.comparisonDate, '2015-10-01', 'previous residence date');
      same(
        p.population,
        '2020年10月1日現在の5歳以上常住者・男女別・国籍総数（年齢不詳を含まない）',
        'residence population'
      );
      labels(p.classes, [
        '001',
        '00211',
        '00212',
        '00213',
        '0022',
        '003',
        '004',
      ]);
    }
    const n = household ? 17 : 7,
      areas = list(p.areas).map(object),
      national = object(p.national);
    const validate = (a: Record<string, unknown>) => {
      exact(a, ['areaCode', 'areaName', 'bySex']);
      const sex = list(a.bySex).map(object);
      same(
        sex.map((s) => s.sex),
        ['0', '1', '2'],
        'three sexes with total'
      );
      for (const s of sex) {
        exact(s, ['sex', 'total', 'counts']);
        same(sum(vec(s.counts, n)), count(s.total), 'full partition');
      }
      same(
        (sex[1].total as number) + (sex[2].total as number),
        sex[0].total,
        'sex total'
      );
      same(
        add([sex[1].counts as number[], sex[2].counts as number[]]),
        sex[0].counts,
        'sex counts'
      );
      return sex;
    };
    const all = areas.map(validate),
      nat = validate(national);
    for (let s = 0; s < 3; s++) {
      same(
        sum(all.map((a) => a[s].total as number)),
        nat[s].total,
        'national total'
      );
      same(
        add(all.map((a) => a[s].counts as number[])),
        nat[s].counts,
        'national classes'
      );
    }
    same(
      nat[0].total,
      household ? 21151042 : 118698179,
      'official census national'
    );
    if (household)
      same((nat[0].counts as number[])[16], 2402603, 'unknown age preserved');
  }
  return value as PopulationCoreProfile;
}
