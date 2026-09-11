import { describe, expect, it } from 'vitest';

import {
  parseShelterApplicabilitySnapshot,
  selectShelterApplicability,
  type ShelterApplicabilitySnapshot,
} from '../shelter-applicability-snapshot';

import { shelterApplicabilityFixture } from './shelter-applicability-fixture';
describe('指定緊急避難場所と指定避難所を分ける出典契約', () => {
  it('全国と47県・8災害・同じ母数を受け入れる', () => {
    const v = parseShelterApplicabilitySnapshot(shelterApplicabilityFixture());
    expect(v?.rows).toHaveLength(47);
    expect(v?.national.emergency.hazards).toHaveLength(8);
  });
  const cases: Array<[string, (v: ShelterApplicabilitySnapshot) => void]> = [
    [
      '県の災害区分欠落',
      (v) => {
        v.rows[0]!.emergency.hazards.pop();
      },
    ],
    [
      '全国の災害区分欠落',
      (v) => {
        v.national.emergency.hazards.pop();
      },
    ],
    [
      '実在しない更新日',
      (v) => {
        v.rows[0]!.latestDatabaseUpdate = '2026-00-00';
      },
    ],
    [
      'source pin変更',
      (v) => {
        v.sourcePins[0]!.sha256 = '0'.repeat(64);
      },
    ],
    [
      'source pin省略',
      (v) => {
        v.sourcePins.pop();
      },
    ],
    [
      '取得日の変更',
      (v) => {
        Object.assign(v, { acquiredOn: '2026-09-10' });
      },
    ],
    [
      'source version変更',
      (v) => {
        Object.assign(v, { dataVersion: 'future' });
      },
    ],
    [
      '単位の変更',
      (v) => {
        Object.assign(v, { unit: '施設数' });
      },
    ],
    [
      '県の欠落',
      (v) => {
        v.rows.pop();
      },
    ],
    [
      '県の重複',
      (v) => {
        v.rows[1] = structuredClone(v.rows[0]!);
      },
    ],
    [
      '県名の誤り',
      (v) => {
        v.rows[0]!.areaName = '青森県';
      },
    ],
    [
      '全国の場所数改変',
      (v) => {
        v.national.emergency.facilities++;
      },
    ],
    [
      '県別の該当数改変',
      (v) => {
        v.rows[0]!.emergency.hazards[0]!.applicable++;
      },
    ],
    [
      '合計が一致しても原典全国の該当数を改変',
      (v) => {
        for (const r of [v.rows[0]!, v.national]) {
          r.emergency.hazards[0]!.applicable++;
          r.emergency.hazards[0]!.notApplicable--;
        }
      },
    ],
    [
      '空欄を不明へ読み替える',
      (v) => {
        for (const r of [v.rows[0]!, v.national]) {
          r.emergency.hazards[0]!.unknown++;
          r.emergency.hazards[0]!.notApplicable--;
        }
      },
    ],
    [
      '災害区分の重複',
      (v) => {
        v.rows[0]!.emergency.hazards[1]!.key = 'flood';
      },
    ],
    [
      '避難所へ災害属性を移す',
      (v) => {
        Object.assign(v.rows[0]!.shelter, {
          hazards: v.rows[0]!.emergency.hazards,
        });
      },
    ],
    [
      '一般避難所・福祉避難所の合計不一致',
      (v) => {
        v.rows[0]!.shelter.general++;
      },
    ],
    [
      '公開対象に未登録自治体を混ぜる',
      (v) => {
        v.rows[0]!.coverage.bothPublished++;
      },
    ],
    [
      '県内場所数より多い同一住所',
      (v) => {
        v.rows[0]!.emergency.addressAlsoShelter =
          v.rows[0]!.emergency.facilities + 1;
      },
    ],
    [
      '小数件数',
      (v) => {
        v.rows[0]!.shelter.welfare = 1.5;
      },
    ],
    [
      '負値',
      (v) => {
        v.rows[0]!.emergency.hazards[0]!.notApplicable = -1;
      },
    ],
    [
      '未来のDB更新日',
      (v) => {
        v.rows[0]!.latestDatabaseUpdate = '2026-09-12';
      },
    ],
  ];
  for (const [label, change] of cases)
    it(label + 'を拒否する', () => {
      const v = shelterApplicabilityFixture();
      change(v);
      expect(parseShelterApplicabilitySnapshot(v)).toBeNull();
    });
  it('不正県は全国にも0件にもフォールバックしない', () => {
    const v = shelterApplicabilityFixture();
    expect(selectShelterApplicability(v, null)?.areaCode).toBe('00000');
    expect(selectShelterApplicability(v, '13000')?.areaName).toBe('東京都');
    expect(selectShelterApplicability(v, '99999')).toBeNull();
  });
});
