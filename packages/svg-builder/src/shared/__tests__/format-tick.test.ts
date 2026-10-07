/**
 * formatTick の丸めを本文・棒グラフのラベル (formatValueLabel) と揃えることを固定する。
 * toFixed の 2 進丸めで 0.845 が "0.84" になり、散布図のホバー表示だけが本文の 0.85 と食い違った。
 */

import { describe, expect, it } from 'vitest';

import { generateScatterSvg } from '../../charts/scatter';
import { formatTick, formatValueLabel } from '../axis';

describe('formatTick', () => {
  it('10 進表記の 5 を切り上げ、formatValueLabel と同じ値になる', () => {
    expect(formatTick(0.845)).toBe('0.85');
    expect(formatTick(0.745)).toBe('0.75');
    expect(formatTick(1.005)).toBe('1.01');
    expect(formatTick(0.845)).toBe(formatValueLabel(0.845, 2));
  });

  it('末尾のゼロと桁区切りを付けない (目盛りの表記は変えない)', () => {
    expect(formatTick(2.5)).toBe('2.5');
    expect(formatTick(1234.5678)).toBe('1234.57');
    expect(formatTick(12)).toBe('12');
    expect(formatTick(-0.845)).toBe('-0.85');
  });

  it('丸めて 0 になる負の値を "-0" にしない', () => {
    expect(formatTick(-0.001)).toBe('0');
  });

  it('散布図のホバー表示が本文と同じ丸めになる', () => {
    const svg = generateScatterSvg(
      [
        { name: '神奈川県', code: '14', x: 64, y: 0.845 },
        { name: '千葉県', code: '12', x: 60.5, y: 0.745 },
        { name: '東京都', code: '13', x: 80, y: 1.1 },
      ],
      { title: '自主財源の割合 × 財政力指数', xLabel: '自主財源の割合（%）', yLabel: '財政力指数' },
    );
    expect(svg).toContain('<title>神奈川県：X=64 Y=0.85</title>');
    expect(svg).toContain('<title>千葉県：X=60.5 Y=0.75</title>');
  });
});
