import { describe, expect, it } from 'vitest';
import { chartSourceShapeErrors } from '../../../../.claude/scripts/lib/chart-source-schema.mjs';
import { lintImageTypeSvg } from '../../../../.claude/scripts/lib/svg-lint.mjs';
import { areaChartFromArticleData, chartSourceName, groupedBarChartFromArticleData, hasCyclicAxis, lineChartFromArticleData, stackedChartFromArticleData } from '../../../../.claude/scripts/blog/lib/type-chart-input';
import { assertMinimalChartCopy } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import { areasOf, resolveAreaChart, type AreaScope, type AreaValue } from '@/lib/template-area-scope';
import { applyColorPolicy, colorPolicyOf, colorPolicyRow, joinColorPolicy, signedThresholds } from '../../../../packages/types/src/color-policy';
import { renderGroupedBarsChart } from '@/lib/template-grouped-bars';
import { SAMPLE_FRAME, textWidth } from '@/lib/template-sample-frame';
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
  it('年を 2 桁で書いた四半期 (「24年1Q」) は時系列で、折れ線のままにする', () => {
    const quarters = ['24年1Q', '24年2Q', '24年3Q', '24年4Q', '25年1Q'];
    const quarterly = { title: '業況判断DI', unit: 'ポイント', series: ['製造業', '非製造業'].map((label, i) => ({ label, data: quarters.map((year, q) => ({ year, value: i - q })) })) };
    expect(hasCyclicAxis(quarterly)).toBe(false);
    const line = lineChartFromArticleData(quarterly);
    if ('skip' in line) throw Error(line.skip);
    expect(line.series[0].points.map((p) => p.x)).toEqual(quarters);
    // 見出しの下に期間を出す (CONTENT-FOLLOWUP-01: 4 桁の年からしか期間を作らず、sme-di-national の図に期間が無かった)
    expect(line.meta).toBe('2024年1Q–2025年1Q · 単位：ポイント');
    // 年の付かない月と四半期は周期のまま
    expect(hasCyclicAxis({ data: [{ year: '10月', value: 1 }, { year: '11月', value: 2 }] })).toBe(true);
    expect(hasCyclicAxis({ data: [{ year: '1Q', value: 1 }, { year: '2Q', value: 2 }] })).toBe(true);
    // 年数の階級 (「10年未満」) は時点ではなく区分
    expect(hasCyclicAxis({ data: [{ year: '10年未満', value: 1 }, { year: '10年以上', value: 2 }] })).toBe(true);
  });
  it('全部の棒を描き、値の軸を 0 から始める', () => {
    const chart = groupedBarChartFromArticleData(monthly);
    if ('skip' in chart) throw Error(chart.skip);
    const svg = renderGroupedBarsChart({ ...chart, source: '家計調査' });
    expect(svg).toContain('data-image-template="grouped-bar"');
    const heights = [...svg.matchAll(/<rect data-value="(\d+)"[^>]* height="([\d.]+)"/g)].map((m) => Number(m[2]) / Number(m[1]));
    expect(heights).toHaveLength(6);
    for (const perUnit of heights) expect(perUnit).toBeCloseTo(heights[0], 0);
  });
  // chart-image-copy.md: 棒グラフは数値ラベルを直接置き、軸目盛りと目盛線は既定で表示しない
  const valueLabels = (svg: string) => [...svg.matchAll(/<text data-label="value"[^>]*>([^<]*)<\/text>/g)];
  const bars = (groups: number, series: number, valueOf = (g: number, s: number) => 1000 + g * 10 + s) => ({
    title: 'a', meta: 'b', source: 'c', groups: Array.from({ length: groups }, (_, g) => `${g + 1}月`),
    series: Array.from({ length: series }, (_, s) => ({ label: `系列${s}`, values: Array.from({ length: groups }, (_, g) => valueOf(g, s)) })),
  });
  it('棒ごとに値を置き、目盛りと目盛線を出さない', () => {
    const svg = renderGroupedBarsChart(bars(3, 2, (g, s) => [[41.3, 6, -12.8], [-3.4, 4.1, 27.9]][s][g]));
    expect(valueLabels(svg).map((m) => m[1]).sort()).toEqual(['-12.8', '-3.4', '27.9', '4.1', '41.3', '6.0']);
    // The only line left is the bars' baseline at zero.
    expect(svg.match(/<line /g)).toHaveLength(1);
    expect(svg).not.toContain('>40</text>');
    assertMinimalChartCopy(svg);
  });
  it('負の値は棒の下に置き、区分の名前の行より上に収める', () => {
    const svg = renderGroupedBarsChart(bars(2, 1, (g) => [10, -10][g]));
    const [up, down] = valueLabels(svg).map((m) => Number(/ y="([\d.]+)"/.exec(m[0])![1]));
    const baseline = Number(/<line [^>]*y1="([\d.]+)"/.exec(svg)![1]);
    const groupName = Number(/<text x="[\d.]+" y="([\d.]+)" text-anchor="middle" font-size="30"/.exec(svg)![1]);
    expect(up).toBeLessThan(baseline);
    expect(down).toBeGreaterThan(baseline);
    expect(down).toBeLessThan(groupName - 30);
  });
  it('値が棒の幅に収まらないときは縦に置く', () => {
    // 6 区分 × 3 系列の棒 (幅 約 50) は、横の値 (30px で約 87) は入らず、縦なら 30px で入る
    const svg = renderGroupedBarsChart(bars(6, 3));
    expect(valueLabels(svg)).toHaveLength(18);
    expect(valueLabels(svg).every((m) => m[0].includes('rotate(-90'))).toBe(true);
    expect(svg.match(/<line /g)).toHaveLength(1);
  });
  it('1 段では値を置けない細さの図は、区分を 2 段に分けて棒ごとに値を置く', () => {
    const svg = renderGroupedBarsChart(bars(12, 4, (g, s) => (g === 3 ? -1 : 1) * (1001 + g * 10 + s)));
    expect(valueLabels(svg)).toHaveLength(48);
    // 値の文字は型の下限 (30) を下回らない (CHART-AXIS-READABILITY-01)
    expect(valueLabels(svg).every((m) => Number(/font-size="(\d+)"/.exec(m[0])![1]) >= 30)).toBe(true);
    // 段ごとに 0 の線を 1 本だけ引き、目盛りは出さない
    const baselines = [...svg.matchAll(/<line [^>]*y1="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(baselines).toHaveLength(2);
    expect(svg).not.toContain('>1,000</text>');
    expect(svg).not.toMatch(/text-anchor="end" font-size="30" fill="#475569"/);
    // 区分は順に上の段 6 つ・下の段 6 つで、同じ列の区分は同じ位置に並ぶ
    const names = [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)" text-anchor="middle" font-size="30"[^>]*>(\d+)<\/text>/g)].map((m) => ({ x: Number(m[1]), y: Number(m[2]), month: Number(m[3]) }));
    expect(names.map((n) => n.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(names.slice(0, 6).every((n) => n.y === names[0].y) && names.slice(6).every((n) => n.y === names[6].y)).toBe(true);
    expect(names[6].y).toBeGreaterThan(names[0].y);
    expect(names.slice(6).map((n) => n.x)).toEqual(names.slice(0, 6).map((n) => n.x));
    // 2 つの段は同じ縮尺で、上の段の負の値の文字は区分の名前より上、下の段の値の文字は上の段の区分の名前より下に収まる
    const perUnit = [...svg.matchAll(/<rect data-value="(-?\d+)"[^>]* height="([\d.]+)"/g)].map((m) => Number(m[2]) / Math.abs(Number(m[1])));
    for (const h of perUnit) expect(h).toBeCloseTo(perUnit[0], 1);
    const labelBox = (m: RegExpMatchArray) => {
      const y = Number(/ y="([\d.]+)"/.exec(m[0])![1]), width = textWidth(m[1], Number(/font-size="(\d+)"/.exec(m[0])![1]));
      return m[0].includes('text-anchor="start"') ? { top: y - width, bottom: y } : { top: y, bottom: y + width };
    };
    const boxes = valueLabels(svg).map(labelBox);
    const upper = boxes.filter((b) => b.top < names[0].y), lower = boxes.filter((b) => b.top >= names[0].y);
    expect(upper).toHaveLength(24);
    for (const b of upper) expect(b.bottom).toBeLessThanOrEqual(names[0].y - 30);
    for (const b of lower) { expect(b.top).toBeGreaterThanOrEqual(names[0].y); expect(b.bottom).toBeLessThanOrEqual(names[6].y - 30); }
    assertMinimalChartCopy(svg);
  });
  it('2 段に分けても値の文字より細い棒は、値を置かずに 1 段のまま目盛りで読ませる', () => {
    const svg = renderGroupedBarsChart(bars(12, 7));
    expect(valueLabels(svg)).toHaveLength(0);
    expect(svg.match(/<line /g)!.length).toBeGreaterThan(1);
    expect(svg).toContain('>1,000</text>');
  });
  it('凡例が枠の幅に収まらないときは折り返し、棒をその下から描く', () => {
    const labels = ['幼児教育費用', '私立高校', '私立大学', '補習教育', '教育計'];
    const svg = renderGroupedBarsChart({ title: 'a', meta: 'b', source: 'c', groups: ['第Ⅰ', '第Ⅱ'], series: labels.map((label, i) => ({ label, values: [i + 1, -i - 1] })) });
    // 出典の行も 30px なので、凡例の文字だけを数える
    const legend = [...svg.matchAll(/<text x="([\d.]+)" y="([\d.]+)" font-size="30"[^>]*>([^<]+)<\/text>/g)].filter((m) => !m[3].startsWith('出典')).map((m) => ({ right: Number(m[1]) + textWidth(m[3], 30), y: Number(m[2]), label: m[3] }));
    expect(legend.map((item) => item.label)).toEqual(labels);
    for (const item of legend) expect(item.right, item.label).toBeLessThanOrEqual(SAMPLE_FRAME.right);
    expect(new Set(legend.map((item) => item.y)).size).toBe(2);
    const lastRow = Math.max(...legend.map((item) => item.y));
    const tops = [...svg.matchAll(/<text data-label="value"[^>]* y="([\d.]+)"/g)].map((m) => Number(m[1]));
    expect(Math.min(...tops)).toBeGreaterThan(lastRow + 30);
    // 1 行に収まる凡例は折り返さない
    const short = renderGroupedBarsChart(bars(3, 2));
    expect(new Set([...short.matchAll(/<text x="[\d.]+" y="([\d.]+)" font-size="30"[^>]*>(?!出典)/g)].map((m) => m[1])).size).toBe(1);
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
