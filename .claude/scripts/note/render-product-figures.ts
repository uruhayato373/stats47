/**
 * render-product-figures.ts — note のデータ商品の見本画像を、型の台帳の型だけで描く。
 *
 * 入力は記事の作業コピーにある figure-specs.json (画像ごとに file・template・input)。template は
 * 型の台帳 data/content-operations/image-templates.json の id で、描画は台帳の描画器 (apps/admin/lib/template-*、
 * 全国の市区町村の地図はバズマップ) だけが行う。台帳に無い型・ここで描けない型は描かずに止める。
 * figure-specs.json は記事と一緒に R2 へ保存し (note:article save)、build-note-figure-ledger.mjs が画像ごとの型を読む。
 * 経路の登録は config/image-generation-routes.json の note-product-samples。
 *
 * Usage: npx tsx .claude/scripts/note/render-product-figures.ts --spec <記事>/figure-specs.json [--out <dir>]
 *   --out を省くと spec と同じ記事ディレクトリへ file のパスで書く (例: images/compare-bars.png)
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';
import { formatValueWithPrecision, resolveValuePrecision } from '../../../packages/utils/src/number';
import { metricPresentation } from '../../../packages/data-configs/src/color-policy';
import { getMetricConfig } from '../../../packages/data-configs/src/registry';
import { renderItemBarsChart } from '../../../apps/admin/lib/template-ranking-bars';
import { renderTreemapChart, type TreemapChart } from '../../../apps/admin/lib/template-composition-treemap';
import { renderStackedChart, type StackedChart } from '../../../apps/admin/lib/template-composition-stacked';
import { renderDonutChart, type DonutChart } from '../../../apps/admin/lib/template-minor-charts';
import { renderFilePreview, type FilePreview } from '../../../apps/admin/lib/template-file-preview';
import { renderLineChart, type LineChart } from '../../../apps/admin/lib/template-trend-line';
import { renderAreaMapChart } from '../../../apps/admin/lib/template-area-map';
import { resolveAreaChart, type AreaChartInput } from '../../../apps/admin/lib/template-area-scope';
import { fetchMunicipalityTopologyForWardMode } from '../../../packages/gis/src/mlit/fetch-ward-mode-topology';
import type { Topology } from 'topojson-specification';
import { assertMinimalChartCopy } from '../media/lib/image-copy.mjs';
import { datasetPath } from '../../../config/datasets.mjs';

const ROOT = path.resolve(__dirname, '../../..');
const REMOTION_DIR = path.join(ROOT, 'apps/remotion');
const CHROME = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FRAME = { width: 1080, height: 1350 };
type Grain = Parameters<typeof metricPresentation>[1];

const presentationOf = (metricKey: string, grain: Grain) => {
  const metric = getMetricConfig(metricKey);
  if (!metric) throw Error(`指標定義が無い: ${metricKey}`);
  return metricPresentation(metric, grain);
};

/** 型ごとの入力 → SVG。型の台帳の id と同じ名前で、ここに無い型は描かない */
// 入力の形は型ごとに違う。spec の input はその型の関数へそのまま渡す (形の誤りは描画器が止める)
const SVG_RENDERERS: Record<string, (input: never) => string> = {
  bar: (input: { metricKey: string; grain: Grain; title: string; yearLabel: string; unit: string; source: string; note?: string; rows: { name: string; value: number }[] }) => {
    const precision = resolveValuePrecision(input.rows.map((row) => row.value));
    return renderItemBarsChart({ ...input, presentation: presentationOf(input.metricKey, input.grain), formatValue: (v) => formatValueWithPrecision(v, precision) });
  },
  line: (input: LineChart) => renderLineChart(input),
  'stacked-bar': (input: StackedChart) => renderStackedChart(input),
  pie: (input: DonutChart) => renderDonutChart(input),
  treemap: (input: Omit<TreemapChart, 'presentation'> & { metricKey: string; grain: Grain }) =>
    renderTreemapChart({ ...input, presentation: presentationOf(input.metricKey, input.grain) }),
  'file-preview': (input: FilePreview) => renderFilePreview(input),
};

/** 1 つの県の中の市区町村の地図は管理画面の型 (renderAreaMapChart) が描く。境界は県と政令市の扱いから公開 R2 で引く */
async function renderAreaMap(input: Omit<AreaChartInput, 'presentation'> & { metricKey: string; grain: Grain }) {
  const { scope } = input;
  if (scope.level !== 'municipality' || scope.within.kind !== 'prefecture') throw Error('県の地図は 1 つの県の中の市区町村だけを描く');
  const chart = resolveAreaChart({ ...input, presentation: presentationOf(input.metricKey, input.grain) });
  const topology = await fetchMunicipalityTopologyForWardMode(scope.within.prefCode, scope.wardMode) as unknown as Topology;
  return renderAreaMapChart(chart, topology);
}

/** 全国の市区町村の地図は管理画面の型が描かない (県の中だけ) ので、台帳の choropleth の描画器であるバズマップで描く */
function renderBuzzMap(spec: unknown, outPath: string) {
  const props = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'product-figure-')), 'props.json');
  fs.writeFileSync(props, JSON.stringify({ spec }));
  const res = spawnSync('npx', ['remotion', 'still', 'src/index.ts', 'BuzzMap-Still-45', outPath, `--props=${props}`, `--browser-executable=${CHROME}`],
    { cwd: REMOTION_DIR, stdio: 'pipe', encoding: 'utf-8' });
  fs.rmSync(path.dirname(props), { recursive: true, force: true });
  if (res.status !== 0 || !fs.existsSync(outPath)) throw Error(`remotion still 失敗: ${outPath}\n${res.stderr}`);
}

type FigureSpec = { file: string; template: string; input: unknown };

export async function renderProductFigures(specPath: string, outDir = path.dirname(specPath)) {
  const { figures } = JSON.parse(fs.readFileSync(specPath, 'utf8')) as { figures: FigureSpec[] };
  const ledger = new Set((JSON.parse(fs.readFileSync(path.join(ROOT, datasetPath('content.image-templates')), 'utf8')).templates as { id: string }[]).map((t) => t.id));
  const written: string[] = [];
  for (const figure of figures) {
    if (!ledger.has(figure.template) || figure.template === 'unclassified') throw Error(`${figure.file}: 型の台帳に無い型 ${figure.template}`);
    const out = path.join(outDir, figure.file);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    // 地図の型は 1 つ。全国はバズマップ (input.buzzMap)、1 つの県の中は管理画面の型 (input.area) が描く
    const map = figure.template === 'choropleth' ? (figure.input as { buzzMap?: unknown; area?: Parameters<typeof renderAreaMap>[0] }) : null;
    if (map && !map.buzzMap && !map.area) throw Error(`${figure.file}: 地図の入力は buzzMap か area のどちらか`);
    if (map?.buzzMap) {
      renderBuzzMap(map.buzzMap, out);
    } else {
      const render = map?.area ? null : SVG_RENDERERS[figure.template];
      if (!map?.area && !render) throw Error(`${figure.file}: 型 ${figure.template} はこの経路ではまだ描けない`);
      const svg = map?.area ? await renderAreaMap(map.area) : render!(figure.input as never);
      assertMinimalChartCopy(svg);
      await sharp(Buffer.from(svg), { density: 144 }).resize(FRAME.width, FRAME.height).png().toFile(out);
    }
    written.push(out);
  }
  return written;
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const arg = (name: string) => { const i = process.argv.indexOf(name); return i > 0 ? process.argv[i + 1] : undefined; };
  const spec = arg('--spec');
  if (!spec) { console.error('使い方: --spec <figure-specs.json> [--out <dir>]'); process.exit(2); }
  renderProductFigures(path.resolve(spec), arg('--out') && path.resolve(arg('--out')!))
    .then((files) => { for (const f of files) console.log(`✓ ${path.relative(ROOT, f)}`); })
    .catch((error) => { console.error(error.message); process.exit(1); });
}
