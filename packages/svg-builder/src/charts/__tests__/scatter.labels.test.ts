/**
 * 散布図の県名ラベル (labelNames) を固定する (BLOG-SCATTER-LABELS-01)。
 * 本文が名指しする県だけに名前が出ること、指定が無い図の出力が変わらないこと、
 * ラベルを付けても散布図の公開ゲートを通ることを確かめる。
 */

import { describe, expect, it } from 'vitest';

// @ts-expect-error — .claude 配下の決定的ゲート (型定義を持たない .mjs)
import { lintScatterQuality } from '../../../../../.claude/scripts/lib/svg-lint.mjs';
import { generateScatterSvg, type ScatterOptions } from '../scatter';

const points = [
  { name: '北海道', code: '01', x: 10, y: 8 },
  { name: '三重県', code: '24', x: 12, y: 2 },
  { name: '京都府', code: '26', x: 18, y: 9 },
  { name: '東京都', code: '13', x: 15, y: 3 },
  { name: '沖縄県', code: '47', x: 20, y: -1 },
];

const base: ScatterOptions = {
  title: 'テスト散布図',
  xLabel: 'X（%）',
  yLabel: 'Y（%）',
};

/** 県名ラベルとして描かれた <text> の中身だけを取り出す (ツールチップの <title> は含めない) */
function labelTexts(svg: string): string[] {
  const block = svg.split('<!-- 県名ラベル -->')[1] ?? '';
  return [...block.matchAll(/<text\b[^>]*>([^<]+)<\/text>/g)].map((m) => m[1]);
}

describe('generateScatterSvg labelNames', () => {
  it('指定した県だけに名前が出る', () => {
    const svg = generateScatterSvg(points, {
      ...base,
      labelNames: ['京都府', '三重県'],
    });
    expect(labelTexts(svg).sort()).toEqual(['三重県', '京都府'].sort());
    // 指定していない県は <title> (ツールチップ) 以外に現れない
    for (const name of ['北海道', '東京都', '沖縄県']) {
      expect(svg.split(name).length - 1).toBe(1);
    }
  });

  it('指定が無い図は、空配列・未知の県名でも出力が変わらない', () => {
    const plain = generateScatterSvg(points, base);
    expect(plain).not.toContain('<!-- 県名ラベル -->');
    expect(generateScatterSvg(points, { ...base, labelNames: [] })).toBe(plain);
    expect(
      generateScatterSvg(points, { ...base, labelNames: ['存在しない県'] })
    ).toBe(plain);
  });

  it('ラベルを付けても点・軸・回帰線は指定なしと同じで、ラベル部分だけが追加される', () => {
    const plain = generateScatterSvg(points, base);
    const labeled = generateScatterSvg(points, {
      ...base,
      labelNames: ['京都府'],
    });
    const [head] = labeled.split('\n  <!-- 県名ラベル -->');
    expect(`${head}\n</svg>`).toBe(plain);
  });

  it('ラベル付きでも散布図の公開ゲート (単色・正方形) を通る', () => {
    const svg = generateScatterSvg(points, {
      ...base,
      labelNames: ['京都府', '三重県'],
    });
    const result = lintScatterQuality('sample-scatter.svg', svg) as {
      errors: string[];
      warnings: string[];
    };
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('近接する 2 点のラベルは重ならない位置に置かれる', () => {
    const close = [
      { name: '大阪府', code: '27', x: 10, y: 10 },
      { name: '兵庫県', code: '28', x: 10.05, y: 10 },
      { name: '北海道', code: '01', x: 0, y: 0 },
      { name: '沖縄県', code: '47', x: 20, y: 20 },
    ];
    const svg = generateScatterSvg(close, {
      ...base,
      labelNames: ['大阪府', '兵庫県'],
    });
    const boxes = [
      ...(svg.split('<!-- 県名ラベル -->')[1] ?? '').matchAll(
        /<text x="([\d.]+)" y="([\d.]+)" text-anchor="(\w+)"[^>]*>([^<]+)</g
      ),
    ].map((m) => {
      // 描画の外接矩形 (font-size 10 の全角 1 文字 = 10px、ベースライン基準)
      const x = Number(m[1]);
      const y = Number(m[2]);
      const w = m[4].length * 10;
      const x0 = m[3] === 'start' ? x : m[3] === 'end' ? x - w : x - w / 2;
      return { x0, x1: x0 + w, y0: y - 10, y1: y };
    });
    expect(boxes).toHaveLength(2);
    const [a, b] = boxes;
    const overlap = a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;
    expect(overlap).toBe(false);
  });
});
