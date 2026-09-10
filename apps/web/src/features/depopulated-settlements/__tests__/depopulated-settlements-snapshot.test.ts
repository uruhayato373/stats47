import { DEPOPULATED_SETTLEMENTS_SOURCE as source } from '@stats47/data-configs/theme-catalog';
import { describe, expect, it } from 'vitest';

import { parseDepopulatedSettlementsSnapshot } from '../lib/depopulated-settlements-snapshot';

import { depopulatedSettlementsFixture } from './depopulated-settlements-fixture';

describe('公表地方ブロックの集落profile契約', () => {
  it('10ブロックと全国、11列の保存則・無回答・内数を検証する', () => {
    const snapshot = parseDepopulatedSettlementsSnapshot(
      depopulatedSettlementsFixture()
    )!;
    expect(snapshot.rows).toHaveLength(10);
    expect(snapshot.national.total).toBe(78485);
    expect(snapshot.national.categories[6].count).toBe(1388);
    expect(snapshot.national.age65Share50plus).toBe(31515);
    expect(snapshot.national.age65Share100).toBe(1458);
    for (const row of [...snapshot.rows, snapshot.national]) {
      expect(
        row.categories.reduce((sum, category) => sum + category.count, 0)
      ).toBe(row.total);
      expect(
        row.age65ShareUnder50 + row.age65Share50plus + row.categories[6].count
      ).toBe(row.total);
    }
  });
  it('公式47県を重複・分割なく10ブロックへ対応させる', () => {
    const codes = source.blocks.flatMap((block) => [...block.prefectureCodes]);
    expect(codes).toHaveLength(47);
    expect([...new Set(codes)].sort()).toEqual(
      Array.from(
        { length: 47 },
        (_, i) => `${String(i + 1).padStart(2, '0')}000`
      )
    );
  });
  const cases: [
    string,
    (snapshot: ReturnType<typeof depopulatedSettlementsFixture>) => void,
  ][] = [
    ['別の調査年', (s) => Object.assign(s, { period: '2019-04-01' })],
    ['別の母集団', (s) => Object.assign(s, { universeId: 'depopulated-only' })],
    ['県別へ偽装', (s) => Object.assign(s, { geography: 'prefecture' })],
    ['原典SHA相違', (s) => Object.assign(s.source, { sha256: '0'.repeat(64) })],
    ['図表2-94を混入', (s) => Object.assign(s.source, { pdfPage: 82 })],
    [
      '公式対応表の欠落',
      (s) => {
        delete (s.source as Partial<typeof s.source>).mappingPdfPage;
      },
    ],
    [
      '1ブロック欠落',
      (s) => {
        s.rows.pop();
      },
    ],
    [
      'ブロック重複',
      (s) => {
        s.rows[1] = s.rows[0];
      },
    ],
    [
      '地域名相違',
      (s) => {
        s.rows[0].blockName = '東京都';
      },
    ],
    ['県値を追加', (s) => Object.assign(s.rows[0], { areaCode: '01000' })],
    [
      '原集落の列追加',
      (s) => Object.assign(s, { settlements: [{ name: '個別集落' }] }),
    ],
    [
      '無回答を除外',
      (s) => {
        s.rows[0].categories.pop();
      },
    ],
    [
      '排他区分重複',
      (s) => {
        s.rows[0].categories[6] = s.rows[0].categories[0];
      },
    ],
    [
      '負の集落数',
      (s) => {
        s.rows[0].categories[0].count = -1;
      },
    ],
    [
      '小数の集落数',
      (s) => {
        s.rows[0].categories[0].count = 0.5;
      },
    ],
    [
      '欠測を0へ偽装',
      (s) => Object.assign(s.rows[0].categories[0], { count: null }),
    ],
    [
      '50%以上へ内数を加算',
      (s) => {
        s.rows[0].age65Share50plus += s.rows[0].age65Share100;
      },
    ],
    [
      '100%が70%以上を超過',
      (s) => {
        s.rows[0].age65Share100 = s.rows[0].categories[5].count + 1;
      },
    ],
    [
      '全国にブロック行',
      (s) => {
        s.national.blockCode = '01';
        s.national.blockName = '北海道';
      },
    ],
    [
      '区分別県計相違',
      (s) => {
        s.rows[0].categories[0].count++;
        s.rows[0].categories[1].count--;
      },
    ],
    [
      '総数だけ全国相違',
      (s) => {
        s.national.total++;
      },
    ],
    [
      '保存則を保った無回答の消去',
      (s) => {
        for (const row of [...s.rows, s.national]) {
          const removed = row.categories[6].count;
          row.categories[0].count += removed;
          row.categories[6].count = 0;
          row.age65ShareUnder50 += removed;
        }
      },
    ],
  ];
  it.each(cases)('%sを拒否する', (_, mutate) => {
    const snapshot = depopulatedSettlementsFixture();
    mutate(snapshot);
    expect(parseDepopulatedSettlementsSnapshot(snapshot)).toBeNull();
  });
});
