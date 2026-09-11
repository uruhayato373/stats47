import { describe, it, expect } from 'vitest';

import {
  parseWaterQualitySnapshot,
  summarizeWaterRows,
} from '../lib/water-quality-snapshot';

import { waterQualityFixture } from './water-quality-fixture';
describe('原表の水域・県帰属・判定を保持する', () => {
  it('同名行と定量下限未満値を統合・ゼロ変換しない', () => {
    const s = waterQualityFixture();
    s.rows[1]!.name = s.rows[0]!.name;
    const p = parseWaterQualitySnapshot(s)!;
    expect(p.rows).toHaveLength(3427);
    expect(p.rows[0]!.value75).toBe('<0.5');
  });
  it.each(['<<0.5', '0<.5', '<script>0.5'])('不正な未満記号 %s は数値へ変換しない', (value) => {
    const s = waterQualityFixture();
    s.rows[0]!.value75 = value;
    expect(parseWaterQualitySnapshot(s)).toBeNull();
  });
  const mutations: [
    string,
    (s: ReturnType<typeof waterQualityFixture>) => void,
  ][] = [
    [
      '年度違い',
      (s) => {
        Object.assign(s, { period: '2024年度' });
      },
    ],
    [
      '原典SHA違い',
      (s) => {
        Object.assign(s.source, { sha256: '0'.repeat(64) });
      },
    ],
    [
      '全国値を県合計で置換',
      (s) => {
        s.national.river.total = 2614;
      },
    ],
    [
      '行欠落',
      (s) => {
        s.rows.pop();
      },
    ],
    [
      '同一ID重複',
      (s) => {
        s.rows[1] = { ...s.rows[0]! };
      },
    ],
    [
      '県名と県コード不一致',
      (s) => {
        s.prefectures[0]!.areaName = '東京都';
      },
    ],
    [
      '県マスター重複',
      (s) => {
        s.prefectures[1] = { ...s.prefectures[0]! };
      },
    ],
    [
      '掲載県を別県へ付替',
      (s) => {
        s.rows[0]!.listingAreaCode = '13000';
      },
    ],
    [
      '関係県重複',
      (s) => {
        s.rows[0]!.relatedAreaCodes.push(s.rows[0]!.listingAreaCode);
      },
    ],
    [
      '水域種類誤り',
      (s) => {
        s.rows[0]!.kind = 'lake';
      },
    ],
    [
      'ページ不正',
      (s) => {
        s.rows[0]!.page = 99;
      },
    ],
    [
      '類型と基準値不一致',
      (s) => {
        s.rows[0]!.limit = 8;
      },
    ],
    [
      '○×逆転',
      (s) => {
        s.rows[0]!.compliant = false;
      },
    ],
    [
      '超過を達成扱い',
      (s) => {
        s.rows[0]!.value75 = '9';
      },
    ],
    [
      '定量下限未満記号の不正',
      (s) => {
        s.rows[0]!.value75 = '≤0.5';
      },
    ],
    [
      '平均値欠落をゼロ扱い',
      (s) => {
        s.rows[0]!.mean = '-';
      },
    ],
    [
      '注記の欠落',
      (s) => {
        s.notes.pop();
      },
    ],
  ];
  it.each(mutations)('%s を拒否する', (_, mutate) => {
    const s = waterQualityFixture();
    mutate(s);
    expect(parseWaterQualitySnapshot(s)).toBeNull();
  });
  it('掲載なしを未達成率0にしない', () => {
    const s = waterQualityFixture();
    expect(summarizeWaterRows(s, '00000', 'lake')).toMatchObject({
      total: 0,
      rate: null,
    });
  });
  it('平均濃度を使わず原表の判定で集計する', () => {
    const s = waterQualityFixture();
    const r = s.rows[0]!;
    r.mean = '9';
    const p = parseWaterQualitySnapshot(s)!;
    expect(summarizeWaterRows(p, '01000', 'river').rate).toBe(100);
  });
  it('他県欄の県際再掲を選択県へ追加しない', () => {
    const s = waterQualityFixture(),
      before = summarizeWaterRows(s, '13000', 'river').total;
    s.rows[0]!.relatedAreaCodes.push('13000');
    expect(summarizeWaterRows(s, '13000', 'river').total).toBe(before);
  });
});
