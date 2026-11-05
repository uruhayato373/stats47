/* eslint-disable no-console -- This local command reports what it wrote. */
/**
 * 型の最終確認の画面 (/ops/image-templates/review) が読む見本を作る。
 *
 * 公開 R2 の値と公開中の図を読むだけで、R2 へは書かない。出力は .local/template-review/ (git に置かない)。
 * 画面は型だけを並べる。状態はオーナーの確認用で、型が決まったら image-templates.json の見本へ移してこのページごと消す
 * (CHART-TYPE-ROLLOUT-01)。
 *
 * Usage: npx tsx apps/admin/scripts/build-template-review.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { prefectureChordNodes, regionChordNodes, renderChordChart, type MigrationPair } from '../lib/template-chord';
import { renderStackedChart } from '../lib/template-composition-stacked';
import { renderDistributionMapChart } from '../lib/template-distribution-map';
import { renderGroupedBarsChart } from '../lib/template-grouped-bars';
import { renderAreaMapChart } from '../lib/template-area-map';
import { resolveAreaChart, type AreaScope } from '../lib/template-area-scope';
import { renderCompositionHeatmap, renderCompositionPie } from '../lib/template-minor-charts';
import { rankingRows, renderAreaBarsChart, renderRankingBarsChart } from '../lib/template-ranking-bars';
import { rankingInputFromStats, sampleRankingChart } from '../lib/template-ranking-data';
import { renderRankingTable } from '../lib/template-ranking-table';
import { renderTileMapChart } from '../lib/template-ranking-tile-map';
import { renderRegionalBoxplotChart } from '../lib/template-regional-boxplot';
import { CHANGE_SAMPLE_SOURCES, renderTileChangeSample } from '../lib/template-tile-change';
import { renderLineChart } from '../lib/template-trend-line';
import { CHART_THEMES } from '../../remotion/src/features/data-cards/chart-theme';
import { chartSourceName, groupedBarChartFromArticleData, lineChartFromArticleData, rankingChartFromArticleData, stackedChartFromArticleData } from '../../../.claude/scripts/blog/lib/type-chart-input';
import { PREF_NAMES } from '../../../.claude/scripts/lib/prefectures.cjs';
import { assertMinimalChartCopy } from '../../../.claude/scripts/media/lib/image-copy.mjs';
import { R2_PUBLIC_BASE_URL } from '../../../.claude/scripts/lib/site-config.cjs';
import { getMetricConfig } from '../../../packages/data-configs/src/registry';
import { fetchMunicipalityTopologyForWardMode } from '../../../packages/gis/src/mlit/fetch-ward-mode-topology';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import type { Topology } from 'topojson-specification';

const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.join(ROOT, '.local/template-review');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;

type Status = 'done' | 'review' | 'unused';
type Sample = { label: string; light?: string; dark?: string };
type Row = { id: string; title: string; status: Status; summary: string; samples: Sample[] };

const text = async (key: string) => {
  const res = await fetch(`${R2}/${key}`);
  const body = res.ok ? await res.text() : null;
  return body && !/^<!doctype/i.test(body) ? body : null;
};
const json = async (key: string) => { const t = await text(key); return t ? JSON.parse(t) : {}; };
const blog = (slug: string, base: string, ext = 'json') => `app/blog/${slug}/data/${base}.${ext}`;
const metricSource = (key: string) => {
  const source = getMetricConfig(key)?.source;
  return source && 'displayName' in source ? source.displayName : undefined;
};

function save(name: string, svg: string | null) {
  if (!svg) return undefined;
  fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
  return `${name}.svg`;
}
const both = (id: string, label: string, render: (theme: typeof CHART_THEMES.light) => string): Sample => {
  const [light, dark] = [render(CHART_THEMES.light), render(CHART_THEMES.dark)];
  assertMinimalChartCopy(light);
  return { label, light: save(`${id}-light`, light), dark: save(`${id}-dark`, dark) };
};
const published = async (id: string, label: string, slug: string, base: string): Promise<Sample> => ({
  label, light: save(`${id}-light`, await text(blog(slug, base, 'svg'))), dark: save(`${id}-dark`, await text(blog(slug, `${base}-dark`, 'svg'))),
});

async function lineSample(id: string, label: string, slug: string, base: string) {
  const data = await json(blog(slug, base));
  const chart = lineChartFromArticleData(data);
  if ('skip' in chart) throw Error(`${base}: ${chart.skip}`);
  chart.source = chartSourceName(data, await json(blog(slug, base, 'source.json')), metricSource) || chart.source;
  return both(id, label, (theme) => renderLineChart(chart, theme));
}
async function groupedSample(id: string, label: string, slug: string, base: string) {
  const data = await json(blog(slug, base));
  const chart = groupedBarChartFromArticleData(data);
  if ('skip' in chart) throw Error(`${base}: ${chart.skip}`);
  chart.source = chartSourceName(data, await json(blog(slug, base, 'source.json')), metricSource) || chart.source;
  return both(id, label, (theme) => renderGroupedBarsChart(chart, theme));
}
async function stackedSample(id: string, label: string, slug: string, base: string) {
  const data = await json(blog(slug, base));
  const chart = stackedChartFromArticleData(data);
  if ('skip' in chart) throw Error(`${base}: ${chart.skip}`);
  chart.source = chartSourceName(data, await json(blog(slug, base, 'source.json')), metricSource) || chart.source;
  return both(id, label, (theme) => renderStackedChart(chart, theme));
}
const AREA_METRIC = 'total-population';
const AREA_YEAR = '2020';
async function areaInputs() {
  const metric = getMetricConfig(AREA_METRIC)!;
  const rows = parseStatsValuesPayload(await json(`app/stats/${AREA_METRIC}/cities.json`)).rows.filter((row) => row.yearCode === AREA_YEAR);
  const chartOf = (scope: AreaScope) => resolveAreaChart({
    title: `${metric.title}`, yearLabel: `${AREA_YEAR}年`, unit: rows[0].unit ?? metric.unit, source: metricSource(AREA_METRIC) ?? '',
    presentation: metric.visualization!, scope, values: rows.map((row) => ({ areaCode: row.areaCode, value: row.value })),
  });
  const topologyOf = async (wardMode: 'merged' | 'split') => await fetchMunicipalityTopologyForWardMode('14', wardMode) as unknown as Topology;
  return { chartOf, merged: await topologyOf('merged'), split: await topologyOf('split') };
}
async function baseTileSample(id: string, label: string, slug: string, base: string) {
  const names = PREF_NAMES as string[];
  const chart = rankingChartFromArticleData(await json(blog(slug, base)), {
    allowBaseArea: true, prefCodeOf: (name) => String(names.indexOf(name) + 1).padStart(2, '0'), prefNameOf: (code) => names[Number(code) - 1],
  });
  if ('skip' in chart) throw Error(`${base}: ${chart.skip}`);
  return both(id, label, (theme) => renderTileMapChart(chart, theme));
}
const MIGRATION_YEAR = 2025;
const MIGRATION_SOURCE = '住民基本台帳人口移動報告';

async function main() {
  for (const file of fs.existsSync(OUT) ? fs.readdirSync(OUT) : []) fs.rmSync(path.join(OUT, file));
  fs.mkdirSync(OUT, { recursive: true });
  const input = rankingInputFromStats(await json('app/stats/maximum-temperature/values.json'));
  const ranking = sampleRankingChart({ data: rankingRows(input) });
  const liquor = await json(blog('alcohol-prefecture-map', 'liquor-type-breakdown'));
  const change = await renderTileChangeSample({
    item: await json(CHANGE_SAMPLE_SOURCES.item.key), values: await json(CHANGE_SAMPLE_SOURCES.values.key),
  });
  const { chartOf, merged, split } = await areaInputs();
  const inPrefecture = (wardMode: 'merged' | 'split'): AreaScope => ({ level: 'municipality', wardMode, within: { kind: 'prefecture', prefCode: '14' } });
  const pairs = (await json(`app/stats/population-migration-inter-prefecture/migration-flow-${MIGRATION_YEAR}.json`)).rows as MigrationPair[];
  const chordHead = { meta: `${MIGRATION_YEAR}年 · 単位：人`, source: MIGRATION_SOURCE };
  const rows: Row[] = [
    {
      id: 'bar', title: '棒グラフ', status: 'review', summary: '順位と値を読む型は上位と下位のカード 1 つ。比べる地域の集合で順位が変わる。全体を見せる図は地図を使う。',
      samples: [
        both('bar', '上位 5・下位 5 のカード', (theme) => renderRankingBarsChart(ranking, theme)),
        both('bar-merged', '県の中・政令指定都市を統合', (theme) => renderAreaBarsChart(chartOf(inPrefecture('merged')), theme)),
        both('bar-split', '県の中・政令指定都市を分割', (theme) => renderAreaBarsChart(chartOf(inPrefecture('split')), theme)),
      ],
    },
    {
      id: 'tile', title: 'タイル地図', status: 'review', summary: '全県の値を 1 枚で読む型。基準の県がある形が確認待ち。',
      samples: [
        both('tile', '値の塗り', (theme) => renderTileMapChart(ranking, theme)),
        await baseTileSample('tile-base', '基準の県あり・正負の値', 'osaka-migration-flow', 'osaka-migration-flow-migration-map'),
        { label: '2 時点の増減', light: save('tile-change-light', change) },
      ],
    },
    {
      id: 'choropleth', title: '地図 (実際の形)', status: 'review', summary: '地理のまとまりを見せる型。都道府県版と市区町村版がある。',
      samples: [
        both('map', '都道府県版', (theme) => renderDistributionMapChart(ranking, theme)),
        both('map-merged', '市区町村・政令指定都市を統合', (theme) => renderAreaMapChart(chartOf(inPrefecture('merged')), merged, theme)),
        both('map-split', '市区町村・政令指定都市を分割', (theme) => renderAreaMapChart(chartOf(inPrefecture('split')), split, theme)),
      ],
    },
    {
      id: 'scatter', title: '散布図', status: 'done', summary: '2 つの指標の関係を見せる型。',
      samples: [await published('scatter', '全 47 点', 'black-tea-income-gap', 'black-tea-income-gap-income-scatter')],
    },
    {
      id: 'line', title: '折れ線グラフ', status: 'review', summary: '推移を見せる型。1 本は始点と終点の値、複数は凡例と線の端の値。',
      samples: [
        await lineSample('line-one', '1 本', 'energy-infrastructure-gas-electricity', 'gasoline-trend'),
        await lineSample('line-three', '3 本・途中から始まる線', 'beer-peak-month-july-to-december', 'alcohol-expenditure-timeseries'),
        await lineSample('line-five', '5 本・値が近い', 'automotive-industry-transformation-map', 'manufacturing-shipment-timeseries'),
      ],
    },
    {
      id: 'stacked', title: '積み上げ棒グラフ', status: 'review', summary: '内訳を見せる型。100% と実数の両方を描く。',
      samples: [
        await stackedSample('stacked-share', '100%・棒が少ない', 'alcohol-prefecture-map', 'liquor-type-breakdown'),
        await stackedSample('stacked-many', '100%・棒が多い', 'cc-estat-13-agri-sankey', 'cc-estat-13-agri-sankey-region-category-stacked'),
        await stackedSample('stacked-value', '実数', 'inbound-by-nationality-regional-preference', 'nationality-composition-top15'),
      ],
    },
    {
      id: 'grouped', title: 'グループ棒グラフ', status: 'review', summary: '区分ごとに棒を並べて比べる型。月のように周期のある軸は折れ線でなくこの型を使う。',
      samples: [await groupedSample('grouped-month', '12 か月 × 3 年', 'beer-peak-month-july-to-december', 'beer-months-by-year-timeseries')],
    },
    {
      id: 'chord', title: 'コード図', status: 'review', summary: '「どこからどこへ」の全組み合わせを見せる型。',
      samples: [
        both('chord-region', '地方別', (theme) => renderChordChart({ title: '地方のあいだの人の移動', ...chordHead, ...regionChordNodes(pairs) }, theme)),
        both('chord-pref', '都道府県別', (theme) => renderChordChart({ title: '都道府県のあいだの人の移動', ...chordHead, ...prefectureChordNodes(pairs, PREF_NAMES as string[]) }, theme)),
      ],
    },
    {
      id: 'boxplot', title: '箱ひげ図', status: 'done', summary: '地方ごとの分布を見せる型。',
      samples: [both('boxplot', '地方別', (theme) => renderRegionalBoxplotChart(ranking, theme))],
    },
    {
      id: 'table', title: 'テーブル', status: 'unused', summary: '行と列で読む型。今はどの媒体も使っておらず、暗い版は無い。',
      samples: [{ label: '上位 10 県', light: save('table-light', renderRankingTable(input)) }],
    },
    {
      id: 'pie', title: '円グラフ', status: 'unused', summary: '構成比を見せる型。今はどの媒体も使っておらず、暗い版は無い。',
      samples: [{ label: '構成比', light: save('pie-light', renderCompositionPie(liquor)) }],
    },
    {
      id: 'heatmap', title: 'ヒートマップ', status: 'unused', summary: '行と列の濃淡で見せる型。今はどの媒体も使っておらず、暗い版は無い。',
      samples: [{ label: '年と区分', light: save('heatmap-light', renderCompositionHeatmap(liquor)) }],
    },
  ];
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));
  console.log(`${rows.length} 行・${fs.readdirSync(OUT).length - 1} 枚を ${OUT} へ書いた`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
