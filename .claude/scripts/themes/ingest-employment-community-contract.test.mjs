/** Synthetic fixtures: no official API calls, downloaded source files or .local dependencies. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import {
  parseIntentions,
  parseHours,
  parseCommunity,
  validateConfig,
  validateApiSource,
  sha,
  reconcileRoundedCounts,
  EXPECTED_CONFIGS,
} from './ingest-employment-community.mjs';
const require = createRequire(resolve(process.cwd(), 'package.json'));
const prefs = require('./packages/area/src/data/prefectures.json').map(
    (p) => p.prefCode
  ),
  areas = ['00000', ...prefs];
// Distribute published national controls over invented counties. These are not actual county observations.
const distribute = (total, index, quantum = 100) =>
  quantum *
  (Math.floor(total / quantum / 47) + (index < (total / quantum) % 47 ? 1 : 0));
const fixture = (national, axis, quantum = 100) => {
  const byArea = new Map(
    areas.map((area, index) => [
      area,
      Object.fromEntries(
        Object.entries(national).map(([code, value]) => [
          code,
          index === 0 ? value : distribute(value, index - 1, quantum),
        ])
      ),
    ])
  );
  return {
    byArea,
    sourceRows: 48 * Object.keys(national).length,
    discardedGeographies: 0,
    cell(area, selectors) {
      const value = byArea.get(area)?.[selectors[axis]];
      assert.ok(value !== undefined, 'missing fixture cell');
      return { value, raw: String(value) };
    },
  };
};
const intentionFixture = () =>
  fixture(
    { 0: 21110300, 1: 15388700, 2: 1772800, 3: 2501700, 4: 1135800 },
    'cat03'
  );
const hourNational = {
  2: 25189200,
  3: 15621900,
  4: 3092500,
  201: 433600,
  202: 540500,
  203: 1053800,
  204: 853000,
  205: 1437100,
  206: 3118500,
  207: 10650300,
  208: 3222900,
  209: 2363100,
  210: 474800,
  211: 485800,
  212: 67500,
  213: 104300,
  214: 154700,
  301: 210200,
  302: 163800,
  303: 285100,
  304: 243100,
  305: 482000,
  306: 1411700,
  307: 6322000,
  308: 2756400,
  309: 1930100,
  310: 491500,
  311: 700500,
  312: 129900,
  313: 189500,
  314: 159500,
  401: 62600,
  402: 60100,
  403: 70700,
  404: 52800,
  405: 89600,
  406: 193500,
  407: 943700,
  408: 480900,
  409: 446300,
  410: 111400,
  411: 239700,
  412: 46200,
  413: 100900,
  414: 117000,
};
const hoursFixture = () => fixture(hourNational, 'cat02');
const communityFixture = () => {
  const population = fixture(
      { '202101A02': 112462, '202126A99B99': 171360 },
      'tab',
      1
    ),
    counts = fixture({ '00': 20056, '06': 8317 }, 'cat04', 1);
  const rates = {
    cell(area, selectors) {
      const value =
        area === '00000'
          ? selectors.cat04 === '00'
            ? 17.8
            : 7.4
          : Math.round(
              (counts.cell(area, selectors).value /
                population.cell(area, { tab: '202101A02' }).value) *
                1000
            ) / 10;
      return { value, raw: String(value) };
    },
  };
  return { population, counts, rates };
};
test('intentions retain all counties and denominator includes residual', () => {
  const result = parseIntentions(intentionFixture());
  assert.equal(result.rows.length, 48);
  assert.equal(result.national.unclassifiedAndRoundingResidual, 311300);
  assert.equal(result.national.continuationRate, (15388700 / 21110300) * 100);
  assert.notEqual(
    result.national.continuationRate,
    (15388700 / (21110300 - 311300)) * 100
  );
});
test('hours use annual200+ total, retaining unknown time in denominator', () => {
  const r = parseHours(hoursFixture());
  assert.equal(r.rows.length, 48);
  assert.equal(r.national.longHours, 2495500);
  assert.equal(r.national.denominator, 43903600);
  assert.equal(r.national.unclassifiedAndRoundingResidual, 453000);
  assert.equal(r.national.longHoursRate, (2495500 / 43903600) * 100);
  assert.notEqual(r.national.longHoursRate, (2495500 / 43450600) * 100);
});
test('community preserves published rates and checks same-population counts', () => {
  const f = communityFixture(),
    r = parseCommunity(f.rates, f.counts, f.population);
  assert.equal(r.rows.length, 48);
  assert.equal(r.national.rate, 7.4);
  assert.equal(r.national.sampleSize, 171360);
  assert.equal(r.checks.rateCountPopulationChecks, 96);
});
test('reject intention partition exceeding total', () => {
  const f = intentionFixture();
  f.byArea.get('01000')['1'] = f.byArea.get('01000')['0'];
  assert.throws(() => parseIntentions(f));
});
test('reject altered national intention controls', () => {
  const f = intentionFixture();
  f.byArea.get('00000')['0'] += 100;
  assert.throws(() => parseIntentions(f));
});
test('reject missing weekly time bin', () => {
  const f = hoursFixture();
  delete f.byArea.get('01000')['211'];
  assert.throws(() => parseHours(f));
});
test('reject week60+ count larger than annual cohort', () => {
  const f = hoursFixture();
  f.byArea.get('01000')['211'] = f.byArea.get('01000')['2'] * 2;
  assert.throws(() => parseHours(f));
});
test('reject substituted weekly known-time total', () => {
  const f = hoursFixture();
  f.byArea.get('00000')['2'] -= 229300;
  assert.throws(() => parseHours(f));
});
test('reject community rate with unrelated denominator', () => {
  const f = communityFixture();
  f.population.byArea.get('01000')['202101A02'] *= 2;
  const original = f.rates;
  const rates = {
    cell(a, s) {
      return a === '01000' ? { value: 7.4, raw: '7.4' } : original.cell(a, s);
    },
  };
  assert.throws(() => parseCommunity(rates, f.counts, f.population));
});
test('reject insufficient community sample', () => {
  const f = communityFixture();
  f.population.byArea.get('01000')['202126A99B99'] = 9;
  assert.throws(() => parseCommunity(f.rates, f.counts, f.population));
});
test('reject national sample count not equal county counts', () => {
  const f = communityFixture();
  f.population.byArea.get('01000')['202126A99B99'] += 1;
  assert.throws(() => parseCommunity(f.rates, f.counts, f.population));
});
test('rounding reconciliation keeps actual difference rather than forcing equality', () => {
  const rows = areas.map((areaCode, i) => ({
    areaCode,
    value: i === 0 ? 4700 : 100,
  }));
  rows[1].value += 100;
  const r = reconcileRoundedCounts(rows, ['value'], 100);
  assert.equal(r[0].difference, 100);
  assert.equal(r[0].budget, 2400);
});
test('reject county sum discrepancy beyond stated rounding arithmetic', () => {
  const rows = areas.map((areaCode, i) => ({
    areaCode,
    value: i === 0 ? 4700 : 100,
  }));
  rows[1].value += 2500;
  assert.throws(() => reconcileRoundedCounts(rows, ['value'], 100));
});
for (const expected of EXPECTED_CONFIGS)
  test('accept pinned config ' + expected.key, () =>
    validateConfig(structuredClone(expected), expected)
  );
for (const [name, index, mutate] of [
  ['regular employment substituted', 0, (c) => (c.source.cdCat04 = '221')],
  [
    'unknown intention excluded from denominator',
    1,
    (c) => (c.source.axisRatio.denominatorCodes = ['1', '2', '3', '4']),
  ],
  [
    'continuation merged with additional wish',
    1,
    (c) => (c.source.axisRatio.numeratorCodes = ['1', '2']),
  ],
  [
    'under200 regular workers added to hours',
    3,
    (c) => c.source.axisSum.codes.push('1511'),
  ],
  [
    'known weekly hours substituted in denominator',
    4,
    (c) => (c.source.axisRatio.denominatorCodes = ['201', '202']),
  ],
  ['directors included', 4, (c) => (c.source.cdCat04 = '2')],
  [
    'town-association form subset substituted',
    5,
    (c) => (c.source.cdCat03 = '13'),
  ],
  ['other activity substituted', 5, (c) => (c.source.cdCat04 = '00')],
  ['wrong year', 0, (c) => (c.years.from = 2022000000)],
  ['percent rescaled', 1, (c) => (c.display.conversionFactor = 100)],
])
  test('reject config ' + name, () => {
    const c = structuredClone(EXPECTED_CONFIGS[index]);
    mutate(c);
    assert.throws(() => validateConfig(c, EXPECTED_CONFIGS[index]));
  });
const apiFixture = () => ({
  GET_STATS_DATA: {
    RESULT: { STATUS: 0, DATE: 'synthetic' },
    STATISTICAL_DATA: {
      rows: [
        { areaCode: '01000', value: 100 },
        { areaCode: '02000', value: 200 },
      ],
    },
  },
});
const pin = {
  id: 'synthetic',
  statisticalDataSha256: sha(
    JSON.stringify(apiFixture().GET_STATS_DATA.STATISTICAL_DATA)
  ),
};
test('API response timestamp changes do not invalidate unchanged statistical data', () => {
  const a = apiFixture();
  a.GET_STATS_DATA.RESULT.DATE = 'later';
  validateApiSource(a, pin);
});
test('reject source change even if aggregate sum is preserved', () => {
  const a = apiFixture();
  a.GET_STATS_DATA.STATISTICAL_DATA.rows[0].value += 100;
  a.GET_STATS_DATA.STATISTICAL_DATA.rows[1].value -= 100;
  assert.throws(() => validateApiSource(a, pin));
});
test('reject failed API result with otherwise matching statistics', () => {
  const a = apiFixture();
  a.GET_STATS_DATA.RESULT.STATUS = 1;
  assert.throws(() => validateApiSource(a, pin));
});
