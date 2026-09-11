import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, realpath } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { parseArgs } from 'node:util';
import { SOURCES, EXPECTED_CONFIGS } from './population-core-pins.mjs';
export { SOURCES, EXPECTED_CONFIGS };
export const PREFS = Array.from(
  { length: 47 },
  (_, i) => String(i + 1).padStart(2, '0') + '000'
);
const AREAS = ['00000', ...PREFS],
  SEXES = ['0', '1', '2'],
  FLOW_SEXES = ['1', '2'];
export const sha = (b) => createHash('sha256').update(b).digest('hex');
const sum = (a) => a.reduce((s, x) => s + x, 0),
  one = (a) => (Array.isArray(a) ? a : [a]);
function data(body, id, count) {
  assert.equal(body.GET_STATS_DATA?.RESULT?.STATUS, 0, 'source status');
  const d = body.GET_STATS_DATA.STATISTICAL_DATA;
  assert.equal(d.TABLE_INF['@id'], id, 'source table identity');
  assert.equal(d.RESULT_INF.TOTAL_NUMBER, count, 'source total rows');
  assert.equal(d.RESULT_INF.FROM_NUMBER, 1, 'source first page');
  assert.equal(d.RESULT_INF.TO_NUMBER, count, 'source truncation');
  assert.equal(d.DATA_INF.VALUE.length, count, 'source row count');
  assert.ok(!d.RESULT_INF.NEXT_KEY, 'unread pagination');
  return d;
}
function count(v, allowNegative = false, allowNoCount = false) {
  if (v === '-' && allowNoCount) return 0;
  assert.equal(typeof v, 'string', 'numeric text required');
  assert.match(
    v,
    allowNegative ? /^-?\d+$/ : /^\d+$/,
    'unexpected source symbol'
  );
  const n = Number(v);
  assert.ok(Number.isSafeInteger(n), 'unsafe source integer');
  return n;
}
function table(d, axes, fixed, { negative = false, zeroAge = false } = {}) {
  const map = new Map();
  for (const r of d.DATA_INF.VALUE) {
    for (const [k, v] of Object.entries(fixed))
      assert.equal(r['@' + k], v, 'wrong source axis ' + k);
    const key = axes.map((k) => r['@' + k]).join('|');
    assert.ok(!map.has(key), 'duplicate source cell');
    map.set(key, count(r.$, negative, zeroAge && r['@cat03'] === '01'));
  }
  return (...args) => {
    const k = args.join('|');
    assert.ok(map.has(k), 'missing source cell ' + k);
    return map.get(k);
  };
}
const axis = (d, id) =>
  one(d.CLASS_INF.CLASS_OBJ.find((c) => c['@id'] === id).CLASS).map((c) => ({
    code: c['@code'],
    label: c['@name'],
  }));
function ledger() {
  const checks = {};
  return {
    checks,
    eq: (name, x, y) => {
      assert.deepEqual(x, y, name);
      checks[name] = (checks[name] ?? 0) + 1;
    },
  };
}
function pins(ids) {
  return SOURCES.filter((s) => ids.includes(s.id)).map((s) => ({
    tableId: s.parameters.statsDataId,
    url: 'https://www.e-stat.go.jp/dbview?sid=' + s.parameters.statsDataId,
    parameters: s.parameters,
    rawSha256: s.sha256,
    statisticalDataSha256: s.statisticalDataSha256,
    bytes: s.bytes,
    fetchedAt: s.fetchedAt,
  }));
}
export function parseMigration(odBody, ageBody, names, generatedAt) {
  const od = data(odBody, '0003419946', 97760),
    ad = data(ageBody, '0003419944', 44460),
    { checks, eq } = ledger();
  const O = table(od, ['cat01', 'area', 'cat03', 'cat02'], {
      tab: '18',
      cat04: '60000',
      time: '2025000000',
      unit: '人',
    }),
    A = table(
      ad,
      ['area', 'cat02', 'cat01', 'tab'],
      { cat03: '60000', time: '2025000000', unit: '人' },
      { negative: true }
    );
  const ages = axis(od, 'cat02');
  eq(
    'age-identity',
    ages.map((a) => a.code),
    ['000', ...Array.from({ length: 18 }, (_, i) => String(201 + i)), '402']
  );
  const ageSingles = (c) =>
    c === '000'
      ? ['000']
      : c === '402'
        ? ['402']
        : Array.from({ length: 5 }, (_, i) =>
            String((Number(c) - 201) * 5 + i + 1).padStart(3, '0')
          );
  const sourceAreas = axis(od, 'area').map((a) => a.code);
  eq('source-geography', sourceAreas, [
    ...PREFS.slice(0, 0),
    '00000',
    ...PREFS,
    '51000',
    '52000',
    '53000',
    '00416',
  ]);
  const O20 = (d, o, s) => ages.map((a) => O(d, o, s, a.code));
  const residual = (d, o, s) =>
    O(d, o, s, '000') - sum(ages.slice(1).map((a) => O(d, o, s, a.code)));
  const residuals = [];
  for (const d of PREFS)
    for (const s of FLOW_SEXES) {
      for (const a of ages) {
        const inc = sum(
            PREFS.filter((o) => o !== d).map((o) => O(d, o, s, a.code))
          ),
          out = sum(
            PREFS.filter((o) => o !== d).map((o) => O(o, d, s, a.code))
          );
        eq(
          'independent-in',
          inc,
          sum(ageSingles(a.code).map((c) => A(d, s, c, '02')))
        );
        eq(
          'independent-out',
          out,
          sum(ageSingles(a.code).map((c) => A(d, s, c, '03')))
        );
        eq(
          'independent-net',
          inc - out,
          sum(ageSingles(a.code).map((c) => A(d, s, c, '04')))
        );
        eq(
          'total-includes-within',
          sum(PREFS.map((o) => O(d, o, s, a.code))),
          O(d, '00000', s, a.code)
        );
      }
      for (const o of PREFS) {
        const r = residual(d, o, s);
        assert.ok(Number.isSafeInteger(r) && r >= 0, 'negative age residual');
        if (r)
          residuals.push({
            originAreaCode: o,
            destinationAreaCode: d,
            sex: s,
            count: r,
          });
        eq(
          'age-partition-with-residual',
          sum(O20(d, o, s).slice(1)) + r,
          O(d, o, s, '000')
        );
      }
    }
  for (const s of SEXES)
    for (const a of axis(ad, 'cat01'))
      for (const t of ['02', '03', '04'])
        eq(
          'national-migration',
          sum(PREFS.map((p) => A(p, s, a.code, t))),
          A('00000', s, a.code, t)
        );
  for (const p of AREAS)
    for (const a of axis(ad, 'cat01'))
      for (const t of ['02', '03', '04'])
        eq(
          'migration-sex',
          A(p, '1', a.code, t) + A(p, '2', a.code, t),
          A(p, '0', a.code, t)
        );
  // API offers no age-residual class. Preserve the arithmetic difference without imputing an age.
  eq('residual-total', sum(residuals.map((r) => r.count)), 4);
  eq(
    'interprefecture-residual-total',
    sum(
      residuals
        .filter((r) => r.originAreaCode !== r.destinationAreaCode)
        .map((r) => r.count)
    ),
    2
  );
  const vec = (d, o, s) => [...O20(d, o, s), residual(d, o, s)];
  const add = (v) => v[0].map((_, i) => sum(v.map((a) => a[i])));
  const areas = PREFS.map((p) => ({
    areaCode: p,
    areaName: names[p],
    inbound: FLOW_SEXES.map((s) =>
      add(PREFS.filter((o) => o !== p).map((o) => vec(p, o, s)))
    ),
    outbound: FLOW_SEXES.map((s) =>
      add(PREFS.filter((o) => o !== p).map((o) => vec(o, p, s)))
    ),
    withinPrefecture: FLOW_SEXES.map((s) => vec(p, p, s)),
  }));
  const flows = PREFS.flatMap((origin) =>
    PREFS.filter((destination) => origin !== destination).map(
      (destination) => ({
        originAreaCode: origin,
        destinationAreaCode: destination,
        counts: FLOW_SEXES.map((s) => vec(destination, origin, s)),
      })
    )
  );
  const national = {
    areaCode: '00000',
    areaName: '全国',
    inbound: FLOW_SEXES.map((_, si) => add(areas.map((a) => a.inbound[si]))),
    outbound: FLOW_SEXES.map((_, si) => add(areas.map((a) => a.outbound[si]))),
  };
  const profile = {
    schemaVersion: 1,
    kind: 'interprefecture-migration-demographics',
    period: '2025',
    unit: '人',
    generatedAt,
    population: '移動者（外国人を含む）、国内の住所移動、男女別',
    sources: pins(['migration-od', 'migration-age']),
    sexes: FLOW_SEXES,
    ages: [...ages, { code: 'unallocated', label: '総数と年齢計の差' }],
    areas,
    national,
    flows,
    notes: [
      '県間移動は県内移動を除く。県内移動は別欄とし、海外から/への移動を含まない。',
      '年齢は移動時の年齢。転居理由を推計していない。',
      '総数と年齢計の差は県間2人・県内2人。年齢階級に配分せず別掲する。',
      '男女計は同じ表の男と女の合計。既存の外国人限定系列とは対象が違う。',
    ],
  };
  const metric = (key, p) => {
    const [lo, hi] = key.includes('15to24') ? [15, 24] : [25, 34];
    return sum(
      Array.from({ length: hi - lo + 1 }, (_, i) =>
        A(p, '0', String(lo + i + 1).padStart(3, '0'), '04')
      )
    );
  };
  return {
    profile,
    metric,
    verification: {
      checks,
      prefectures: 47,
      nationalInterprefectureMovers: A('00000', '0', '000', '02'),
      rawRows: 142220,
      offDiagonalFlows: flows.length,
      ageResiduals: residuals,
      missing: 0,
      duplicates: 0,
    },
  };
}
export function parseHouseholds(body, names, generatedAt) {
  const d = data(body, '0003445081', 3024),
    { checks, eq } = ledger();
  const H = table(
    d,
    ['area', 'cat01', 'cat03'],
    {
      tab: '2020_16',
      cat02: '0',
      cat04: '3',
      time: '2020000000',
      unit: '世帯',
    },
    { zeroAge: true }
  );
  const ages = axis(d, 'cat03').filter(
    (a) => /^\d\d$/.test(a.code) && a.code !== '00'
  );
  eq(
    'household-age-codes',
    ages.map((a) => a.code),
    Array.from({ length: 17 }, (_, i) => String(i + 1).padStart(2, '0'))
  );
  eq(
    'household-geography',
    axis(d, 'area').map((a) => a.code),
    AREAS
  );
  for (const p of AREAS) {
    for (const s of SEXES) {
      eq(
        'household-age-partition',
        sum(ages.map((a) => H(p, s, a.code))),
        H(p, s, '00')
      );
      eq(
        'household-65plus-partition',
        sum(
          ages
            .filter((a) => Number(a.code) >= 12 && Number(a.code) <= 16)
            .map((a) => H(p, s, a.code))
        ),
        H(p, s, 'R2')
      );
    }
    for (const a of axis(d, 'cat03'))
      eq(
        'household-sex',
        H(p, '1', a.code) + H(p, '2', a.code),
        H(p, '0', a.code)
      );
  }
  for (const s of SEXES)
    for (const a of axis(d, 'cat03'))
      eq(
        'household-national',
        sum(PREFS.map((p) => H(p, s, a.code))),
        H('00000', s, a.code)
      );
  const area = (p) => ({
    areaCode: p,
    areaName: p === '00000' ? '全国' : names[p],
    bySex: SEXES.map((sex) => ({
      sex,
      total: H(p, sex, '00'),
      counts: ages.map((a) => H(p, sex, a.code)),
    })),
  });
  const profile = {
    schemaVersion: 1,
    kind: 'single-households-demographics',
    period: '2020-10-01',
    unit: '世帯',
    generatedAt,
    population: '単独世帯・一般世帯・国籍と配偶関係総数・世帯主の男女と年齢',
    sources: pins(['household-sex-age']),
    ages,
    areas: PREFS.map(area),
    national: area('00000'),
    notes: [
      '世帯員が1人の一般世帯を対象とし、施設等の世帯を含まない。',
      '年齢不詳は全国2,402,603世帯。既知年齢へ配分していない。',
      '15歳未満も独立した年齢区分として残す。',
      '世帯主と世帯員は単独世帯では同じ人。一般世帯全体の年齢構成ではない。',
    ],
  };
  return {
    profile,
    metric: (key, p) => H(p, key.endsWith('-female') ? '2' : '1', 'R2'),
    verification: {
      checks,
      prefectures: 47,
      missing: 0,
      duplicates: 0,
      sourceHyphenZeroCells: d.DATA_INF.VALUE.filter((r) => r.$ === '-').length,
      nationalSingleHouseholds: H('00000', '0', '00'),
      nationalUnknownAge: H('00000', '0', '17'),
    },
  };
}
export function parseResidence(body, names, generatedAt) {
  const d = data(body, '0003447398', 2736),
    { checks, eq } = ledger();
  const CODES = ['0', '001', '00211', '00212', '00213', '0022', '003', '004'];
  const filtered = {
    ...d,
    DATA_INF: {
      ...d.DATA_INF,
      VALUE: d.DATA_INF.VALUE.filter((r) => CODES.includes(r['@cat03'])),
    },
  };
  const R = table(filtered, ['area', 'cat01', 'cat03'], {
    tab: '2020_01',
    cat02: 'R1',
    time: '2020000000',
    unit: '人',
  });
  eq(
    'residence-geography',
    axis(d, 'area').map((a) => a.code),
    AREAS
  );
  const classes = CODES.slice(1).map((code) =>
    axis(d, 'cat03').find((c) => c.code === code)
  );
  for (const p of AREAS) {
    for (const s of SEXES)
      eq(
        'residence-partition',
        sum(classes.map((c) => R(p, s, c.code))),
        R(p, s, '0')
      );
    for (const c of CODES)
      eq('residence-sex', R(p, '1', c) + R(p, '2', c), R(p, '0', c));
  }
  for (const s of SEXES)
    for (const c of CODES)
      eq(
        'residence-national',
        sum(PREFS.map((p) => R(p, s, c))),
        R('00000', s, c)
      );
  const area = (p) => ({
    areaCode: p,
    areaName: p === '00000' ? '全国' : names[p],
    bySex: SEXES.map((sex) => ({
      sex,
      total: R(p, sex, '0'),
      counts: classes.map((c) => R(p, sex, c.code)),
    })),
  });
  const profile = {
    schemaVersion: 1,
    kind: 'five-year-residence',
    period: '2020-10-01',
    comparisonDate: '2015-10-01',
    unit: '人',
    generatedAt,
    population:
      '2020年10月1日現在の5歳以上常住者・男女別・国籍総数（年齢不詳を含まない）',
    sources: pins(['residence']),
    classes,
    areas: PREFS.map(area),
    national: area('00000'),
    notes: [
      '2020年の現住地で県を集計。5年間の転居回数ではなく、2015年と2020年の常住地を比較する。',
      '5歳未満と年齢不詳を含まない。移動状況不詳と5年前常住市区町村不詳は別区分で保持。',
      '国内からの移動は自市町村内・県内他市町村・他県からの3区分。政令市の区間内訳を重複加算しない。',
      '総数は7つの排他的区分の合計と一致する。',
    ],
  };
  return {
    profile,
    metric: (key, p) =>
      R(p, '0', key.endsWith('same-address') ? '001' : '00213'),
    verification: {
      checks,
      prefectures: 47,
      missing: 0,
      duplicates: 0,
      nationalFivePlusResidents: R('00000', '0', '0'),
      unknownPreviousMunicipality: R('00000', '0', '003'),
      unknownMigrationStatus: R('00000', '0', '004'),
      unusedStructuralHyphens: d.DATA_INF.VALUE.filter((r) => r.$ === '-')
        .length,
    },
  };
}
export function validateConfig(c, expected) {
  assert.equal(c?.isActive, true, 'active config');
  for (const k of ['key', 'unit', 'source', 'years', 'yearFormat'])
    assert.deepEqual(c[k], expected[k], 'config ' + k);
}
async function source(s, dir) {
  const file = resolve(dir, s.filename);
  let b,
    fetchedAt = s.fetchedAt;
  try {
    b = await readFile(file);
    if (sha(b) !== s.sha256) {
      const cached = JSON.parse(await readFile(file + '.source.json', 'utf8'));
      assert.equal(cached.rawSha256, sha(b), 'cached acquisition SHA');
      fetchedAt = cached.fetchedAt;
    }
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    const appId =
      process.env.NEXT_PUBLIC_ESTAT_APP_ID || process.env.ESTAT_APP_ID;
    assert.ok(appId, 'e-Stat appId required');
    const u = new URL(s.url);
    u.search = new URLSearchParams({ appId, lang: 'J', ...s.parameters });
    let r;
    try {
      r = await fetch(u, { signal: AbortSignal.timeout(60000) });
    } catch {
      throw Error('Official source GET failed ' + s.id);
    }
    assert.ok(r.ok, 'official source HTTP ' + r.status);
    b = Buffer.from(await r.arrayBuffer());
    fetchedAt = new Date().toISOString();
  }
  const parsed = JSON.parse(b);
  assert.equal(
    sha(JSON.stringify(parsed.GET_STATS_DATA?.STATISTICAL_DATA)),
    s.statisticalDataSha256,
    'source statistical SHA ' + s.id
  );
  const observed = {
    tableId: s.parameters.statsDataId,
    url: 'https://www.e-stat.go.jp/dbview?sid=' + s.parameters.statsDataId,
    parameters: s.parameters,
    rawSha256: sha(b),
    statisticalDataSha256: s.statisticalDataSha256,
    bytes: b.length,
    fetchedAt,
  };
  await mkdir(dir, { recursive: true });
  await writeFile(file, b);
  await writeFile(file + '.source.json', JSON.stringify(observed, null, 2));
  return { body: parsed, observed };
}
async function main() {
  const root = process.cwd(),
    require = createRequire(resolve(root, 'package.json'));
  const { values: o } = parseArgs({
    options: {
      'write-local': { type: 'boolean', default: false },
      'source-dir': {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/population-core-source'
        ),
      },
      'config-file': { type: 'string' },
      'profile-schema-file': { type: 'string' },
      'local-r2-root': { type: 'string', default: resolve(root, '.local/r2') },
      out: {
        type: 'string',
        default: resolve(
          root,
          '.local/verification/themes/population-core-source.json'
        ),
      },
    },
  });
  const prefectures = require('./packages/area/src/data/prefectures.json'),
    names = Object.fromEntries(
      prefectures.map((p) => [p.prefCode, p.prefName])
    );
  const { buildRecipe } = require('./packages/data-configs/src/recipe.ts'),
    { parseStatsValuesPayload } = require('./packages/stats-r2/src/schemas.ts');
  const configs = o['config-file']
    ? Object.fromEntries(
        JSON.parse(await readFile(o['config-file'], 'utf8')).map((c) => [
          c.key,
          c,
        ])
      )
    : require('./packages/data-configs/src/registry.ts').METRICS_REGISTRY;
  const bodies = {},
    observedSources = [];
  for (const s of SOURCES) {
    const result = await source(s, o['source-dir']);
    bodies[s.id] = result.body;
    observedSources.push(result.observed);
  }
  const generatedAt = new Date().toISOString();
  const migration = parseMigration(
      bodies['migration-od'],
      bodies['migration-age'],
      names,
      generatedAt
    ),
    households = parseHouseholds(
      bodies['household-sex-age'],
      names,
      generatedAt
    ),
    residence = parseResidence(bodies.residence, names, generatedAt);
  const files = [];
  const { parsePopulationCoreProfile } = require(
    o['profile-schema-file']
      ? resolve(o['profile-schema-file'])
      : './packages/data-configs/src/theme-catalog/population-core-profile.ts'
  );
  for (const parsed of [migration, households, residence]) {
    parsed.profile.sources = parsed.profile.sources.map((p) =>
      observedSources.find((s) => s.tableId === p.tableId)
    );
    parsePopulationCoreProfile(parsed.profile);
  }
  for (const expected of EXPECTED_CONFIGS) {
    const c = configs[expected.key];
    validateConfig(c, expected);
    const parsed = c.key.startsWith('interprefecture-')
      ? migration
      : c.key.startsWith('single-households-')
        ? households
        : residence;
    const year = String(c.years.from);
    const rows = PREFS.map((p) => ({
      areaCode: p,
      areaName: names[p],
      yearCode: year,
      yearName: year === '2025' ? '2025年' : '2020年10月1日現在',
      value: parsed.metric(c.key, p),
      unit: c.unit,
    }));
    const payload = parseStatsValuesPayload({
      metricKey: c.key,
      entityKind: 'prefecture',
      rows,
      meta: {
        generatedAt,
        rowCount: 47,
        areaCount: 47,
        yearRange: [year, year],
        recipe: buildRecipe(c),
      },
    });
    files.push({
      key: `app/stats/${c.key}/values.json`,
      metricKey: c.key,
      rowCount: 47,
      content: JSON.stringify(payload),
    });
  }
  for (const [key, parsed] of [
    ['app/themes/population-dynamics/migration-demographics.json', migration],
    [
      'app/themes/living-housing/single-households-demographics.json',
      households,
    ],
    ['app/themes/population-dynamics/five-year-residence.json', residence],
  ])
    files.push({ key, content: JSON.stringify(parsed.profile) });
  if (o['write-local'])
    for (const f of files) {
      const path = resolve(o['local-r2-root'], f.key);
      await mkdir(dirname(path), { recursive: true });
      await writeFile(path, f.content);
    }
  const report = {
    status: o['write-local'] ? 'source-verified-staged' : 'source-verified',
    generatedAt,
    candidates: [34, 43, 44, 46],
    sources: observedSources,
    migration: migration.verification,
    households: households.verification,
    residence: residence.verification,
    files: files.map(({ content, ...f }) => ({
      ...f,
      sha256: sha(content),
      bytes: Buffer.byteLength(content),
    })),
    remaining: [
      'Parent catalog/profile UI wiring, browser and release gates. No publication performed.',
    ],
  };
  await mkdir(dirname(resolve(o.out)), { recursive: true });
  await writeFile(resolve(o.out), JSON.stringify(report, null, 2) + '\n');
  console.log(
    JSON.stringify({
      status: report.status,
      metrics: 6,
      profiles: 3,
      files: files.length,
      out: o.out,
    })
  );
}
if (
  process.argv[1] &&
  (await realpath(process.argv[1]).catch(() => null)) ===
    fileURLToPath(import.meta.url)
)
  main().catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
