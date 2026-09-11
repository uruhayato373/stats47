import { describe, expect, it } from 'vitest';

import {
  parseMedicalWorkforceSnapshot,
  selectMedicalWorkforceArea,
} from '../medical-workforce-snapshot';

import { medicalWorkforceFixture as fixture } from './medical-workforce-fixture';

describe('2024年医療人材snapshot', () => {
  it('14年齢階級と不詳を含む45診療科を同じ母集団で保持する', () => {
    const snapshot = parseMedicalWorkforceSnapshot(fixture());
    expect(snapshot).not.toBeNull();
    expect(snapshot!.national.totalPhysicians).toBe(331092);
    expect(snapshot!.areas).toHaveLength(47);
    expect(snapshot!.areas[0].ages).toHaveLength(14);
    expect(snapshot!.areas[0].specialties).toHaveLength(45);
    expect(snapshot!.areas[0].specialties.at(-1)?.specialty).toBe('不詳');
  });
  it('全国・選択県だけを返し、不正な県は全国へ置き換えない', () => {
    const snapshot = parseMedicalWorkforceSnapshot(fixture())!;
    expect(selectMedicalWorkforceArea(snapshot, null)?.areaCode).toBe('00000');
    expect(selectMedicalWorkforceArea(snapshot, '01000')?.areaName).toBe(
      '北海道'
    );
    expect(selectMedicalWorkforceArea(snapshot, '13000')?.areaName).toBe(
      '東京都'
    );
    expect(selectMedicalWorkforceArea(snapshot, '99999')).toBeNull();
  });
  const mutations: [string, (data: ReturnType<typeof fixture>) => void][] = [
    [
      '別バージョン',
      (d) => {
        d.schemaVersion = 2;
      },
    ],
    [
      '別年',
      (d) => {
        d.period = '2022-12-31';
      },
    ],
    [
      '常勤換算への対象変更',
      (d) => {
        d.population = '常勤換算医師';
      },
    ],
    [
      '単位変更',
      (d) => {
        d.unit = '%';
      },
    ],
    [
      '出典URL変更',
      (d) => {
        d.source.url = 'https://example.com/';
      },
    ],
    [
      '原表SHA変更',
      (d) => {
        d.source.files[0].sha256 = 'a'.repeat(64);
      },
    ],
    [
      '原表URL変更',
      (d) => {
        d.source.files[0].url = 'https://example.com/source.csv';
      },
    ],
    [
      '原表欠落',
      (d) => {
        d.source.files.pop();
      },
    ],
    [
      '原表重複',
      (d) => {
        d.source.files[0] = structuredClone(d.source.files[1]);
      },
    ],
    [
      '県欠落',
      (d) => {
        d.areas.pop();
      },
    ],
    [
      '県重複',
      (d) => {
        d.areas[0] = structuredClone(d.areas[1]);
      },
    ],
    [
      '県名不一致',
      (d) => {
        d.areas[0].areaName = '東京都';
      },
    ],
    [
      '全国の県コード混入',
      (d) => {
        d.national.areaCode = '01000';
      },
    ],
    [
      '年齢階級欠落',
      (d) => {
        d.areas[0].ages.pop();
      },
    ],
    [
      '年齢階級重複',
      (d) => {
        d.areas[0].ages[0].ageGroup = d.areas[0].ages[1].ageGroup;
      },
    ],
    [
      '診療科不詳の除去',
      (d) => {
        d.areas[0].specialties.pop();
      },
    ],
    [
      '診療科差替え',
      (d) => {
        d.areas[0].specialties[0].specialty = '複数回答の内科';
      },
    ],
    [
      '年齢人数変更',
      (d) => {
        d.areas[0].ages[0].physicians += 1;
      },
    ],
    [
      '診療科人数変更',
      (d) => {
        d.areas[0].specialties[0].physicians += 1;
      },
    ],
    [
      '負数',
      (d) => {
        d.areas[0].ages[0].physicians = -1;
      },
    ],
    [
      '非整数',
      (d) => {
        d.areas[0].ages[0].physicians += 0.5;
      },
    ],
    [
      '県内総数を保った年齢配分改変',
      (d) => {
        d.areas[0].ages[0].physicians += 1;
        d.areas[0].ages[1].physicians -= 1;
      },
    ],
    [
      '県内総数を保った診療科配分改変',
      (d) => {
        d.areas[0].specialties[0].physicians += 1;
        d.areas[0].specialties[1].physicians -= 1;
      },
    ],
    [
      '全保存則を保った公式コホート人数変更',
      (d) => {
        d.areas[0].totalPhysicians += 1;
        d.areas[0].ages[0].physicians += 1;
        d.areas[0].specialties[0].physicians += 1;
        d.national.totalPhysicians += 1;
        d.national.ages[0].physicians += 1;
        d.national.specialties[0].physicians += 1;
      },
    ],
    [
      '全国の年齢配分改変',
      (d) => {
        d.national.ages[0].physicians += 1;
        d.national.ages[1].physicians -= 1;
      },
    ],
    [
      '全国の診療科配分改変',
      (d) => {
        d.national.specialties[0].physicians += 1;
        d.national.specialties[1].physicians -= 1;
      },
    ],
  ];
  it.each(mutations)('%sを例外なく拒否する', (_, mutate) => {
    const data = fixture();
    mutate(data);
    expect(() => parseMedicalWorkforceSnapshot(data)).not.toThrow();
    expect(parseMedicalWorkforceSnapshot(data)).toBeNull();
  });
  it('取得失敗・空payloadを安全に拒否する', () => {
    expect(parseMedicalWorkforceSnapshot(null)).toBeNull();
    expect(parseMedicalWorkforceSnapshot({})).toBeNull();
  });
});
