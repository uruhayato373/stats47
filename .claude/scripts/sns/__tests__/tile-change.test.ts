import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  CHANGE_TILE_LAYOUT,
  changeBin,
  signedPercent,
} from '../../../../apps/remotion/src/features/data-cards/TileChange';
import { buildDataCard } from '../lib/data-card-input';
import { buildRecipe } from '../../../../packages/data-configs/src/recipe';
import { getMetricConfig } from '../../../../packages/data-configs/src/registry';

test('タイルは47県一度ずつ、同じセルに重ならない', () => {
  assert.equal(CHANGE_TILE_LAYOUT.length, 47);
  assert.deepEqual(
    CHANGE_TILE_LAYOUT.map(([id]) => id).sort((a, b) => a - b),
    Array.from({ length: 47 }, (_, i) => i + 1)
  );
  assert.equal(
    new Set(CHANGE_TILE_LAYOUT.map(([, x, y]) => `${x},${y}`)).size,
    47
  );
});
test('色境界は重複せず、丸める前の値で判定する', () => {
  assert.deepEqual(
    [-30.001, -30, -10.001, -10, 9.999, 10, 29.999, 30].map(changeBin),
    [0, 1, 1, 2, 2, 3, 3, 4]
  );
  assert.equal(signedPercent(-0.001), '0.0%');
  assert.throws(() => changeBin(NaN));
});
const config = getMetricConfig('total-population')!;
const read = async (key: string) =>
  key.endsWith('item.json')
    ? {
        item: {
          rankingKey: config.key,
          areaType: 'prefecture',
          title: config.title,
          unit: config.unit,
          latestYear: { yearCode: '2025' },
          valueDisplay: { conversionFactor: 1 },
          sourceConfig: {
            recipe: buildRecipe(config),
            source: { name: 'fixture', url: 'https://example.com' },
          },
        },
      }
    : {
        rankingKey: config.key,
        areaType: 'prefecture',
        partitions: ['1975', '2025'].map((year) => ({
          yearCode: year,
          count: 47,
          values: Array.from({ length: 47 }, (_, i) => ({
            areaCode: `${String(i + 1).padStart(2, '0')}000`,
            areaName: `県${i + 1}`,
            yearCode: year,
            yearName: `${year}年`,
            unit: '人',
            rank: i + 1,
            value: year === '1975' ? 100 : i < 20 ? 150 : 50,
          })),
        })),
      };
const shape = async () => {
  throw new Error('tile map must not request geometry');
};
test('同じ県の2時点を結び、47県の増減と確定値の出典を残す', async () => {
  const card = await buildDataCard(
    { kind: 'tile-change', key: 'total-population', from: '1975', to: '2025' },
    read,
    shape
  );
  assert.equal(card.kind, 'tile-change');
  if (card.kind !== 'tile-change') throw new Error('kind');
  assert.equal(card.summary, '増加 20県 ／ 減少 27県');
  assert.equal(card.rows[0].change, 50);
  assert.equal(card.rows[46].change, -50);
  assert.equal(card.sources.length, 2);
});
test('比較年逆転・未確認指標・欠測・ゼロ分母を拒否', async () => {
  for (const request of [
    {
      kind: 'tile-change' as const,
      key: 'total-population',
      from: '2025',
      to: '1975',
    },
    {
      kind: 'tile-change' as const,
      key: 'vacant-housing-rate',
      from: '1975',
      to: '2025',
    },
  ])
    await assert.rejects(buildDataCard(request, read, shape));
  await assert.rejects(
    buildDataCard(
      {
        kind: 'tile-change',
        key: 'total-population',
        from: '1975',
        to: '2025',
      },
      async (key) => {
        const value = await read(key);
        if ('partitions' in value && value.partitions) value.partitions[0].values[0].value = 0;
        return value;
      },
      shape
    ),
    /分母/
  );
});

test('片年で1県欠けた比較を作らない', async () => {
  await assert.rejects(
    buildDataCard(
      {
        kind: 'tile-change',
        key: 'total-population',
        from: '1975',
        to: '2025',
      },
      async (key) => {
        const value = await read(key);
        if ('partitions' in value && value.partitions) value.partitions[1].values.pop();
        return value;
      },
      shape
    )
  );
});
