import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import { prefectureShape } from '../lib/data-card-shape';
import { buildRecipe } from '../../../../packages/data-configs/src/recipe';
import { getMetricConfig } from '../../../../packages/data-configs/src/registry';
import {
  buildDataCard,
  getRows,
  loadMetric,
  normalizeArea,
  rankDirection,
  type RankingRow,
  type ReadJson,
} from '../lib/data-card-input';
import { rankLabelPositions } from '../../../../apps/remotion/src/features/data-cards/model';

// Deliberately synthetic fixtures; no network and no publication output.
const key = 'bread-consumption-expenditure';
function makeRows(year: string, unit = '円'): RankingRow[] {
  return Array.from({ length: 47 }, (_, i) => ({
    areaCode: `${String(i + 1).padStart(2, '0')}000`,
    areaName: `地域${i + 1}`,
    yearCode: year,
    yearName: `${year}年`,
    value: 1000 - i,
    unit,
    rank: i + 1,
  }));
}
function fixtureRead(
  mutate?: (payload: Record<string, unknown>, key: string) => unknown
): ReadJson {
  return async (path) => {
    const metricKey = path.split('/')[2];
    const config = getMetricConfig(metricKey)!;
    const isTotal = metricKey === 'household-survey-consumption-expenditure';
    const make = (year: string) => ({
      yearCode: year,
      count: 47,
      values: makeRows(year, config.unit).map((row) => ({
        ...row,
        value: metricKey.startsWith('household-survey-')
          ? isTotal
            ? 9999
            : 1000
          : row.value,
      })),
    });
    const payload = path.endsWith('item.json')
      ? {
          item: {
            rankingKey: metricKey,
            areaType: 'prefecture',
            title: config.title,
            unit: config.unit,
            latestYear: { yearCode: '2024' },
            valueDisplay: { conversionFactor: 1 },
            sourceConfig: {
              recipe: buildRecipe(config),
              source: { name: '検証用出典', url: 'https://example.com/source' },
            },
          },
        }
      : {
          rankingKey: metricKey,
          areaType: 'prefecture',
          partitions: [make('2014'), make('2024')],
        };
    return mutate ? mutate(payload, path) : payload;
  };
}
const shape = async () => ({ path: 'M0 0 L10 10 Z', note: '県境データ' });

test('県コードを正規化し、存在しない県を拒否する', () => {
  assert.equal(normalizeArea('1'), '01000');
  assert.equal(normalizeArea('28000'), '28000');
  for (const bad of ['0', '48', '../28', '28100', 'NaN'])
    assert.throws(() => normalizeArea(bad));
});
test('レシートは公表総額を維持して丸め差を注記する', async () => {
  const card = await buildDataCard(
    { kind: 'household-receipt', area: '28', year: '2024' },
    fixtureRead(),
    shape
  );
  assert.equal(card.kind, 'household-receipt');
  if (card.kind !== 'household-receipt') throw new Error('wrong kind');
  assert.equal(card.total, 9999);
  assert.equal(card.difference, 1);
  assert.equal(card.rows.length, 10);
  assert.match(card.period, /10〜11月/);
  assert.match(card.scope, /二人以上/);
  assert.match(card.notes[0], /\+1円/);
});
test('レシートは未確認の調査年を黙って月平均としない', async () => {
  await assert.rejects(
    () =>
      buildDataCard(
        { kind: 'household-receipt', area: '28', year: '2019' },
        fixtureRead(),
        shape
      ),
    /2024/
  );
});
test('図鑑は各指標の対象年を保持して全県域として描画する', async () => {
  const read: ReadJson = async (path) => {
    const payload = await fixtureRead()(path);
    if (path.includes('/households/'))
      return JSON.parse(JSON.stringify(payload).replaceAll('2024', '2020'));
    return payload;
  };
  const card = await buildDataCard(
    { kind: 'area-atlas', area: '1' },
    read,
    shape
  );
  assert.equal(card.kind, 'area-atlas');
  if (card.kind !== 'area-atlas') throw new Error('wrong kind');
  assert.deepEqual(
    card.rows.map((r) => r.year),
    ['2024年', '2024年', '2020年', '2024年']
  );
  assert.match(card.scope, /県全域/);
  assert.equal(card.areaCode, '01000');
});
test('順位図は母集団の順位を維持し、東京都区部と市名を表示する', async () => {
  const card = await buildDataCard(
    { kind: 'rank-routes', key, from: '2014', to: '2024', areas: ['13', '28'] },
    fixtureRead(),
    shape
  );
  assert.equal(card.kind, 'rank-routes');
  if (card.kind !== 'rank-routes') throw new Error('wrong kind');
  assert.deepEqual(
    card.routes.map((r) => [r.name, r.before.rank]),
    [
      ['東京都区部', 13],
      ['神戸市', 28],
    ]
  );
  assert.equal(card.population, 47);
  assert.match(card.notes[1], /名目/);
});
test('同値は競技順位を保ち、昇順/降順の規則を検証する', () => {
  const rows = makeRows('2024');
  rows[1] = { ...rows[1], value: rows[0].value, rank: 1 };
  assert.equal(rankDirection(rows), 'descending');
  assert.throws(
    () => rankDirection(rows.map((r, i) => ({ ...r, rank: i + 1 }))),
    /同順位/
  );
  assert.equal(
    rankDirection(makeRows('2024').map((r) => ({ ...r, rank: 48 - r.rank }))),
    'ascending'
  );
});
test('同順位のラベルはずらしても、元順位は変更しない', () => {
  const ranks = [47, 47, 46, 1];
  const result = rankLabelPositions(ranks, (r) => 52 + ((r - 1) / 46) * 470);
  assert.deepEqual(ranks, [47, 47, 46, 1]);
  const sorted = result.toSorted((a, b) => a - b);
  assert.ok(sorted.every((r, i) => i === 0 || r - sorted[i - 1] >= 65));
  assert.ok(sorted.at(-1)! <= 550);
});
test('欠測・重複・別年・別単位の混入は停止する', async () => {
  const metric = await loadMetric(key, fixtureRead());
  for (const change of [
    (rows: RankingRow[]) => rows.slice(1),
    (rows: RankingRow[]) => [rows[0], ...rows.slice(0, 46)],
    (rows: RankingRow[]) =>
      rows.map((r, i) => (i ? r : { ...r, unit: '千円' })),
    (rows: RankingRow[]) =>
      rows.map((r, i) => (i ? r : { ...r, yearCode: '2023' })),
  ]) {
    const copy = structuredClone(metric);
    copy.values.partitions[0].values = change(copy.values.partitions[0].values);
    assert.throws(() => getRows(copy, '2014'));
  }
});
test('R2がgit定義と異なるときは停止する', async () => {
  const read: ReadJson = async (path) => {
    const payload = await fixtureRead()(path);
    return JSON.parse(
      JSON.stringify(payload).replace(
        buildRecipe(getMetricConfig(key)!).configHash,
        'stale'
      )
    );
  };
  await assert.rejects(() => loadMetric(key, read), /不一致/);
});
test('逆向き期間、重複抽出、非対応指標は順位図にしない', async () => {
  for (const overrides of [
    { from: '2024', to: '2014' },
    { areas: ['13', '13'] },
    { key: 'total-population' },
  ]) {
    await assert.rejects(() =>
      buildDataCard(
        { kind: 'rank-routes', key, from: '2014', to: '2024', ...overrides },
        fixtureRead(),
        shape
      )
    );
  }
});

test('補完年の人口はSSDSではなく国勢調査の出典を付ける', async () => {
  const read: ReadJson = async (path) => {
    const payload = await fixtureRead()(path);
    return path.includes('/total-population/')
      ? JSON.parse(JSON.stringify(payload).replaceAll('2024', '2025'))
      : payload;
  };
  const card = await buildDataCard(
    { kind: 'area-atlas', area: '28' },
    read,
    shape
  );
  assert.ok(
    card.sources.some(
      (source) =>
        source.name === '国勢調査' && source.url.includes('0004065881')
    )
  );
});

test('離島で主要部が縮む場合だけ拡大し、省略を明示する', () => {
  const topology: Topology<{ pref: GeometryCollection<{ N03_007: string }> }> =
    JSON.parse(
      readFileSync(
        new URL(
          '../../../../apps/remotion/public/prefecture.topojson',
          import.meta.url
        ),
        'utf8'
      )
    );
  const features = feature(topology, topology.objects.pref).features;
  const hyogo = prefectureShape(
    features.find((f) => f.properties.N03_007 === '28')!
  );
  const tokyo = prefectureShape(
    features.find((f) => f.properties.N03_007 === '13')!
  );
  assert.doesNotMatch(hyogo.note, /省略/);
  assert.match(tokyo.note, /離島省略/);
  assert.ok(tokyo.path.startsWith('M'));
  assert.ok(!tokyo.path.includes('NaN'));
});
