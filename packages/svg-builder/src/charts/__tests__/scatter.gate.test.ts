/**
 * 散布図の正方形・単色デザインと公開ゲートの配線を固定する。
 */

import { describe, expect, it } from 'vitest';

// @ts-expect-error — .claude 配下の決定的ゲート (型定義を持たない .mjs)
import { lintScatterQuality } from '../../../../../.claude/scripts/lib/svg-lint.mjs';
import { generateScatterSvg } from '../scatter';

const points = [
  { name: '北海道', code: '01', x: 10, y: 8 },
  { name: '東京都', code: '13', x: 15, y: 3 },
  { name: '沖縄県', code: '47', x: 20, y: -1 },
];

const render = () =>
  generateScatterSvg(points, {
    title: '空き家率 × 商業地価変動率',
    xLabel: '空き家率（%）',
    yLabel: '商業地価変動率（%）',
  });

describe('generateScatterSvg の現行デザイン', () => {
  it('キャンバスと実プロット領域がともに正方形', () => {
    const svg = render();
    expect(svg).toContain('width="720" height="720" viewBox="0 0 720 720"');
    expect(svg).toContain(
      'width="600" height="600" class="svg-plot svg-plot-border"'
    );
  });

  it('全点が単一のニュートラル色で、地域凡例を持たない', () => {
    const svg = render();
    expect(svg.match(/fill="#64748b"/g)).toHaveLength(points.length);
    expect(svg.match(/stroke="#475569"/g)).toHaveLength(points.length);
    expect(svg).not.toContain('<!-- 凡例 -->');
    expect(svg).not.toContain('北海道・東北');
    expect(svg).not.toContain('#42a5f5');
  });

  it('回帰直線は残し、公開ゲートを通る', () => {
    const svg = render();
    expect(svg).toContain('<!-- 回帰直線 -->');
    const result = lintScatterQuality('sample-scatter.svg', svg) as {
      errors: string[];
      warnings: string[];
    };
    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });
});
