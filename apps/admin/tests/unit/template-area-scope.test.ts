import { describe, expect, it } from 'vitest';
import { chartSourceShapeErrors } from '../../../../.claude/scripts/lib/chart-source-schema.mjs';
import { lintImageTypeSvg } from '../../../../.claude/scripts/lib/svg-lint.mjs';
import { areaChartFromArticleData, chartSourceName, groupedBarChartFromArticleData, hasCyclicAxis, lineChartFromArticleData, stackedChartFromArticleData } from '../../../../.claude/scripts/blog/lib/type-chart-input';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import { areasOf, resolveAreaChart, type AreaScope, type AreaValue } from '@/lib/template-area-scope';
import { applyColorPolicy, colorPolicyOf, colorPolicyRow, joinColorPolicy, signedThresholds } from '../../../../packages/types/src/color-policy';
import { renderGroupedBarsChart } from '@/lib/template-grouped-bars';
import { renderAreaBarsChart } from '@/lib/template-ranking-bars';
import { resolveTileScale } from '../../../remotion/src/features/data-cards/tile-scale';

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
  it('計算した割合の凡例にも値と同じ表示精度を渡し、長い小数を表示しない', () => {
    const chart = resolveAreaChart({ ...base, unit: '%', scope: merged, values: [
      { areaCode: YOKOHAMA, value: -49.0122255923 }, { areaCode: KAWASAKI, value: -1.3767881123 },
    ] });
    const scale = resolveTileScale(chart.presentation, chart.rows.map(row => row.value), chart.display)!;
    expect(scale.boundaries.map(scale.formatBoundary!)).toEqual(['-49.01', '-1.38']);
    expect(chart.formatValue(chart.rows[0].value)).toBe('-1.38');
    expect(chart.rows[0].value).toBe(-1.3767881123);
  });
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
  it('統合か分割かを文で書かず、画像の印だけで持つ', () => {
    expect(resolveAreaChart({ ...base, scope: merged, values }).note).toBeUndefined();
    expect(resolveAreaChart({ ...base, scope: split, values }).note).toBeUndefined();
  });
});

describe('画像の文言', () => {
  it('読み方の説明を止める', () => {
    for (const text of ['帯の太さは移動した人数', '色は移動元の地方', '政令指定都市は市全体', '各行は47都道府県の合計', '総量を 100％とした割合'])
      expect(() => assertMinimalChartCopy(`<svg><text>${text}</text></svg>`)).toThrow();
  });
  it('記事の説明文を条件の行へ流さず、意味を変える条件だけを残す', () => {
    const line = lineChartFromArticleData({ title: '支出額の推移 (二人以上の世帯・全国)', subtitle: '説明の文', unit: '円', data: [{ year: 2020, value: 1 }] });
    expect(line).toMatchObject({ title: '支出額の推移', note: '二人以上の世帯・全国' });
    const compared = lineChartFromArticleData({ title: '出生率の推移（東京 vs 沖縄、1980-2023）', data: [{ year: 2020, value: 1 }] });
    expect(compared).toMatchObject({ title: '出生率の推移', note: undefined });
  });
  it('積み上げの年は見出しの行へ移し、説明の subtitle を使わない', () => {
    const chart = stackedChartFromArticleData({ title: '産出額の構成（2018年）', subtitle: '各地域の総量を 100％とした割合', unit: '%', series: [{ label: '米', data: [{ year: '東北', value: 1 }] }] });
    expect(chart).toMatchObject({ meta: '2018年 · 単位：%', note: undefined });
  });
  it('長い調査名は調査の名前だけにする', () => {
    expect(chartSourceName({}, { statsName: '家計調査 家計収支編 二人以上の世帯' }, () => undefined)).toBe('家計調査');
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

describe('グループ棒グラフ', () => {
  const monthly = { title: '支出額', unit: '円', series: ['2000年', '2024年'].map((label, i) => ({ label, data: ['1月', '2月', '3月'].map((year, m) => ({ year, value: (i + 1) * (m + 1) })) })) };
  it('月の軸を周期の軸と見分け、年の軸は折れ線のままにする', () => {
    expect(hasCyclicAxis(monthly)).toBe(true);
    expect(hasCyclicAxis({ data: [{ year: 2020, value: 1 }, { year: '2021年度', value: 2 }] })).toBe(false);
  });
  it('全部の棒を描き、値の軸を 0 から始める', () => {
    const chart = groupedBarChartFromArticleData(monthly);
    if ('skip' in chart) throw Error(chart.skip);
    const svg = renderGroupedBarsChart({ ...chart, source: '家計調査' });
    expect(svg).toContain('data-image-template="grouped-bar"');
    expect(svg.match(/<rect data-value="/g)).toHaveLength(6);
    expect(svg).toContain('>0</text>');
  });
  it('欠測は 0 の棒にしない', () => {
    const svg = renderGroupedBarsChart({ title: 'a', meta: 'b', source: 'c', groups: ['1月', '2月'], series: [{ label: 'x', values: [1, null] }] });
    expect(svg.match(/<rect data-value="/g)).toHaveLength(1);
  });
  it('棒が細くなりすぎる組み合わせは止める', () => {
    const series = Array.from({ length: 12 }, (_, i) => ({ label: String(i), values: Array(12).fill(1) }));
    expect(() => renderGroupedBarsChart({ title: 'a', meta: 'b', source: 'c', groups: Array.from({ length: 12 }, (_, i) => `${i + 1}月`), series })).toThrow('細すぎ');
  });
});

describe('配色の使い分け', () => {
  it('正負のある値は 0 を中心に、外れ値に引きずられない区切りにする', () => {
    const values = [-6077, -1604, -959, -493, -64, 33, 58, 193, 350, 523, 932, 1290, 2335, 4207];
    const thresholds = signedThresholds(values)!;
    expect(thresholds).toHaveLength(4);
    expect(thresholds[0]).toBe(-thresholds[3]);
    expect(thresholds[1]).toBe(-thresholds[2]);
    expect(thresholds[3]).toBeLessThan(2000);
  });
  it('同じ大きさばかりで区切れないときは止めずに既定へ戻す', () => {
    expect(signedThresholds([-1, 1, -1, 1])).toBeNull();
  });
  it('外れ値が無ければ連続、あれば段階にする', () => {
    const even = Array.from({ length: 47 }, (_, i) => 28 + i / 6);
    expect(colorPolicyOf(even)).toEqual({ colorSchemeType: 'sequential', classification: { method: 'continuous' } });
    expect(colorPolicyOf([...even.slice(1), 500]).classification).toEqual({ method: 'quantile', classes: 5 });
  });
  it('正負があれば発散にし、外れ値があるときだけ 0 を中心に段階にする', () => {
    const signed = Array.from({ length: 46 }, (_, i) => i - 23);
    expect(colorPolicyOf(signed)).toEqual({ colorSchemeType: 'diverging', classification: { method: 'continuous' } });
    expect(colorPolicyOf([...signed, -6000]).classification.method).toBe('threshold');
  });
  it('書かれた区切りと、指標が持つ基準の中心を守る', () => {
    const values = Array.from({ length: 47 }, (_, i) => 90 + i / 2);
    const written = { colorSchemeType: 'sequential', classification: { method: 'threshold' as const, thresholds: [1, 2] } };
    expect(applyColorPolicy(written, values)).toEqual(written);
    const centred = applyColorPolicy({ colorSchemeType: 'diverging', divergingMidpoint: 'custom', classification: { method: 'equal-interval', classes: 5 } as const }, values);
    expect(centred).toMatchObject({ colorSchemeType: 'diverging', divergingMidpoint: 'custom', classification: { method: 'continuous' } });
  });
  it('行の無い指標は連続になり、基準を持つ指標は外れ値があっても基準のまま段階になる', () => {
    expect(joinColorPolicy({ colorScheme: 'interpolateBlues' }).classification).toEqual({ method: 'continuous' });
    const values = [...Array.from({ length: 46 }, (_, i) => 100 + i / 10), 300];
    const authored = { colorSchemeType: 'diverging', divergingMidpoint: 'custom' };
    const row = colorPolicyRow('a', 'prefecture', authored, '2024', values);
    expect(row).toMatchObject({ metricKey: 'a', grain: 'prefecture', year: '2024', areaCount: 47, classification: { method: 'equal-interval', classes: 5 } });
    expect(joinColorPolicy(authored, row)).toMatchObject({ divergingMidpoint: 'custom', classification: { method: 'equal-interval' } });
  });
  it('一方向の指標でも値に正負があれば発散の配色へ替える', () => {
    const signed = Array.from({ length: 46 }, (_, i) => i - 23);
    expect(applyColorPolicy({ colorScheme: 'interpolateBlues', colorSchemeType: 'sequential' }, signed)).toMatchObject({ colorScheme: 'interpolateRdBu', colorSchemeType: 'diverging', divergingMidpoint: 'zero' });
  });
});
