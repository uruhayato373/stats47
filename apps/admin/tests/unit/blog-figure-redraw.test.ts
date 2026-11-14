import { describe, expect, it } from 'vitest';
import { itemBarChartFromArticleData, rankingChartFromArticleData } from '../../../../.claude/scripts/blog/lib/type-chart-input';
import { PREF_NAMES } from '../../../../.claude/scripts/lib/prefectures.cjs';
import { TEMPLATE_MIN_FONT_SIZE as LINT_MIN_FONT_SIZE, findImageTypeCopyDefects, findTemplateFontFloorDefects } from '../../../../.claude/scripts/lib/svg-lint.mjs';
import { TEMPLATE_MIN_FONT_SIZE } from '../../../remotion/src/features/data-cards/chart-theme';
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
  // ブログの本文はスマホで約 360px 幅なので、1080 の型は 1/3 に縮む。型の文字は 30 以上で画面上 10px 以上 (CHART-AXIS-READABILITY-01)
  it('型の文字は下限 30 を下回らない', () => {
    expect(LINT_MIN_FONT_SIZE).toBe(TEMPLATE_MIN_FONT_SIZE);
    const chart = ranking(article({ title: '地方債現在高の割合（対歳出決算総額）', source: '地方財政状況調査', note: '都道府県財政' }));
    for (const render of RENDERERS) expect(findTemplateFontFloorDefects(render(chart)), render.name).toEqual([]);
  });

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

  it('県庁所在市の値のタイル地図は、見出しもタイルも凡例も市で書く', () => {
    const kakei = { key: 'x', subtitle: '都道府県庁所在市の二人以上世帯の年間支出額', source: { kind: 'kakei-chousa', displayName: '家計調査' } };
    // 1 県だけ離れた値は配色を段階にし、凡例が段ごとの数を持つ
    const data = names.map((name, i) => ({ areaName: name, value: i ? 100 - i : 500 }));
    const svg = renderTileMapChart(ranking(article({ title: '大人用サンダル消費支出額', unit: '円', data }), kakei));
    expect(svg).toContain('>上位3市</text>');
    expect(svg).not.toContain('上位3県');
    // 2×2 の北海道は市の名前のまま。1 列のタイルは 30px で 2 文字までなので、市の名前の頭 2 文字 (東京区部→東京)
    expect(svg).toContain('>札幌市</text>');
    expect(svg).toMatch(/data-area="13000"[^>]*>.*?>東京<\/text>/);
    expect(svg).toMatch(/data-area="23000"[^>]*>.*?>名古<\/text>/);
    expect(svg).not.toMatch(/>(北海道|愛知)<\/text>/);
    expect(svg).toMatch(/>\d+市<\/text>/);
    expect(svg).not.toMatch(/>\d+県<\/text>/);
    // 範囲は 1 回だけ書く (定義の行が県庁所在市と書いていれば、単位の行に重ねない)
    expect(svg.match(/県庁所在市/g)).toHaveLength(1);
    // 副題が範囲を書かない家計調査の指標も、条件の行が範囲を持つので市で書く
    expect(renderTileMapChart(ranking(article(), { ...kakei, subtitle: '二人以上の世帯' }))).toContain('>上位3市</text>');
    // 県の値の指標は県のまま
    const pref = renderTileMapChart(ranking(article(), { key: 'x', source: { displayName: '地方財政状況調査' } }));
    expect(pref).toContain('>上位3県</text>');
    expect(pref).toContain('>北海道</text>');
  });

  // CONTENT-FOLLOWUP-01: 家計調査の記事で、地図は市名なのに棒は県名で書いていた
  it('県庁所在市の値の棒グラフは、見出しも行も市で書き、地図と名前をそろえる', () => {
    const kakei = { key: 'x', subtitle: '二人以上の世帯', source: { kind: 'kakei-chousa', displayName: '家計調査' } };
    const chart = ranking(article({ title: '大人用サンダル消費支出額', unit: '円' }), kakei);
    const svg = renderRankingBarsChart(chart);
    expect(svg).toContain('>上位5市</text>');
    expect(svg).toContain('>下位5市</text>');
    expect(svg).toContain('>札幌市</text>');
    expect(svg).toContain('>那覇市</text>');
    expect(svg).not.toMatch(/>(北海道|沖縄県|上位5県|下位5県)<\/text>/);
    // 棒の行の名前は、同じデータのタイル地図の上位 3 の名前と同じ
    const map = renderTileMapChart(chart);
    for (const city of ['札幌市', '青森市', '盛岡市']) expect(map).toContain(`>${city}</text>`);
    // 県の値の指標は県のまま
    const pref = renderRankingBarsChart(ranking(article(), { key: 'x', source: { displayName: '地方財政状況調査' } }));
    expect(pref).toContain('>上位5県</text>');
    expect(pref).toContain('>北海道</text>');
  });

  // CONTENT-FOLLOWUP-01: 5 文字の「さいたま市」はタイルの幅に合わせて約 11px まで縮み、ほかの市より読みにくかった
  it('県庁所在市のタイル地図で、長い市名もほかの市名と同じくらいの字の大きさで書く', () => {
    const kakei = { key: 'x', subtitle: '二人以上の世帯', source: { kind: 'kakei-chousa', displayName: '家計調査' } };
    const svg = renderTileMapChart(ranking(article({ title: '大人用サンダル消費支出額', unit: '円' }), kakei));
    const nameSize = (code: string) => {
      const tile = new RegExp(`data-area="${code}"[^>]*>.*?<text[^>]*font-size="([\\d.]+)"`).exec(svg);
      if (!tile) throw Error(`タイル ${code} が無い`);
      return Number(tile[1]);
    };
    // 4 文字の市名 (宇都宮市・名古屋市) の大きさを下回らない
    const fourChars = Math.min(nameSize('09000'), nameSize('23000'));
    expect(nameSize('11000')).toBeGreaterThanOrEqual(fourChars);
  });
});
