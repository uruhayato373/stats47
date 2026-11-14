import { describe, expect, it } from 'vitest';

import type { MetricConfig, MetricRegistry } from '../types';
import {
  resolveMetricPrimaryProvenance,
  resolveMetricProvenance,
} from './resolve-metric-provenance';

// 実在の statsDataId (estat-provenance.generated.json 由来):
//   0000010103 = SSDS 都道府県テーブル / 0003445758 = 賃金構造基本統計調査 (非SSDS)
const SSDS_TABLE = '0000010103';

function metric(source: MetricConfig['source']): MetricConfig {
  return {
    key: 'test',
    title: 'test',
    unit: '人',
    category: 'population',
    source,
    entities: ['prefecture'],
    years: 'all',
    visualization: {
      domain: { mode: 'extent' },
      colorScheme: 'interpolateBlues',
      colorSchemeType: 'sequential',
      trendDomain: { mode: 'extent', padding: 0.08 },
      comparisonDomain: { mode: 'extent', padding: 0.05 },
    },
  };
}

const ids = (m: MetricConfig) =>
  resolveMetricProvenance(m)
    .map((s) => s.id)
    .sort();

describe('resolveMetricProvenance (param 単一ルール)', () => {
  it('家計調査（品目別, kakei-chousa kind）は kakei-chousa survey へ', () => {
    expect(ids(metric({ kind: 'kakei-chousa' }))).toEqual(['kakei-chousa']);
  });

  it('一次統計 estat は statsDataId で survey へ', () => {
    const m = metric({ kind: 'estat', statsDataId: '0003445758' });
    expect(ids(m)).toEqual(['wage-structure-survey']);
  });

  it('SSDS 基礎項目は statsDataId(SSDS)+cdCat01 → 原典 (複数可)', () => {
    // A1101 総人口 → 国勢調査報告 + 人口推計
    const m = metric({
      kind: 'estat',
      statsDataId: SSDS_TABLE,
      cdCat01: 'A1101',
    });
    expect(ids(m)).toEqual(['census', 'population-estimates']);
  });

  it('SSDS 指標は計算式を基礎項目へ分解し原典を union する', () => {
    // #A01202 可住地面積人口密度 = A1101/B1103 → census + population-estimates + area-survey
    const m = metric({
      kind: 'estat',
      statsDataId: SSDS_TABLE,
      cdCat01: '#A01202',
    });
    expect(ids(m)).toEqual(['area-survey', 'census', 'population-estimates']);
  });

  it('CDCAT01_SOURCE_OVERRIDE: Excel に資料源が無い派生項目も解決する', () => {
    // #A03506 65歳以上人口割合 → census (override)
    const m = metric({
      kind: 'estat',
      statsDataId: SSDS_TABLE,
      cdCat01: '#A03506',
    });
    expect(ids(m)).toEqual(['census']);
  });

  it('SSDS 市区町村テーブルも statsDataId で SSDS 判定される', () => {
    // 0000020301 は SSDS 市区町村テーブル
    const m = metric({
      kind: 'estat',
      statsDataId: '0000020301',
      cdCat01: 'A1101',
    });
    expect(ids(m)).toEqual(['census', 'population-estimates']);
  });

  it('未登録 statsDataId (一次統計でも表に無い) は空配列 (偽 survey を作らない)', () => {
    const m = metric({ kind: 'estat', statsDataId: '9999999999' });
    expect(resolveMetricProvenance(m)).toEqual([]);
  });

  it('external は正式な displayName 辞書があれば master survey id へ解決する', () => {
    const m = metric({
      kind: 'external',
      fetcherKey: 'local-public-employee-salary',
      config: {},
      displayName: '地方公務員給与実態調査',
    });
    expect(ids(m)).toEqual(['local-public-employee-salary']);
  });

  it('external の未知 displayName は合成 id のまま保持する', () => {
    const m = metric({
      kind: 'external',
      fetcherKey: 'unknown',
      config: {},
      displayName: '未登録の外部資料',
    });
    expect(ids(m)).toEqual(['src:未登録の外部資料']);
  });

  it('calculated subtract は左右 operand の調査を union する', () => {
    const registry = {
      left: metric({ kind: 'kakei-chousa' }),
      right: metric({ kind: 'estat', statsDataId: '0003445758' }),
    } as MetricRegistry;
    const m = metric({
      kind: 'calculated',
      formula: {
        op: 'subtract',
        left: 'left',
        right: 'right',
      },
    });
    expect(
      resolveMetricProvenance(m, registry)
        .map((survey) => survey.id)
        .sort()
    ).toEqual(['kakei-chousa', 'wage-structure-survey']);
  });

  it('legacy external calculated も calculation の分子・分母を辿る', () => {
    const registry = {
      numerator: metric({ kind: 'kakei-chousa' }),
      denominator: metric({
        kind: 'estat',
        statsDataId: '0003445758',
      }),
    } as MetricRegistry;
    const m = {
      ...metric({
        kind: 'external',
        fetcherKey: 'calculated',
        config: {},
      }),
      calculation: {
        isCalculated: true,
        type: 'ratio',
        numeratorKey: 'numerator',
        denominatorKey: 'denominator',
      },
    } satisfies MetricConfig;
    expect(
      resolveMetricProvenance(m, registry)
        .map((survey) => survey.id)
        .sort()
    ).toEqual(['kakei-chousa', 'wage-structure-survey']);
  });
});

describe('resolveMetricPrimaryProvenance (調査のページへ並べる主出典 = 計算式の分子)', () => {
  const primaryIds = (m: MetricConfig, registry?: MetricRegistry) =>
    resolveMetricPrimaryProvenance(m, registry)
      .map((s) => s.id)
      .sort();

  it('SSDS 指標は分子の基礎項目の原典だけを返す (分母の人口・面積の調査を数えない)', () => {
    // #A05202 粗出生率 = A4101 出生数 (人口動態統計) / A1101 総人口 (国勢調査・人口推計)
    const m = metric({ kind: 'estat', statsDataId: SSDS_TABLE, cdCat01: '#A05202' });
    expect(primaryIds(m)).toEqual(['vital-statistics']);
    // 出典の表記に使う全原典は変えない
    expect(ids(m)).toEqual(['census', 'population-estimates', 'vital-statistics']);
  });

  it('分子が国勢調査の指標は国勢調査のまま (分母の面積調だけ外れる)', () => {
    // #A01201 人口密度 = A1101 総人口 / B1101 総面積
    const m = metric({ kind: 'estat', statsDataId: SSDS_TABLE, cdCat01: '#A01201' });
    expect(primaryIds(m)).toEqual(['census', 'population-estimates']);
  });

  it('SSDS 基礎項目・一次統計・家計調査は全原典と同じ', () => {
    const base = metric({ kind: 'estat', statsDataId: SSDS_TABLE, cdCat01: 'A1101' });
    expect(primaryIds(base)).toEqual(ids(base));
    const primary = metric({ kind: 'estat', statsDataId: '0003445758' });
    expect(primaryIds(primary)).toEqual(['wage-structure-survey']);
    expect(primaryIds(metric({ kind: 'kakei-chousa' }))).toEqual(['kakei-chousa']);
  });

  it('分子の基礎項目が資料源の手当て (override) を持つ指標は、その原典を返す', () => {
    // #C04605 = C360111 国内銀行預金残高 (Excel に資料源が無く、手当てで日本銀行統計) / A1101 総人口。
    // 式の全項目の資料源を合わせた全原典は人口の調査だけになっていた
    const m = metric({ kind: 'estat', statsDataId: SSDS_TABLE, cdCat01: '#C04605' });
    expect(primaryIds(m)).toEqual(['boj-statistics']);
  });

  it('calculated divide は分子の指標だけを辿る', () => {
    const registry = {
      numerator: metric({ kind: 'kakei-chousa' }),
      denominator: metric({ kind: 'estat', statsDataId: SSDS_TABLE, cdCat01: 'A1101' }),
    } as MetricRegistry;
    const m = metric({
      kind: 'calculated',
      formula: { op: 'divide', numerator: 'numerator', denominator: 'denominator' },
    });
    expect(primaryIds(m, registry)).toEqual(['kakei-chousa']);
    expect(
      resolveMetricProvenance(m, registry).map((s) => s.id).sort()
    ).toEqual(['census', 'kakei-chousa', 'population-estimates']);
  });

  it('legacy external calculated は分子 (numeratorKey) だけを辿る', () => {
    const registry = {
      numerator: metric({ kind: 'kakei-chousa' }),
      denominator: metric({ kind: 'estat', statsDataId: '0003445758' }),
    } as MetricRegistry;
    const m = {
      ...metric({ kind: 'external', fetcherKey: 'calculated', config: {} }),
      calculation: {
        isCalculated: true,
        type: 'ratio',
        numeratorKey: 'numerator',
        denominatorKey: 'denominator',
      },
    } satisfies MetricConfig;
    expect(primaryIds(m, registry)).toEqual(['kakei-chousa']);
  });
});
