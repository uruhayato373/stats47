/**
 * 折れ線の X 軸ラベル間引き: 月次・長期年次 (13 点以上) でラベルが重ならないよう
 * 12 個以下になる等間隔 (ceil(n/12) おき) に間引き、最後の点は必ず残す。7〜12 点は従来どおり全点にラベルを付ける。
 */

import { describe, expect, it } from 'vitest';

import { generateLineSvg } from '../line';
import type { StatsSchema } from '../../shared/stats-schema';

const series = (years: string[]): StatsSchema[] =>
  years.map((y, i) => ({
    metricKey: 'value',
    areaCode: '01',
    areaName: '系列1',
    yearCode: y,
    yearName: y,
    value: 100 + i,
    unit: '指数',
  }));

const countTickLabels = (svg: string, labels: string[]) =>
  labels.filter((l) => svg.includes(`>${l}</text>`)).length;

describe('generateLineSvg の X 軸ラベル間引き', () => {
  it('12 点以下はラベルを全点に付ける', () => {
    const years = Array.from({ length: 12 }, (_, i) => `${2013 + i}`);
    const svg = generateLineSvg(series(years), { title: 't', xKey: 'yearCode', seriesKey: 'areaCode' });
    expect(countTickLabels(svg, years)).toBe(12);
  });

  it('25 点 (2000〜2024) は 3 年おき (9 個) に間引き、最初と最後の年は残る', () => {
    const years = Array.from({ length: 25 }, (_, i) => `${2000 + i}`);
    const svg = generateLineSvg(series(years), { title: 't', xKey: 'yearCode', seriesKey: 'areaCode' });
    const n = countTickLabels(svg, years);
    expect(n).toBe(9); // ceil(25/12)=3 年おき: 2000, 2003, …, 2024
    expect(svg).toContain('>2000</text>');
    expect(svg).toContain('>2024</text>');
    // 折れ線の点は間引かない (ラベルだけ)
    expect((svg.match(/<circle/g) || []).length).toBe(25);
  });
});
