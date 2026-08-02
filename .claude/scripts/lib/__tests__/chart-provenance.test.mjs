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
      }
    );
  });

  it('calculated sourceは入力を要求する', () => {
    const result = inspectChartSourceManifest({
      kind: 'calculated',
      inputs: [{ statsDataId: '0003445244' }],
    });
    assert.equal(result.verdict, 'valid');
    assert.deepEqual(result.rankingKeys, []);
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

  it('incomplete宣言を公開可能と判定しない', () => {
    const result = inspectChartSourceManifest({
      kind: 'ranking',
      rankingKey: 'metric-a',
      incomplete: true,
    });
    assert.equal(result.verdict, 'invalid');
    assert.equal(result.code, 'self-declared-incomplete');
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
