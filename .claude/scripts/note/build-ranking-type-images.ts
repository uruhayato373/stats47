/**
 * ランキング note 記事の本文 3 枚を、サイトと同じ共通の型の画像で chart-data.json から作る。
 *
 * 地図・棒はサイトと X の型、箱ひげは本文の「地域中央値」に合わせた地方別の型。色と単位は指標定義から決める。
 * 呼び元は render-ranking-images.mjs。入力は chart-data.json だけで、R2 は読まない。
 *
 * Usage: npx tsx .claude/scripts/note/build-ranking-type-images.ts --chart-data <path> --out <dir>
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { renderRankingBarsChart } from '../../../apps/admin/lib/template-ranking-bars';
import { renderRegionalBoxplotChart } from '../../../apps/admin/lib/template-regional-boxplot';
import { renderTileMapChart } from '../../../apps/admin/lib/template-ranking-tile-map';
import type { RankingChart } from '../../../apps/admin/lib/template-ranking-data';
import { getMetricConfig } from '../../../packages/data-configs/src/registry';
import { rankingChartFromArticleData } from '../blog/lib/type-chart-input';
import { NOTE_RANKING_IMAGES } from './lib/note-render-spec.mjs';

const RENDERERS: Record<string, (chart: RankingChart) => string> = {
  'ranking-tile-map': renderTileMapChart,
  'ranking-bars': renderRankingBarsChart,
  'regional-boxplot': renderRegionalBoxplotChart,
};

type ChartData = {
  _meta: { rankingKey: string; year: number | string };
  copy?: { canonicalTitle?: string };
  unit: string;
  data: { area_code: string; value: number }[];
};

/** chart-data.json を、型の画像の入力へ。同値の県の順位は入力側で計算し直される */
export function rankingChartFromNoteData(chartData: ChartData): RankingChart {
  const metric = getMetricConfig(chartData._meta.rankingKey);
  const source = metric?.source && 'displayName' in metric.source ? metric.source.displayName : '';
  const chart = rankingChartFromArticleData({
    title: metric?.title ?? chartData.copy?.canonicalTitle,
    year: String(chartData._meta.year),
    unit: chartData.unit,
    source,
    rankingKey: chartData._meta.rankingKey,
    data: chartData.data.map((row) => ({ areaCode: row.area_code, value: row.value })),
  }, {
    metric,
    prefCodeOf: () => '',
    prefNameOf: (code) => prefectureName(chartData, code),
  });
  if ('skip' in chart) throw new Error(`${chartData._meta.rankingKey}: 型の画像にできない (${chart.skip})`);
  return chart;
}

const prefectureName = (chartData: ChartData, code: string) =>
  (chartData.data as { area_code: string; area_name?: string }[]).find((row) => row.area_code.startsWith(code))?.area_name ?? code;

/** PNG にする librsvg は「°C」の 2 文字を離して描くので、1 文字の「℃」へ置き換える */
export const rasterSafeSvg = (svg: string) => svg.replaceAll('°C', '℃');

async function main(argv: string[]) {
  const arg = (flag: string) => (argv.includes(flag) ? argv[argv.indexOf(flag) + 1] : undefined);
  const input = arg('--chart-data'), out = arg('--out');
  if (!input || !out) throw new Error('--chart-data と --out が要る');
  const chart = rankingChartFromNoteData(JSON.parse(fs.readFileSync(input, 'utf8')));
  fs.mkdirSync(out, { recursive: true });
  for (const image of NOTE_RANKING_IMAGES) {
    const svg = rasterSafeSvg(RENDERERS[image.renderer](chart));
    await sharp(Buffer.from(svg), { density: 144 }).resize(image.width, image.height).png().toFile(path.join(out, path.basename(image.file)));
  }
}

if (process.argv[1]?.endsWith('build-ranking-type-images.ts')) {
  main(process.argv.slice(2)).catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
