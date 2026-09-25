import { describe, expect, it } from 'vitest';

import { METRICS_REGISTRY, mergeDataSourceEntries } from '@stats47/data-configs';

import {
  extractGeoAnalysisSlugs,
  resolveBlogChartDataSources,
  resolveGeoItemDataSources,
  resolveMetricDataSources,
  resolveRankingItemDataSources,
} from '../data-source-entries';

const ESTAT = 'https://www.e-stat.go.jp/dbview?sid=';

describe('resolveBlogChartDataSources', () => {
  it('e-Stat の一次統計は調査の行に統計表 (statsName) を付け、同じ調査の表を 1 行にまとめる', () => {
    const amount = { kind: 'estat', statsDataId: '0003343671', statsName: '家計調査 月次 (金額)' };
    const quantity = { kind: 'estat', statsDataId: '0003343670', statsName: '家計調査 月次 (数量)' };
    const entries = mergeDataSourceEntries([
      ...resolveBlogChartDataSources(amount, METRICS_REGISTRY),
      ...resolveBlogChartDataSources(quantity, METRICS_REGISTRY),
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      surveyId: 'kakei-chousa',
      organization: '総務省統計局',
      tables: [
        { label: '家計調査 月次 (金額)', url: `${ESTAT}0003343671` },
        { label: '家計調査 月次 (数量)', url: `${ESTAT}0003343670` },
      ],
    });
  });

  it('SSDS は「社会・人口統計体系」の行に統計表を付け、原典調査は表なしの行にする', () => {
    const entries = resolveBlogChartDataSources(
      { kind: 'ranking', rankingKey: 'total-population', year: '2024' },
      METRICS_REGISTRY
    );

    expect(entries[0]).toMatchObject({
      label: '社会・人口統計体系',
      tables: [{ url: `${ESTAT}0000010101` }],
    });
    expect(entries[0].surveyId).toBeUndefined();
    const originals = entries.slice(1);
    expect(originals.length).toBeGreaterThan(0);
    expect(originals.every((entry) => entry.surveyId && entry.tables.length === 0)).toBe(true);
  });

  it('displaySources があれば他の参照より優先し、surveyId は調査マスタの名前・機関へ解決する', () => {
    const entries = resolveBlogChartDataSources(
      {
        kind: 'manual',
        sourceName: '別の出典',
        displaySources: [
          { label: '賃金構造基本統計調査', surveyId: 'wage-structure-survey' },
          { label: '国土地理院『電子国土基本図（地名情報）』', license: 'PDL1.0' },
        ],
      },
      METRICS_REGISTRY
    );

    expect(entries).toEqual([
      expect.objectContaining({ surveyId: 'wage-structure-survey', organization: '厚生労働省' }),
      { label: '国土地理院『電子国土基本図（地名情報）』', tables: [], license: 'PDL1.0' },
    ]);
  });

  it('調査対象外の図でも、出典名と URL があれば出所として表示する', () => {
    const entries = resolveBlogChartDataSources(
      {
        kind: 'manual',
        surveyScope: 'not-applicable',
        surveyScopeReason: '事業計画認定情報の件数で統計調査ではない',
        sourceName: '再生可能エネルギー 事業計画認定情報',
        url: 'https://www.fit-portal.go.jp/',
      },
      METRICS_REGISTRY
    );

    expect(entries).toEqual([
      expect.objectContaining({
        label: '再生可能エネルギー 事業計画認定情報',
        url: 'https://www.fit-portal.go.jp/',
      }),
    ]);
  });

  it('記事の本文由来の図 (authored) と壊れた入力は出典を作らない', () => {
    expect(resolveBlogChartDataSources({ kind: 'authored', statsDataId: '0003343671' }, METRICS_REGISTRY)).toEqual([]);
    expect(resolveBlogChartDataSources(null, METRICS_REGISTRY)).toEqual([]);
  });
});

describe('resolveMetricDataSources', () => {
  it('calculated 指標は分子・分母の出典をたどって統合する', () => {
    const calculated = Object.values(METRICS_REGISTRY).find(
      (metric) => metric.source.kind === 'calculated'
    );
    if (!calculated) return;
    const entries = resolveMetricDataSources(calculated, METRICS_REGISTRY);
    expect(entries.length).toBeGreaterThan(0);
  });
});

describe('resolveRankingItemDataSources', () => {
  it('統計表 ID が無い item は焼き込み済みの source と原典調査から作る', () => {
    const entries = resolveRankingItemDataSources({
      sourceConfig: { source: { name: '国土数値情報', url: 'https://nlftp.mlit.go.jp/ksj/' } },
      attribution: { compilation: null, originalSurveys: [{ id: 'mlit-ksj', name: '国土数値情報' }] },
    });
    expect(entries).toEqual([
      expect.objectContaining({
        surveyId: 'mlit-ksj',
        tables: [{ label: '国土数値情報', url: 'https://nlftp.mlit.go.jp/ksj/' }],
      }),
    ]);
  });

  it('統計表 ID がある item は e-Stat の統計表を指す', () => {
    const entries = resolveRankingItemDataSources({
      sourceConfig: { statsDataId: '0000010101', cdCat01: 'A1101' },
    });
    expect(entries[0].tables).toEqual([{ label: '統計表', url: `${ESTAT}0000010101` }]);
  });
});

describe('geo item の出典', () => {
  it('source.json が参照する geo 分析 slug を抽出し、item の sources をライセンス付きの行にする', () => {
    expect(
      extractGeoAnalysisSlugs({ source: 'r2:app/geo/population-flood-risk/item.json', inputs: [{ key: 'app/geo/population-flood-risk/manifest.json' }] })
    ).toEqual(['population-flood-risk']);
    expect(
      resolveGeoItemDataSources({
        item: {
          sources: [
            { name: '国土交通省『洪水浸水想定区域』', url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31b-2025.html', license: 'CC BY 4.0' },
          ],
        },
      })
    ).toEqual([
      {
        label: '国土交通省『洪水浸水想定区域』',
        url: 'https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-A31b-2025.html',
        tables: [],
        license: 'CC BY 4.0',
      },
    ]);
  });
});
