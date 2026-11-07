/* eslint-disable no-console -- This local command reports what it wrote. */
/**
 * 型の最終確認の画面 (/ops/image-templates/review) が読む見本を作る。
 *
 * 公開 R2 の値と公開中の図を読むだけで、R2 へは書かない。出力は .local/template-review/ (git に置かない)。
 * 行の順番・題名・状態は型の台帳 (data/content-operations/image-templates.json の review) が正本で、ここは見本だけを作る。
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
import { rankingRows, renderAreaBarsChart, renderItemBarsChart, renderRankingBarsChart } from '../lib/template-ranking-bars';
import { rankingInputFromStats, sampleRankingChart } from '../lib/template-ranking-data';
import { renderRankingTable } from '../lib/template-ranking-table';
import { renderTileMapChart } from '../lib/template-ranking-tile-map';
import { renderRegionalBoxplotChart } from '../lib/template-regional-boxplot';
import { CHANGE_SAMPLE_SOURCES, renderTileChangeSample } from '../lib/template-tile-change';
import { renderRadarChart, type RadarChart } from '../lib/template-radar';
import { reviewRowsOf, type ReviewSample, type SampledTemplate } from '../lib/template-review-rows';
import { flowsFromTable, renderSankeyChart } from '../lib/template-sankey';
import { renderLineChart } from '../lib/template-trend-line';
import { regionNetSteps, renderWaterfallChart } from '../lib/template-waterfall';
import { CHART_THEMES } from '../../remotion/src/features/data-cards/chart-theme';
import { datasetPath } from '../../../config/datasets.mjs';
import { chartSourceName, groupedBarChartFromArticleData, itemBarChartFromArticleData, lineChartFromArticleData, rankingChartFromArticleData, stackedChartFromArticleData } from '../../../.claude/scripts/blog/lib/type-chart-input';
import { PREF_NAMES } from '../../../.claude/scripts/lib/prefectures.cjs';
import { assertMinimalChartCopy } from '../../../.claude/scripts/media/lib/image-copy.mjs';
import { R2_PUBLIC_BASE_URL } from '../../../.claude/scripts/lib/site-config.cjs';
import { metricPresentation } from '../../../packages/data-configs/src/color-policy';
import { getMetricConfig } from '../../../packages/data-configs/src/registry';
import { fetchMunicipalityTopologyForWardMode } from '../../../packages/gis/src/mlit/fetch-ward-mode-topology';
import { parseStatsValuesPayload } from '../../../packages/stats-r2/src/schemas';
import type { Topology } from 'topojson-specification';

const ROOT = path.resolve(__dirname, '../../..');
const OUT = path.join(ROOT, '.local/template-review');
const R2 = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;

type Sample = ReviewSample;

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
async function stackedSample(id: string, label: string, slug: string, base: string, normalized?: boolean) {
  const data = await json(blog(slug, base));
  const chart = stackedChartFromArticleData(data);
  if ('skip' in chart) throw Error(`${base}: ${chart.skip}`);
  chart.source = chartSourceName(data, await json(blog(slug, base, 'source.json')), metricSource) || chart.source;
  return both(id, label, (theme) => renderStackedChart(normalized === undefined ? chart : { ...chart, normalized, title: chart.title.replace(/の構成比$/, ''), unit: '千kL', meta: '単位：千kL' }, theme));
}
const AREA_METRIC = 'total-population';
const AREA_YEAR = '2020';
async function areaInputs() {
  const metric = getMetricConfig(AREA_METRIC)!;
  const rows = parseStatsValuesPayload(await json(`app/stats/${AREA_METRIC}/cities.json`)).rows.filter((row) => row.yearCode === AREA_YEAR);
  const chartOf = (scope: AreaScope) => resolveAreaChart({
    title: `${metric.title}`, yearLabel: `${AREA_YEAR}年`, unit: rows[0].unit ?? metric.unit, source: metricSource(AREA_METRIC) ?? '',
    presentation: metricPresentation(metric, scope.level === 'municipality' && scope.wardMode === 'split' ? 'municipality-split' : 'municipality-merged'), scope, values: rows.map((row) => ({ areaCode: row.areaCode, value: row.value })),
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
const TOKYO_CODE = '13000';
const OSAKA_CODE = '27000';
const RADAR_SLUG = 'cc-estat-09-radar-prefecture';
const RADAR_SOURCE = '社会・人口統計体系';
const AGRI_SLUG = 'cc-estat-13-agri-sankey';
const AGRI_BASE = 'cc-estat-13-agri-sankey-region-category-stacked';

async function radarSample(id: string, label: string, base: string) {
  const [data, manifest] = [await json(blog(RADAR_SLUG, base)), await json(blog(RADAR_SLUG, base, 'source.json'))];
  const years = (manifest.inputs as { year: string }[]).map((input) => input.year).sort();
  const series = data.series as RadarChart['series'];
  const chart: RadarChart = {
    title: `${series.filter((s) => !s.reference).map((s) => s.name).join('と')}の${data.axes.length}指標`,
    meta: `${years[0]}〜${years[years.length - 1]}年 · 47都道府県の最小を0、最大を1に換算`,
    source: RADAR_SOURCE, axes: data.axes, series,
  };
  return both(id, label, (theme) => renderRadarChart(chart, theme));
}
async function itemBarSample(id: string, label: string, slug: string, base: string) {
  const data = await json(blog(slug, base));
  const chart = itemBarChartFromArticleData(data);
  if ('skip' in chart) throw Error(`${base}: ${chart.skip}`);
  chart.source = chartSourceName(data, await json(blog(slug, base, 'source.json')), metricSource) || chart.source;
  return both(id, label, (theme) => renderItemBarsChart(chart, theme));
}
async function sankeySample(id: string, label: string) {
  const data = await json(blog(AGRI_SLUG, AGRI_BASE));
  const source = chartSourceName(data, await json(blog(AGRI_SLUG, AGRI_BASE, 'source.json')), metricSource);
  const chart = { title: '地方別の農業産出額の内訳', meta: `${data.year}年 · 単位：${data.valueUnit}`, source, ...flowsFromTable(data) };
  return both(id, label, (theme) => renderSankeyChart(chart, theme));
}

async function main() {
  for (const file of fs.existsSync(OUT) ? fs.readdirSync(OUT) : []) fs.rmSync(path.join(OUT, file));
  fs.mkdirSync(OUT, { recursive: true });
  const input = rankingInputFromStats(await json('app/stats/maximum-temperature/values.json'));
  const ranking = sampleRankingChart({ data: rankingRows(input) });
  const liquor = await json(blog('alcohol-prefecture-map', 'liquor-type-breakdown'));
  const changeInput = { item: await json(CHANGE_SAMPLE_SOURCES.item.key), values: await json(CHANGE_SAMPLE_SOURCES.values.key) };
  const change = { light: await renderTileChangeSample(changeInput), dark: await renderTileChangeSample(changeInput, CHART_THEMES.dark) };
  const { chartOf, merged, split } = await areaInputs();
  const inPrefecture = (wardMode: 'merged' | 'split'): AreaScope => ({ level: 'municipality', wardMode, within: { kind: 'prefecture', prefCode: '14' } });
  const pairs = (await json(`app/stats/population-migration-inter-prefecture/migration-flow-${MIGRATION_YEAR}.json`)).rows as MigrationPair[];
  const chordHead = { meta: `${MIGRATION_YEAR}年 · 単位：人`, source: MIGRATION_SOURCE };
  const netMoves = (name: string, code: string) => ({
    title: `${name}の転入超過の内訳`, meta: `${MIGRATION_YEAR}年 · 地方別 · 単位：人`, source: MIGRATION_SOURCE,
    steps: regionNetSteps(pairs, code), totalLabel: '転入超過',
  });
  const samples: Record<SampledTemplate, Sample[]> = {
    bar: [
        both('bar', '上位 5・下位 5 のカード', (theme) => renderRankingBarsChart(ranking, theme)),
        both('bar-merged', '県の中・政令指定都市を統合', (theme) => renderAreaBarsChart(chartOf(inPrefecture('merged')), theme)),
        both('bar-split', '県の中・政令指定都市を分割', (theme) => renderAreaBarsChart(chartOf(inPrefecture('split')), theme)),
        await itemBarSample('bar-items', '県に限らない行', 'income-quintile-alcohol', 'wine-quintile'),
        await itemBarSample('bar-partial', '一部の県', 'aquaculture-harvest-prefecture-gap', 'aquaculture-harvest-prefecture-gap-prefecture-rankings'),
    ],
    'tile-map': [
        both('tile', '値の塗り', (theme) => renderTileMapChart(ranking, theme)),
        await baseTileSample('tile-base', '基準の県あり・正負の値', 'osaka-migration-flow', 'osaka-migration-flow-migration-map'),
        both('tile-change', '2 時点の増減', (theme) => change[theme.name]),
    ],
    choropleth: [
        both('map', '都道府県版', (theme) => renderDistributionMapChart(ranking, theme)),
        both('map-merged', '市区町村・政令指定都市を統合', (theme) => renderAreaMapChart(chartOf(inPrefecture('merged')), merged, theme)),
        both('map-split', '市区町村・政令指定都市を分割', (theme) => renderAreaMapChart(chartOf(inPrefecture('split')), split, theme)),
    ],
    scatter: [await published('scatter', '全 47 点', 'black-tea-income-gap', 'black-tea-income-gap-income-scatter')],
    line: [
        await lineSample('line-one', '1 本', 'energy-infrastructure-gas-electricity', 'gasoline-trend'),
        await lineSample('line-three', '3 本・途中から始まる線', 'beer-peak-month-july-to-december', 'alcohol-expenditure-timeseries'),
        await lineSample('line-five', '5 本・値が近い', 'automotive-industry-transformation-map', 'manufacturing-shipment-timeseries'),
    ],
    'stacked-bar': [
        await stackedSample('stacked-share', '100%・棒が少ない', 'alcohol-prefecture-map', 'liquor-type-breakdown'),
        await stackedSample('stacked-many', '100%・棒が多い', 'cc-estat-13-agri-sankey', 'cc-estat-13-agri-sankey-region-category-stacked'),
        await stackedSample('stacked-value', '実数・棒が少ない', 'alcohol-prefecture-map', 'liquor-type-breakdown', false),
    ],
    'grouped-bar': [await groupedSample('grouped-month', '12 か月 × 3 年', 'beer-peak-month-july-to-december', 'beer-months-by-year-timeseries')],
    chord: [
        both('chord-region', '地方別', (theme) => renderChordChart({ title: '地方のあいだの人の移動', ...chordHead, ...regionChordNodes(pairs) }, theme)),
        both('chord-pref', '都道府県別', (theme) => renderChordChart({ title: '都道府県のあいだの人の移動', ...chordHead, ...prefectureChordNodes(pairs, PREF_NAMES as string[]) }, theme)),
    ],
    radar: [
        await radarSample('radar-two', '2 県と中央値', 'tokyo-kyoto-radar'),
        await radarSample('radar-one', '1 県と中央値', 'tokyo-radar'),
    ],
    sankey: [await sankeySample('sankey', '地方から品目へ')],
    waterfall: [
        both('waterfall-up', '増だけの内訳', (theme) => renderWaterfallChart(netMoves('東京都', TOKYO_CODE), theme)),
        both('waterfall-mixed', '増と減が混ざる内訳', (theme) => renderWaterfallChart(netMoves('大阪府', OSAKA_CODE), theme)),
    ],
    boxplot: [both('boxplot', '地方別', (theme) => renderRegionalBoxplotChart(ranking, theme))],
    table: [both('table', '全 47 都道府県', (theme) => renderRankingTable(input, theme))],
    pie: [both('pie', '構成比', (theme) => renderCompositionPie(liquor, theme))],
    heatmap: [both('heatmap', '年と区分', (theme) => renderCompositionHeatmap(liquor, theme))],
  };
  const rows = reviewRowsOf(JSON.parse(fs.readFileSync(path.join(ROOT, datasetPath('content.image-templates')), 'utf8')).templates, samples);
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));
  console.log(`${rows.length} 行・${fs.readdirSync(OUT).length - 1} 枚を ${OUT} へ書いた`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
