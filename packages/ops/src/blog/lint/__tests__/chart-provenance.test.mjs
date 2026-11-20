import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  extractChartSourceReferences,
  inspectChartSourceManifest,
  splitChartSourceKeys,
} from '../chart-provenance.mjs';

describe('chart provenance manifest', () => {
  it('複数rankingKeyを決定的に分解する', () => {
    assert.deepEqual(splitChartSourceKeys('metric-a + metric-b|metric-c'), [
      'metric-a',
      'metric-b',
      'metric-c',
    ]);
  });

  it('ranking sourceの復元参照を返す', () => {
    assert.deepEqual(
      inspectChartSourceManifest({
        kind: 'ranking',
        rankingKey: 'metric-a + metric-b',
      }),
      {
        verdict: 'valid',
        code: null,
        detail: '構造上の再取得条件を満たす',
        kind: 'ranking',
        rankingKeys: ['metric-a', 'metric-b'],
        metricKeys: [],
      }
    );
  });

  it('calculated sourceは入力を要求する', () => {
    const result = inspectChartSourceManifest({
      kind: 'calculated',
      xKey: 'metric-a',
      yKey: 'calculated',
      inputs: [{ statsDataId: '0003445244' }],
    });
    assert.equal(result.verdict, 'valid');
    assert.deepEqual(result.rankingKeys, []);
  });

  it('metric sourceは共通R2 statsのmetricKeyを復元参照として返す', () => {
    assert.deepEqual(
      inspectChartSourceManifest({
        kind: 'metric',
        metricKey: 'metric-a',
        source: 'r2:app/stats/metric-a/values.json',
      }),
      {
        verdict: 'valid',
        code: null,
        detail: '構造上の再取得条件を満たす',
        kind: 'metric',
        rankingKeys: [],
        metricKeys: ['metric-a'],
      }
    );
  });

  it('calculated sourceは表示用xKey/yKeyをranking参照として誤認しない', () => {
    const result = inspectChartSourceManifest({
      kind: 'calculated',
      xKey: 'metric-a',
      yKey: 'calculated',
      inputs: [{ rankingKey: 'metric-a' }, { rankingKey: 'metric-b' }],
    });
    assert.equal(result.verdict, 'valid');
    assert.deepEqual(result.rankingKeys, ['metric-a', 'metric-b']);
  });

  it('derived sourceの複数の既存表現からranking参照を抽出する', () => {
    const result = inspectChartSourceManifest({
      kind: 'derived',
      derivedFrom: [{ rankingKey: 'metric-a' }, 'metric-b'],
      xSource: 'r2:app/ranking/metric-c/values.json',
    });
    assert.equal(result.verdict, 'valid');
    assert.deepEqual(result.rankingKeys, ['metric-a', 'metric-b', 'metric-c']);
  });

  it('derived sourceのconstituentsをranking参照として抽出する', () => {
    const result = inspectChartSourceManifest({
      kind: 'derived',
      formula: 'a - b',
      constituents: { a: 'metric-a', b: 'metric-b' },
    });
    assert.equal(result.verdict, 'valid');
    assert.deepEqual(result.rankingKeys, ['metric-a', 'metric-b']);
  });

  it('scatter sourceは2軸の参照を要求する', () => {
    assert.equal(
      inspectChartSourceManifest({
        kind: 'scatter',
        derivedFrom: ['metric-a', 'metric-b'],
      }).verdict,
      'valid'
    );
    assert.equal(
      inspectChartSourceManifest({
        kind: 'scatter',
        derivedFrom: ['metric-a'],
      }).verdict,
      'invalid'
    );
  });

  it('直下・inputs・スラッシュ結合からe-Stat表IDを抽出する', () => {
    assert.deepEqual(
      extractChartSourceReferences({
        statsDataId: '0000010102/0000010202',
        inputs: [{ statsDataId: '0003445758' }],
      }).statsDataIds,
      ['0000010102', '0000010202', '0003445758']
    );
  });

  it('直下fieldとR2 pathからstats metric参照を抽出する', () => {
    assert.deepEqual(
      extractChartSourceReferences({
        metricKey: 'metric-a',
        source: 'r2:app/stats/metric-b/values.json',
      }).metricKeys,
      ['metric-a', 'metric-b']
    );
  });

  it('テンプレート表記を実在キーとして誤認しない', () => {
    const source = {
      kind: 'scatter',
      xKey: 'metric-a',
      yKey: 'metric-b',
      source:
        'r2:app/stats/<item>-quantity/values.json + r2:app/stats/<item>-expenditure/values.json',
      transform: 'R2 app/ranking/<key>/values.json から結合',
    };

    assert.deepEqual(inspectChartSourceManifest(source).rankingKeys, [
      'metric-a',
      'metric-b',
    ]);
    assert.deepEqual(extractChartSourceReferences(source).metricKeys, []);
    assert.deepEqual(extractChartSourceReferences(source).r2ObjectPaths, []);
  });

  it('partition付きstats objectを正確なR2参照として抽出する', () => {
    const references = extractChartSourceReferences({
      kind: 'derived',
      metricKey: 'population-migration-inter-prefecture',
      source:
        'r2:app/stats/population-migration-inter-prefecture/migration-flow-2025.json',
    });

    assert.deepEqual(references.metricKeys, [
      'population-migration-inter-prefecture',
    ]);
    assert.deepEqual(references.r2ObjectPaths, [
      'app/stats/population-migration-inter-prefecture/migration-flow-2025.json',
    ]);
  });

  it('braceと年範囲のR2テンプレートを検査可能なobjectへ展開する', () => {
    assert.deepEqual(
      extractChartSourceReferences({
        source: 'r2:app/stats/{metric-a,metric-b}/values.json',
      }).r2ObjectPaths,
      ['app/stats/metric-a/values.json', 'app/stats/metric-b/values.json']
    );
    assert.deepEqual(
      extractChartSourceReferences({
        year: '2025',
        transform: '2023〜2025 年',
        source: 'r2:app/stats/metric-a/partition-<year>.json',
      }).r2ObjectPaths,
      [
        'app/stats/metric-a/partition-2023.json',
        'app/stats/metric-a/partition-2024.json',
        'app/stats/metric-a/partition-2025.json',
      ]
    );
  });

  it('incomplete宣言を公開可能と判定しない', () => {
    const result = inspectChartSourceManifest({
      kind: 'ranking',
      rankingKey: 'metric-a',
      incomplete: true,
    });
    assert.equal(result.verdict, 'invalid');
    assert.equal(result.code, 'self-declared-incomplete');
  });

  it('統計調査を原典としない派生データは理由付きで明示できる', () => {
    const result = inspectChartSourceManifest({
      kind: 'derived',
      source: 'r2:app/gis/medical-facilities.json',
      surveyScope: 'not-applicable',
      surveyScopeReason:
        '国土数値情報のGISデータセットを空間集計した値で、統計調査を原典としないため',
    });
    assert.equal(result.verdict, 'valid');
  });

  it('surveyScopeの未知値と理由欠落を公開可能と判定しない', () => {
    const unknown = inspectChartSourceManifest({
      kind: 'derived',
      source: 'r2:app/gis/medical-facilities.json',
      surveyScope: 'external',
    });
    assert.equal(unknown.verdict, 'invalid');
    assert.equal(unknown.code, 'invalid-survey-scope');

    const noReason = inspectChartSourceManifest({
      kind: 'derived',
      source: 'r2:app/gis/medical-facilities.json',
      surveyScope: 'not-applicable',
    });
    assert.equal(noReason.verdict, 'invalid');
    assert.equal(noReason.code, 'invalid-survey-scope-reason');

    const orphanReason = inspectChartSourceManifest({
      kind: 'derived',
      source: 'r2:app/gis/medical-facilities.json',
      surveyScopeReason: '統計調査を原典としないため対象外とする',
    });
    assert.equal(orphanReason.verdict, 'invalid');
    assert.equal(orphanReason.code, 'invalid-survey-scope-reason');
  });

  it('未知kindを検出する', () => {
    const result = inspectChartSourceManifest({
      kind: 'future-source',
      source: 'example',
    });
    assert.equal(result.verdict, 'invalid');
    assert.equal(result.code, 'unknown-kind');
  });

  it('authoredは外部SSOT検査の対象外として明示する', () => {
    const result = inspectChartSourceManifest({ kind: 'authored' });
    assert.equal(result.verdict, 'out-of-scope');
  });
});
