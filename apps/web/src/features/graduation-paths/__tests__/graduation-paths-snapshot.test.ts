import { describe, expect, it } from 'vitest';

import {
  parseGraduationPathsSnapshot,
  type GraduationPathsSnapshot,
} from '../lib/graduation-paths-snapshot';

import { graduationPathsFixture } from './graduation-paths-fixture';

describe('卒業進路の公開snapshot境界', () => {
  it('外部依存なしの47県＋全国fixtureを厳格parserで受ける', () => {
    const snapshot = graduationPathsFixture();
    expect(parseGraduationPathsSnapshot(snapshot)).toEqual(snapshot);
  });
  const failures: [string, (snapshot: GraduationPathsSnapshot) => unknown][] = [
    ['欠損', () => null],
    ['schema違い', (p) => ({ ...p, schemaVersion: 2 })],
    ['年違い', (p) => ({ ...p, period: '2024-03' })],
    ['確定前の値', (p) => ({ ...p, releaseStatus: 'preliminary' })],
    [
      '原典違い',
      (p) => ({
        ...p,
        source: { ...p.source, url: 'https://example.invalid/data' },
      }),
    ],
    [
      '原典hash違い',
      (p) => ({ ...p, source: { ...p.source, sha256: '0'.repeat(64) } }),
    ],
    [
      '県欠落',
      (p) => {
        p.rows.pop();
        return p;
      },
    ],
    [
      '県重複',
      (p) => {
        p.rows[1] = p.rows[0];
        return p;
      },
    ],
    [
      '県名違い',
      (p) => {
        p.rows[0].areaName = '東京都';
        return p;
      },
    ],
    [
      '全国を県へ混入',
      (p) => {
        p.rows[0] = p.national;
        return p;
      },
    ],
    [
      '進路区分欠落',
      (p) => {
        p.rows[0].categories.pop();
        return p;
      },
    ],
    [
      '進路区分重複',
      (p) => {
        p.rows[0].categories[1] = p.rows[0].categories[0];
        return p;
      },
    ],
    [
      '人数と総数の不一致',
      (p) => {
        p.rows[0].categories[0].count++;
        return p;
      },
    ],
    [
      '県別構成と全国構成の不一致',
      (p) => {
        p.rows[0].categories[0].count++;
        p.rows[0].categories[1].count--;
        return p;
      },
    ],
    [
      '全国総数違い',
      (p) => {
        p.national.total++;
        return p;
      },
    ],
    [
      '負数',
      (p) => {
        p.rows[0].categories[0].count = -1;
        return p;
      },
    ],
    [
      '小数人数',
      (p) => {
        p.rows[0].categories[0].count = 1.5;
        return p;
      },
    ],
    [
      '無限大',
      (p) => {
        p.rows[0].categories[0].count = Infinity;
        return p;
      },
    ],
    [
      'ゼロ分母',
      (p) => {
        p.rows[0].total = 0;
        p.rows[0].categories.forEach((c) => {
          c.count = 0;
        });
        return p;
      },
    ],
    [
      '進学者数を超える内数',
      (p) => {
        p.rows[12].overlapEmployed = p.rows[12].total;
        return p;
      },
    ],
    [
      '内数を進路構成へ二重加算',
      (p) => {
        p.rows[12].categories[4].count += p.rows[12].overlapEmployed;
        return p;
      },
    ],
    [
      '不詳を他区分へ移して保存則だけを維持',
      (p) => {
        for (const row of [...p.rows, p.national]) {
          row.categories[6].count += row.categories[7].count;
          row.categories[7].count = 0;
        }
        return p;
      },
    ],
    [
      '再掲就職者を県全国同時に変更',
      (p) => {
        p.rows[0].officialEmployed++;
        p.national.officialEmployed++;
        return p;
      },
    ],
    ['未定義のraw列', (p) => ({ ...p, sourceColumns: [] })],
  ];
  it.each(failures)('%sを表示前に拒否する', (_label, mutate) => {
    expect(
      parseGraduationPathsSnapshot(mutate(graduationPathsFixture()))
    ).toBeNull();
  });
});
