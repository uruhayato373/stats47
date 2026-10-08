/**
 * レーダーチャートの正規キャンバスと公開ゲートの配線、壊れた入力を描かないことを固定する。
 */

import { describe, expect, it } from 'vitest';

// @ts-expect-error — .claude 配下の決定的ゲート (型定義を持たない .mjs)
import { lintSvgContent, lintSvgSize } from '../../../../../.claude/scripts/lib/svg-lint.mjs';
import { generateRadarSvg, type RadarSeries } from '../radar';

const axes = [
  { key: 'population', label: '人口規模' },
  { key: 'income', label: '県民所得' },
  { key: 'crime', label: '治安' },
];
const tokyo: RadarSeries = { name: '東京都', palette: 'blue', values: { population: 1, income: 1, crime: 0.42 } };
const kyoto: RadarSeries = { name: '京都府', palette: 'red', values: { population: 0.15, income: 0.22, crime: 0.67 } };
const median: RadarSeries = { name: '47都道府県の中央値', reference: true, values: { population: 0.07, income: 0.2, crime: 0.69 } };

describe('generateRadarSvg', () => {
  it('720×720 の正規キャンバスで描き、公開前のサイズ・内容検査を通る', () => {
    const svg = generateRadarSvg(axes, [tokyo, median], { title: '東京都の3軸' });
    expect(svg).toContain('width="720" height="720" viewBox="0 0 720 720"');
    expect(lintSvgSize('x-radar.svg', svg).errors).toEqual([]);
    expect(lintSvgContent(svg, 'x-radar.svg').errors).toEqual([]);
  });

  it('非正規の幅は radar としてサイズ検査に止められる (検査の感度)', () => {
    const svg = generateRadarSvg(axes, [tokyo], { title: 't' }).replace(/720/g, '600');
    expect(lintSvgSize('x-radar.svg', svg).errors.length).toBeGreaterThan(0);
  });

  it('系列ごとに多角形を 1 つ描き、参照系列は塗りなしの破線にする', () => {
    const svg = generateRadarSvg(axes, [tokyo, kyoto, median], { title: '比較' });
    expect(svg.match(/<polygon /g)).toHaveLength(3);
    expect(svg).toMatch(/<polygon [^>]*fill="none"[^>]*stroke-dasharray="6 4"/);
  });

  it('頂点の値は単一系列のときだけ書く (重ね描きでは数字が被る)', () => {
    const single = generateRadarSvg(axes, [tokyo, median], { title: 's' });
    const overlay = generateRadarSvg(axes, [tokyo, kyoto], { title: 'o' });
    expect(single).toContain('>0.42</text>');
    expect(overlay).not.toContain('>0.42</text>');
  });

  it('値が欠けている・0〜1 の外・軸が 3 未満の入力は描かずに例外にする', () => {
    const missing: RadarSeries = { name: '欠け', values: { population: 1, income: 1 } };
    expect(() => generateRadarSvg(axes, [missing], { title: 'x' })).toThrow(/crime/);
    const over: RadarSeries = { name: '超過', values: { population: 1.2, income: 1, crime: 0 } };
    expect(() => generateRadarSvg(axes, [over], { title: 'x' })).toThrow(/population/);
    expect(() => generateRadarSvg(axes.slice(0, 2), [tokyo], { title: 'x' })).toThrow(/3 つ以上/);
  });
});
