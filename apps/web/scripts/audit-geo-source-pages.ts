/** Local page verification and the per-source progress ledger. Run from repository root. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { gunzipSync } from 'node:zlib';

import { findGeoSourcePage } from '@stats47/data-configs/business-plan';
import { GIS_DATASETS_BY_ID } from '@stats47/gis/mlit-ksj';
import { chromium } from 'playwright';

import {
  parseGeoSourceCatalog,
  parseGeoSourceItem,
  type GeoSourceItem,
} from '../src/features/geo-analysis/lib/geo-source-catalog';
import { getGeoSourceNavigation } from '../src/features/geo-analysis/lib/geo-source-navigation';

import type { FeatureCollection, GeoJsonProperties } from 'geojson';
import type { Topology, GeometryObject } from 'topojson-specification';

const root = process.cwd();
const statePath = path.join(root, '.claude/state/geo/source-pages.json');
const reportDir = path.join(root, '.local/geo-source-pages');
const sha = (value: string | Buffer) =>
  createHash('sha256').update(value).digest('hex');
const load = (file: string) =>
  existsSync(file)
    ? JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''))
    : null;
const catalog = parseGeoSourceCatalog(
  load(path.join(root, '.local/r2/app/geo/layers/items.json'))
);
if (!catalog)
  throw new Error('Generate and validate the local source catalog first');
const requested = process.argv.includes('--ids')
  ? process.argv[process.argv.indexOf('--ids') + 1]?.split(',')
  : [];
const sources = getGeoSourceNavigation(catalog).flatMap((group) => group.items);
if (requested?.some((id) => !sources.some((source) => source.dataId === id)))
  throw new Error('Unknown or ineligible source ID');
const prior = load(statePath);
const viewerHash = sha(
  [
    'apps/web/src/app/geo/datasets/[dataId]/page.tsx',
    'apps/web/src/features/geo-analysis/components/GeoSourceExplorer.tsx',
    'apps/web/src/features/geo-analysis/components/GeoSourceMap.tsx',
    'apps/web/src/features/geo-analysis/components/GeoSourceReading.tsx',
    'apps/web/src/features/geo-analysis/lib/geo-source-worker.ts',
    'apps/web/src/features/geo-analysis/lib/geo-source-sampling.ts',
    'apps/web/src/features/geo-analysis/lib/geo-source-properties.ts',
  ]
    .map((file) => readFileSync(path.join(root, file), 'utf8'))
    .join('\n')
);
type Check = {
  verifiedAt: string;
  assetKey: string;
  assetSha256: string;
  featureCount: number;
  viewports: number[];
  screenshots: string[];
  mapStatus: string;
  fields: string[];
};
type Entry = {
  order: number;
  dataId: string;
  name: string;
  url: string;
  version?: string;
  fingerprint: string;
  content: 'implemented' | 'pending';
  map: Check | null;
  error: string | null;
  localStatus: string;
  production: 'unverified';
};
const entries: Entry[] = sources.map((source) => {
  const meta = GIS_DATASETS_BY_ID.get(source.dataId)!;
  const content = findGeoSourcePage(source.dataId, meta.latestVersion);
  const item = load(
    path.join(root, `.local/r2/app/geo/datasets/${source.dataId}/item.json`)
  );
  const fingerprint = sha(
    JSON.stringify({ content, item, viewerHash, version: meta.latestVersion })
  );
  const old = prior?.entries?.find(
    (entry: Entry) =>
      entry.dataId === source.dataId && entry.fingerprint === fingerprint
  );
  return {
    order: source.position,
    dataId: source.dataId,
    name: source.name,
    url: source.href,
    version: meta.latestVersion,
    fingerprint,
    content: content ? 'implemented' : 'pending',
    map: old?.map ?? null,
    error: old?.error ?? null,
    localStatus: 'pending',
    production: 'unverified',
  };
});
const htmlEscape = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        char
      ]!
  );
function save() {
  for (const entry of entries)
    entry.localStatus = entry.error
      ? 'needs-fix'
      : entry.content === 'implemented' && entry.map
        ? 'ready'
        : entry.content === 'implemented'
          ? 'verification-pending'
          : 'content-pending';
  const summary = {
    total: entries.length,
    localReady: entries.filter((entry) => entry.localStatus === 'ready').length,
    contentImplemented: entries.filter(
      (entry) => entry.content === 'implemented'
    ).length,
    mapVerified: entries.filter((entry) => entry.map).length,
    needsFix: entries.filter((entry) => entry.error).length,
    productionVerified: 0,
  };
  mkdirSync(path.dirname(statePath), { recursive: true });
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    statePath,
    JSON.stringify(
      {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        scope: 'local representative file; production not checked',
        backlogId: 'GEO-SOURCE-PAGES-01',
        summary,
        entries,
      },
      null,
      2
    ) + '\n'
  );
  const labels: Record<string, string> = {
    ready: 'ローカル確認済み',
    'needs-fix': '要修正',
    'verification-pending': '表示確認待ち',
    'content-pending': '内容整備待ち',
  };
  writeFileSync(
    path.join(reportDir, 'progress.html'),
    `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>GIS公開ページの進捗</title><style>body{font:15px/1.7 system-ui,sans-serif;color:#172554;background:#f8fafc;margin:24px auto;padding:0 16px;max-width:960px}h1{font-size:24px}table{border-collapse:collapse;width:100%;background:white}th,td{text-align:left;padding:10px;border-bottom:1px solid #cbd5e1}a{color:#1d4ed8}.ready{color:#166534}.needs-fix{color:#b91c1c}@media(max-width:600px){th,td{padding:8px;font-size:12px}}</style><h1>GIS公開ページの進捗</h1><p>ローカル確認済み ${summary.localReady} / ${summary.total}種類 · 読み方を作成 ${summary.contentImplemented}種類 · 地図を実表示確認 ${summary.mapVerified}種類</p><p>本番反映は全件未確認。地図確認は選んだ代表ファイルが対象です。更新：${new Date().toISOString().slice(0, 10)}</p><table><thead><tr><th>順</th><th>GIS</th><th>状態</th><th>次の作業</th></tr></thead><tbody>${entries.map((entry) => `<tr><td>${entry.order}</td><td><a href="http://localhost:3000${entry.url}">${htmlEscape(entry.name)}</a></td><td class="${entry.localStatus}">${labels[entry.localStatus]}</td><td>${htmlEscape(entry.error ?? (entry.localStatus === 'ready' ? '本番反映・本番確認' : entry.content === 'pending' ? '原典確認・読み方作成' : '代表区画の表示確認'))}</td></tr>`).join('')}</tbody></table></html>`
  );
  return summary;
}
function representative(item: GeoSourceItem) {
  const reasonable = item.assets.filter((asset) => asset.bytes < 8_000_000);
  return (
    reasonable.find((asset) => /\/5339(?:[.-]|\/)/.test(asset.key)) ??
    reasonable.find((asset) => /\/13(?:[./])/.test(asset.key)) ??
    reasonable.find((asset) => asset.bytes > 100_000) ??
    reasonable[0] ??
    item.assets[0]
  );
}
async function main() {
  save();
  if (!requested?.length) {
    console.log(JSON.stringify(save()));
    return;
  }
  const browser = await chromium.launch(
    process.platform === 'win32'
      ? { channel: 'msedge', headless: true }
      : { headless: true }
  );
  try {
    for (const entry of entries.filter((candidate) =>
      requested.includes(candidate.dataId)
    )) {
      const page = await browser.newPage({
        viewport: { width: 390, height: 960 },
      });
      page.setDefaultTimeout(90_000);
      const errors: string[] = [];
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        const item = parseGeoSourceItem(
          load(
            path.join(
              root,
              `.local/r2/app/geo/datasets/${entry.dataId}/item.json`
            )
          )
        );
        if (!item) throw new Error('地図の配布一覧を確認できません');
        const asset = representative(item);
        const content = findGeoSourcePage(entry.dataId, entry.version);
        const response = await page.goto(`http://localhost:3000${entry.url}`, {
          waitUntil: 'domcontentloaded',
          timeout: 180_000,
        });
        if (response?.status() !== 200)
          throw new Error(`ページ応答 ${response?.status()}`);
        console.log(`PAGE ${entry.dataId}`);
        if (content)
          await page.locator(`[data-geo-reading="${entry.dataId}"]`).waitFor();
        await page.waitForFunction(() =>
          [...document.querySelectorAll('button')].some(
            (button) =>
              button.textContent === '選んだ区画を地図で見る' &&
              !button.disabled
          )
        );
        const rejectCookies = page.getByRole('button', {
          name: '拒否',
          exact: true,
        });
        if (await rejectCookies.isVisible()) await rejectCookies.click();
        await page
          .getByLabel('配布区画を検索', { exact: true })
          .fill(asset.label);
        await page
          .getByRole('combobox')
          .filter({ hasText: asset.label })
          .waitFor();
        const [dataResponse] = await Promise.all([
          page.waitForResponse(
            (r) => r.url().includes(`/api/geo/source/${entry.dataId}/`),
            { timeout: 180_000 }
          ),
          page
            .getByRole('button', {
              name: '選んだ区画を地図で見る',
              exact: true,
            })
            .click(),
        ]);
        if (dataResponse.status() !== 200)
          throw new Error(`地図応答 ${dataResponse.status()}`);
        if (new URL(dataResponse.url()).searchParams.get('file') !== asset.key)
          throw new Error('選択した配布区画と地図応答が不一致');
        // Large nationwide files can be evicted from Chromium's inspector cache.
        // Read the exact selected URL again for evidence, while checking the rendered count below.
        const sourceBytes = await fetch(dataResponse.url(), {
          signal: AbortSignal.timeout(120_000),
        });
        if (!sourceBytes.ok)
          throw new Error(`原典検証の応答 ${sourceBytes.status}`);
        const stored = Buffer.from(await sourceBytes.arrayBuffer());
        const bytes =
          stored[0] === 31 && stored[1] === 139 ? gunzipSync(stored) : stored;
        const data = JSON.parse(bytes.toString('utf8')) as
          Topology | FeatureCollection;
        const features: { properties?: GeoJsonProperties }[] =
          data.type === 'Topology'
            ? Object.values(data.objects).flatMap(
                (object: GeometryObject<GeoJsonProperties>) =>
                  object.type === 'GeometryCollection'
                    ? object.geometries
                    : [object]
              )
            : data.features;
        if (!features?.length) throw new Error('表示対象の地物がありません');
        if (
          features.some((feature) =>
            JSON.stringify(feature.properties ?? {}).includes('\ufffd')
          )
        )
          throw new Error('属性に文字化けが残っています');
        const available = new Set(
          features.flatMap((feature) => Object.keys(feature.properties ?? {}))
        );
        const fields =
          content?.fields
            .filter((field) => available.has(field.key))
            .map((field) => field.key) ?? [];
        for (const field of content?.fields ?? [])
          if (!field.onlyWhenPresent && !available.has(field.key))
            throw new Error(`属性項目がありません: ${field.key}`);
        if (
          content &&
          (!fields.length ||
            features.some(
              (feature) =>
                !fields.some((key) => key in (feature.properties ?? {}))
            ))
        )
          throw new Error('読み方が対応しない属性形式があります');
        const status = page
          .getByRole('status')
          .filter({ hasText: /区画内 .*地物／表示対象候補/ });
        await status.waitFor();
        const mapStatus = await status.innerText();
        if (
          !mapStatus.includes(features.length.toLocaleString('ja-JP') + '地物')
        )
          throw new Error('原典と表示の地物数が不一致');
        const screenshots: string[] = [];
        for (const width of [320, 1440]) {
          await page.setViewportSize({ width, height: 960 });
          await page.locator('.leaflet-container').scrollIntoViewIfNeeded();
          await page.waitForFunction(() =>
            [
              ...document.querySelectorAll<HTMLCanvasElement>(
                '.leaflet-overlay-pane canvas'
              ),
            ].some((canvas) => {
              const ctx = canvas.getContext('2d');
              if (!ctx) return false;
              const pixels = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              ).data;
              return pixels.some(
                (value, index) => index % 4 === 3 && value > 0
              );
            })
          );
          if (
            await page.evaluate(
              () => document.documentElement.scrollWidth > innerWidth
            )
          )
            throw new Error(`横はみ出し ${width}px`);
          const screenshot = `.local/geo-source-pages/${entry.dataId}-${width}.png`;
          await page.screenshot({ path: path.join(root, screenshot) });
          screenshots.push(screenshot);
        }
        if (errors.length) throw new Error(errors.join('; '));
        entry.map = {
          verifiedAt: new Date().toISOString(),
          assetKey: asset.key,
          assetSha256: sha(stored),
          featureCount: features.length,
          viewports: [320, 1440],
          screenshots,
          mapStatus,
          fields,
        };
        entry.error = null;
        console.log(`PASS ${entry.dataId} ${features.length} features`);
      } catch (error) {
        entry.map = null;
        entry.error = error instanceof Error ? error.message : String(error);
        await page
          .screenshot({
            path: path.join(reportDir, `${entry.dataId}-error.png`),
          })
          .catch(() => {});
        if (errors.length) entry.error += `; ${errors.join('; ')}`;
        console.log(`FAIL ${entry.dataId}: ${entry.error}`);
      } finally {
        await page.close();
        save();
      }
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(save()));
  if (entries.some((entry) => requested.includes(entry.dataId) && entry.error))
    process.exitCode = 1;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
