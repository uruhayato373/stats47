import { describe, expect, it } from 'vitest';
import { itemBarChartFromArticleData, rankingChartFromArticleData } from '../../../../.claude/scripts/blog/lib/type-chart-input';
import { PREF_NAMES } from '../../../../.claude/scripts/lib/prefectures.cjs';
import { findImageTypeCopyDefects } from '../../../../.claude/scripts/lib/svg-lint.mjs';
import { renderDistributionMapChart } from '@/lib/template-distribution-map';
import { renderRankingBarsChart } from '@/lib/template-ranking-bars';
import { renderTileMapChart } from '@/lib/template-ranking-tile-map';

// 2026-11-03 の全記事の描き直しで出た型の不具合 (出典欄が空・題の右端が切れる・年度が「年」) を型の側で止める。
const names = PREF_NAMES as string[];
const opts = { prefCodeOf: (n: string) => String(names.indexOf(n) + 1).padStart(2, '0'), prefNameOf: (c: string) => names[Number(c) - 1] };
const article = (over: Record<string, unknown> = {}) => ({
  title: '財政力指数', subtitle: '2022年', year: '2022', unit: '%',
  data: names.map((name, i) => ({ areaName: name, value: 100 - i })), ...over,
});
const ranking = (data: Record<string, unknown>, metric?: Record<string, unknown>) => {
  const chart = rankingChartFromArticleData(data, { ...opts, metric });
  if ('skip' in chart) throw Error(chart.skip);
  return chart;
};
const RENDERERS = [renderRankingBarsChart, renderTileMapChart, renderDistributionMapChart] as const;

describe('ブログの図の描き直しの型', () => {
  it('出典名がデータに無い図は指標の定義の出典名を書く', () => {
    const chart = ranking(article(), { key: 'x', source: { displayName: '地方財政状況調査' } });
    expect(chart.source).toBe('地方財政状況調査');
    for (const render of RENDERERS) expect(render(chart)).toContain('>出典：地方財政状況調査</text>');
    // データが書いた出典名はそのまま使う
    expect(ranking(article({ source: '家計調査' }), { key: 'x', source: { displayName: '地方財政状況調査' } }).source).toBe('家計調査');
    const items = itemBarChartFromArticleData({ ...article(), data: article().data.slice(0, 5) }, { metric: { key: 'x', source: { displayName: '地方財政状況調査' } } });
    expect(items).toMatchObject({ source: '地方財政状況調査' });
  });

  it('出典名がどこにも無い図に「出典：」だけの行を出さない', () => {
    const chart = ranking(article());
    expect(chart.source).toBe('');
    for (const render of RENDERERS) {
      const svg = render(chart);
      expect(svg).not.toMatch(/>出典[：:]\s*<\/text>/);
      expect(findImageTypeCopyDefects(svg)).toEqual([]);
    }
  });

  it('長い題は字を小さくして枠の右端までに収める', () => {
    for (const title of ['外国人延べ宿泊者数 都道府県ランキング', 'コンビニエンスストア数ランキング', '従業者1人当たり製造品出荷額等']) {
      const chart = ranking(article({ title, source: '家計調査' }));
      for (const render of RENDERERS) expect(findImageTypeCopyDefects(render(chart)), `${render.name} ${title}`).toEqual([]);
    }
  });

  it('題の末尾の年を副題の行へ回し、棒の題に「ランキング」を重ねない', () => {
    const chart = ranking(article({ title: '教養娯楽費割合 都道府県ランキング（2024年）', subtitle: '', year: '' }));
    expect(chart).toMatchObject({ title: '教養娯楽費割合 都道府県', yearLabel: '2024年' });
    const svg = renderRankingBarsChart(chart);
    expect(svg).toContain('>教養娯楽費割合 都道府県ランキング</text>');
    expect(svg).not.toContain('ランキング（2024年）ランキング');
    // データの年があれば、題の年より優先する
    expect(ranking(article({ title: '教養娯楽費割合ランキング（2023年）' }))).toMatchObject({ title: '教養娯楽費割合', yearLabel: '2022年' });
  });

  it('副題の年は指標の定義の yearFormat で書く (年度の指標は「年度」)', () => {
    const fiscal = ranking(article(), { key: 'x', yearFormat: 'fiscal' });
    expect(fiscal.yearLabel).toBe('2022年度');
    expect(renderTileMapChart(fiscal)).toContain('>2022年度 · 単位：%</text>');
    expect(renderRankingBarsChart(fiscal)).toContain('>2022年度 · 単位：%');
    expect(ranking(article({ subtitle: '' }), { key: 'x', yearFormat: 'fiscal' }).yearLabel).toBe('2022年度');
    // 暦年の指標に残った「年度」は「年」へ戻す
    expect(ranking(article({ subtitle: '2022年度' }), { key: 'x', yearFormat: 'calendar' }).yearLabel).toBe('2022年');
    // 指標が分からない図と、年でない副題は書かれたまま
    expect(ranking(article({ subtitle: '2022年度' })).yearLabel).toBe('2022年度');
    expect(ranking(article({ subtitle: '二人以上の世帯', year: '' }), { key: 'x', yearFormat: 'fiscal' }).yearLabel).toBe('二人以上の世帯');
    const items = itemBarChartFromArticleData({ ...article(), data: article().data.slice(0, 5) }, { metric: { key: 'x', yearFormat: 'fiscal' } });
    expect(items).toMatchObject({ yearLabel: '2022年度' });
  });
});
