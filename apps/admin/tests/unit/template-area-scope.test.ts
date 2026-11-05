import { describe, expect, it } from 'vitest';
import { chartSourceShapeErrors } from '../../../../.claude/scripts/lib/chart-source-schema.mjs';
import { lintImageTypeSvg } from '../../../../.claude/scripts/lib/svg-lint.mjs';
import { areaChartFromArticleData } from '../../../../.claude/scripts/blog/lib/type-chart-input';
import { areasOf, resolveAreaChart, type AreaScope, type AreaValue } from '@/lib/template-area-scope';
import { renderAreaBarsChart } from '@/lib/template-ranking-bars';

const presentation = { colorScheme: 'interpolateBlues', colorSchemeType: 'sequential', domain: { mode: 'extent' }, classification: { method: 'continuous' }, trendDomain: { mode: 'extent' }, comparisonDomain: { mode: 'extent' } } as never;
const base = { title: '人口', yearLabel: '2020年', unit: '人', source: '国勢調査', presentation };
const YOKOHAMA = '14100', TSURUMI = '14101', KAWASAKI = '14130', SAGAMIHARA = '14150', YOKOSUKA = '14201';
const merged: AreaScope = { level: 'municipality', wardMode: 'merged', within: { kind: 'prefecture', prefCode: '14' } };
const split: AreaScope = { level: 'municipality', wardMode: 'split', within: { kind: 'prefecture', prefCode: '14' } };
const values: AreaValue[] = [
  { areaCode: YOKOHAMA, value: 3_700_000 }, { areaCode: KAWASAKI, value: 1_500_000 }, { areaCode: SAGAMIHARA, value: 700_000 },
  { areaCode: YOKOSUKA, value: 390_000 }, { areaCode: TSURUMI, value: 290_000 },
];

describe('地域の範囲', () => {
  it('統合は市全体を含み行政区を含まない。分割はその逆', () => {
    expect(areasOf(merged).has(YOKOHAMA)).toBe(true);
    expect(areasOf(merged).has(TSURUMI)).toBe(false);
    expect(areasOf(split).has(YOKOHAMA)).toBe(false);
    expect(areasOf(split).get(TSURUMI)).toBe('横浜市鶴見区');
  });
  it('東京の特別区はどちらのフラグでも区ごとで、特別区部は入らない', () => {
    for (const wardMode of ['merged', 'split'] as const) {
      const areas = areasOf({ level: 'municipality', wardMode, within: { kind: 'prefecture', prefCode: '13' } });
      expect(areas.has('13101')).toBe(true);
      expect(areas.has('13100')).toBe(false);
    }
  });
  it('実在しない県のコードは止める', () => {
    expect(() => areasOf({ level: 'municipality', wardMode: 'merged', within: { kind: 'prefecture', prefCode: '48' } })).toThrow('都道府県コード');
  });
});

describe('順位は集合ごとに数える', () => {
  it('同じ市でも統合と分割で順位が変わる', () => {
    const inMerged = resolveAreaChart({ ...base, scope: merged, values });
    const inSplit = resolveAreaChart({ ...base, scope: split, values });
    expect(inMerged.rows.find((r) => r.area_code === YOKOSUKA)!.rank).toBe(4);
    expect(inSplit.rows.find((r) => r.area_code === YOKOSUKA)!.rank).toBe(1);
  });
  it('入力の値を変えなければ同値は同順位になる', () => {
    const chart = resolveAreaChart({ ...base, scope: merged, values: [{ areaCode: YOKOHAMA, value: 5 }, { areaCode: KAWASAKI, value: 5 }, { areaCode: YOKOSUKA, value: 1 }] });
    expect(chart.rows.map((r) => r.rank)).toEqual([1, 1, 3]);
  });
  it('値の無い地域は順位に入れず、欠けとして返す', () => {
    const chart = resolveAreaChart({ ...base, scope: merged, values: [...values, { areaCode: '14203', value: null }] });
    expect(chart.rows.some((r) => r.area_code === '14203')).toBe(false);
    expect(chart.missing).toContain('14203');
  });
  it('マスタに無いコードと重複を止める', () => {
    expect(() => resolveAreaChart({ ...base, scope: merged, values: [{ areaCode: '99999', value: 1 }] })).toThrow('地域マスタ');
    expect(() => resolveAreaChart({ ...base, scope: merged, values: [{ areaCode: YOKOSUKA, value: 1 }, { areaCode: YOKOSUKA, value: 2 }] })).toThrow('2 つ');
  });
  it('行政区の値が無い指標は分割できない', () => {
    const noWards = values.filter((row) => row.areaCode !== TSURUMI);
    expect(() => resolveAreaChart({ ...base, scope: split, values: noWards })).toThrow('行政区');
    expect(() => resolveAreaChart({ ...base, scope: split, values: [...noWards, { areaCode: TSURUMI, value: 0 }] })).toThrow('行政区');
  });
  it('47 県がそろわない都道府県の図は止める', () => {
    expect(() => resolveAreaChart({ ...base, scope: { level: 'prefecture' }, values: [{ areaCode: '01000', value: 1 }] })).toThrow('47');
  });
  it('政令指定都市のある県は統合か分割かを画像に書く', () => {
    expect(resolveAreaChart({ ...base, scope: merged, values }).note).toBe('政令指定都市は市全体');
    expect(resolveAreaChart({ ...base, scope: split, values }).note).toBe('政令指定都市は行政区ごと');
    const noCity = resolveAreaChart({ ...base, scope: { level: 'municipality', wardMode: 'merged', within: { kind: 'prefecture', prefCode: '16' } }, values: [{ areaCode: '16201', value: 1 }] });
    expect(noCity.note).toBeUndefined();
  });
});

describe('棒の型と記事のデータ', () => {
  it('行が少なくても半分ずつ描き、範囲の印を付ける', () => {
    const svg = renderAreaBarsChart(resolveAreaChart({ ...base, scope: merged, values }));
    expect(svg.match(/data-rank="/g)).toHaveLength(4);
    expect(svg).toContain('data-ward-mode="merged"');
    expect(svg).toContain('data-within="prefecture:14"');
  });
  it('記事のデータは地域コードと範囲が無ければ型にしない', () => {
    const data = { title: '人口', year: '2020', unit: '人', source: '国勢調査', data: [{ areaName: '横須賀市', value: 1 }] };
    expect(areaChartFromArticleData(data, merged)).toHaveProperty('skip');
    expect(areaChartFromArticleData({ ...data, data: [{ areaCode: YOKOSUKA, value: 1 }] }, undefined)).toHaveProperty('skip');
    expect(areaChartFromArticleData({ ...data, data: [{ areaCode: YOKOSUKA, value: 1 }] }, merged)).toHaveProperty('scope');
  });
  it('source.json の範囲は型と同じ形だけを通す', () => {
    expect(chartSourceShapeErrors({ kind: 'manual', areaScope: merged })).toEqual([]);
    expect(chartSourceShapeErrors({ kind: 'manual', areaScope: { level: 'municipality', within: { kind: 'nation' } } })).not.toEqual([]);
    expect(chartSourceShapeErrors({ kind: 'manual', areaScope: { level: 'municipality', wardMode: 'split', within: { kind: 'designated-city', cityCode: YOKOHAMA } } })).not.toEqual([]);
  });
  it('市区町村の画像が統合か分割かを持たなければ検査で止める', () => {
    const svg = '<svg viewBox="0 0 1080 1350" data-image-template="bar" data-theme="light" data-scope="municipality"></svg>';
    expect(lintImageTypeSvg('a.svg', svg).errors.join()).toContain('統合か分割');
    expect(lintImageTypeSvg('a.svg', svg.replace('data-scope', 'data-ward-mode="merged" data-scope')).errors).toEqual([]);
  });
});
