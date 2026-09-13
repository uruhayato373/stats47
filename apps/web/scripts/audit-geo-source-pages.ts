/** Local page verification and the per-source progress ledger. Run from repository root. */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout } from 'node:timers/promises';
import { gunzipSync } from 'node:zlib';

import { findGeoSourcePage } from '@stats47/data-configs/business-plan';
import { GIS_DATASETS_BY_ID } from '@stats47/gis/mlit-ksj';
import { chromium } from 'playwright';

import {
  parseGeoSourceCatalog,
  parseGeoSourceItem,
  type GeoSourceItem,
} from '../src/features/geo-analysis/lib/geo-source-catalog';
import { findGeoSourceInitialAsset } from '../src/features/geo-analysis/lib/geo-source-initial-asset';
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
    'apps/web/src/features/geo-analysis/components/GeoSourceNavigation.tsx',
    'apps/web/src/features/geo-analysis/components/GeoSourceNavigationList.tsx',
    'apps/web/src/features/geo-analysis/components/GeoSourceReading.tsx',
    'apps/web/src/features/geo-analysis/lib/geo-source-worker.ts',
    'apps/web/src/features/geo-analysis/lib/geo-source-sampling.ts',
    'apps/web/src/features/geo-analysis/lib/geo-source-properties.ts',
    'apps/web/src/features/geo-analysis/lib/geo-source-initial-asset.ts',
    'apps/web/src/features/geo-analysis/lib/fit-geo-source-bounds.ts',
    'apps/web/src/features/geo-analysis/lib/geo-basemap.ts',
  ]
    .map((file) => readFileSync(path.join(root, file), 'utf8'))
    .join('\n')
);
type Check = {
  initialDisplay: 'automatic' | 'manual-large-file';
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
/** Windows can briefly refuse a write while another process reads the ledger. */
async function writeReport(file: string, contents: string) {
  const attempts = 5;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      await writeFile(file, contents);
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (
        process.platform !== 'win32' ||
        attempt === attempts ||
        !['UNKNOWN', 'EBUSY', 'EPERM', 'EACCES'].includes(code ?? '')
      )
        throw error;
      await setTimeout(attempt * 100);
    }
  }
}
async function save() {
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
  await writeReport(
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
  await writeReport(
    path.join(reportDir, 'progress.html'),
    `<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>GIS公開ページの進捗</title><style>body{font:15px/1.7 system-ui,sans-serif;color:#172554;background:#f8fafc;margin:24px auto;padding:0 16px;max-width:960px}h1{font-size:24px}table{border-collapse:collapse;width:100%;background:white}th,td{text-align:left;padding:10px;border-bottom:1px solid #cbd5e1}a{color:#1d4ed8}.ready{color:#166534}.needs-fix{color:#b91c1c}@media(max-width:600px){th,td{padding:8px;font-size:12px}}</style><h1>GIS公開ページの進捗</h1><p>ローカル確認済み ${summary.localReady} / ${summary.total}種類 · 読み方を作成 ${summary.contentImplemented}種類 · 地図を実表示確認 ${summary.mapVerified}種類</p><p>本番反映は全件未確認。地図確認は選んだ代表ファイルが対象です。更新：${new Date().toISOString().slice(0, 10)}</p><table><thead><tr><th>順</th><th>GIS</th><th>状態</th><th>次の作業</th></tr></thead><tbody>${entries.map((entry) => `<tr><td>${entry.order}</td><td><a href="http://localhost:3000${entry.url}">${htmlEscape(entry.name)}</a></td><td class="${entry.localStatus}">${labels[entry.localStatus]}</td><td>${htmlEscape(entry.error ?? (entry.localStatus === 'ready' ? '本番反映・本番確認' : entry.content === 'pending' ? '原典確認・読み方作成' : '代表区画の表示確認'))}</td></tr>`).join('')}</tbody></table></html>`
  );
  return summary;
}
function representative(item: GeoSourceItem) {
  return findGeoSourceInitialAsset(item.assets) ?? item.assets[0];
}
async function main() {
  await save();
  if (!requested?.length) {
    console.log(JSON.stringify(await save()));
    return;
  }
  const browser = await chromium.launch(
    process.platform === 'win32'
      ? { channel: 'msedge', headless: true }
      : { headless: true }
  );
  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 960 },
    });
    for (const entry of entries.filter((candidate) =>
      requested.includes(candidate.dataId)
    )) {
      const page = await context.newPage();
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
        const automatic = findGeoSourceInitialAsset(item.assets) !== null;
        const hasSelection = item.assets.length > 1 || !automatic;
        const content = findGeoSourcePage(entry.dataId, entry.version);
        const [initialResponse, response] = await Promise.all([
          automatic
            ? page.waitForResponse(
                (r) => r.url().includes(`/api/geo/source/${entry.dataId}/`),
                { timeout: 180_000 }
              )
            : Promise.resolve(null),
          page.goto(`http://localhost:3000${entry.url}`, {
            waitUntil: 'domcontentloaded',
            timeout: 180_000,
          }),
        ]);
        if (response?.status() !== 200)
          throw new Error(`ページ応答 ${response?.status()}`);
        console.log(`PAGE ${entry.dataId}`);
        if (content)
          await page.locator(`[data-geo-reading="${entry.dataId}"]`).waitFor();
        if (hasSelection)
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
        let dataResponse = initialResponse;
        if (!automatic) {
          await page
            .getByLabel('配布区画を検索', { exact: true })
            .fill(asset.label);
          await page
            .getByRole('combobox')
            .filter({ hasText: asset.label })
            .waitFor();
          [dataResponse] = await Promise.all([
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
        }
        if (!dataResponse || dataResponse.status() !== 200)
          throw new Error(`地図応答 ${dataResponse?.status()}`);
        if (
          hasSelection &&
          !(await page.locator('#source-asset').textContent())?.includes(
            asset.label
          )
        )
          throw new Error('初期表示と選択中の配布区画が不一致');
        if (
          (await page
            .locator('[data-geo-asset]')
            .getAttribute('data-geo-asset')) !== asset.key
        )
          throw new Error('表示中の地図と配布区画が不一致');
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
        if (entry.dataId === 'L03-a') {
          await page.waitForFunction(() => {
            const canvas = document.querySelector<HTMLCanvasElement>(
              '.leaflet-overlay-pane canvas'
            );
            const context = canvas?.getContext('2d');
            return (
              canvas &&
              context &&
              context
                .getImageData(0, 0, canvas.width, canvas.height)
                .data.some((value, index) => index % 4 === 3 && value > 0)
            );
          });
          await page.screenshot({
            path: path.join(reportDir, 'L03-a-initial.png'),
          });
        }
        const screenshots: string[] = [];
        for (const width of [320, 1440]) {
          await page.setViewportSize({ width, height: 960 });
          if (entry.dataId === 'L01') {
            await page.evaluate(() => window.scrollTo(0, 0));
            const initialMap = await page
              .locator('.leaflet-container')
              .boundingBox();
            if (!initialMap || initialMap.y + initialMap.height > 960)
              throw new Error(`初期画面に地図全体が収まりません ${width}px`);
            if (
              await page
                .getByRole('button', {
                  name: '選んだ区画を地図で見る',
                  exact: true,
                })
                .count()
            )
              throw new Error('配布区画が1件でも選択操作が表示されています');
            await page.screenshot({
              path: path.join(reportDir, `L01-density-${width}.png`),
            });
            const attributes = page.locator('[data-geo-reading="L01"] details');
            await attributes.locator('summary').click();
            if (
              !content ||
              !(await attributes
                .getByText(content.fields[0].description, { exact: true })
                .isVisible())
            )
              throw new Error('属性の説明を開いて確認できません');
            await attributes.locator('summary').click();
            const sourceLink = page.getByRole('link', {
              name: '原典・属性項目・利用条件を確認する',
              exact: true,
              includeHidden: true,
            });
            const sourceDetails = page
              .locator('details')
              .filter({ has: sourceLink });
            await sourceDetails.locator('summary').click();
            if (!(await sourceLink.isVisible()))
              throw new Error('出典リンクを開いて確認できません');
            await sourceDetails.locator('summary').click();
          }
          const disclosure = page
            .getByRole('region', { name: 'GIS一覧（50種類）', exact: true })
            .locator('summary');
          if (width === 320) await disclosure.click();
          const navigation = page.locator('nav[aria-label="GIS一覧"]:visible');
          const links = navigation.locator('[data-geo-source]');
          if ((await links.count()) !== sources.length)
            throw new Error(`GIS一覧に全件がありません ${width}px`);
          await navigation
            .getByRole('searchbox')
            .fill(entry.dataId.toLowerCase());
          await navigation
            .locator(`[data-geo-source="${entry.dataId}"]`)
            .waitFor();
          if (
            (await navigation
              .locator(`[data-geo-source="${entry.dataId}"]`)
              .getAttribute('aria-current')) !== 'true'
          )
            throw new Error('GIS一覧の現在地が不一致');
          await navigation.getByRole('button', { name: '検索を解除' }).click();
          if ((await links.count()) !== sources.length)
            throw new Error('検索解除でGIS一覧が戻りません');
          if (width === 320) await disclosure.click();
          await page.getByRole('button', { name: '区画全体に戻す' }).click();
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
          const mapBox = await page.locator('.leaflet-container').boundingBox();
          const statusBox = await status.boundingBox();
          const zoomBox = await page
            .locator('.leaflet-control-zoom-in')
            .boundingBox();
          if (!mapBox || !statusBox || statusBox.y < mapBox.y + mapBox.height)
            throw new Error('地図に状況説明が重なっています');
          if (!zoomBox || zoomBox.width < 44 || zoomBox.height < 44)
            throw new Error('地図の拡大ボタンが小さすぎます');
          const screenshot = `.local/geo-source-pages/${entry.dataId}-${width}.png`;
          await page.screenshot({ path: path.join(root, screenshot) });
          screenshots.push(screenshot);
        }
        if (entry.dataId === 'L03-a') {
          const origin = await page.evaluate(() => performance.timeOrigin);
          const chooser = page.locator('details').filter({
            has: page.getByLabel('配布区画を検索', { exact: true }),
          });
          await chooser.locator('summary').click();
          await page.getByLabel('配布区画を検索', { exact: true }).fill('3036');
          const [switched] = await Promise.all([
            page.waitForResponse(
              (response) =>
                new URL(response.url()).searchParams
                  .get('file')
                  ?.endsWith('/3036.topojson') === true
            ),
            page
              .getByRole('button', {
                name: '選んだ区画を地図で見る',
                exact: true,
              })
              .click(),
          ]);
          if (switched.status() !== 200)
            throw new Error('配布区画の切替に失敗しました');
          await page.waitForFunction(() =>
            [...document.querySelectorAll('[role="status"]')].some((element) =>
              element.textContent?.startsWith('区画内 200地物')
            )
          );
          for (const target of ['W09', 'L03-a']) {
            const nextItem = parseGeoSourceItem(
              load(
                path.join(
                  root,
                  `.local/r2/app/geo/datasets/${target}/item.json`
                )
              )
            );
            if (!nextItem) throw new Error('GIS移動の検証入力がありません');
            const nextAsset = findGeoSourceInitialAsset(nextItem.assets);
            if (!nextAsset)
              throw new Error('GIS移動の初期表示を確認できません');
            await page
              .locator(
                `nav[aria-label="GIS一覧"]:visible [data-geo-source="${target}"]`
              )
              .click();
            await page.waitForURL(
              `http://localhost:3000/geo/datasets/${target}`
            );
            await page.waitForFunction(
              (label) =>
                (document.querySelector<HTMLInputElement>('#source-search')
                  ?.value ?? '') === '' &&
                document
                  .querySelector('[data-geo-asset]')
                  ?.textContent?.includes(label) &&
                [...document.querySelectorAll('[role="status"]')].some(
                  (element) => element.textContent?.startsWith('区画内 ')
                ),
              nextAsset.label
            );
          }
          if ((await page.evaluate(() => performance.timeOrigin)) !== origin)
            throw new Error('ページ全体の再読み込みでGIS移動を代用しています');
          console.log('PASS L03-a manual selection and client navigation');

          // A hidden app panel may mount a map with a zero-sized viewport.
          // Reveal it without a window resize or user zoom, and require paint.
          const hiddenMapStyle = await page.addStyleTag({
            content: '.leaflet-container { display: none !important; }',
          });
          await chooser.locator('summary').click();
          await page
            .getByRole('button', {
              name: '選んだ区画を地図で見る',
              exact: true,
            })
            .click();
          await page.waitForFunction(() =>
            [...document.querySelectorAll('button')].some(
              (button) =>
                button.textContent === '区画全体に戻す' && !button.disabled
            )
          );
          await hiddenMapStyle.evaluate((style) =>
            style.parentNode?.removeChild(style)
          );
          await page.waitForFunction(() => {
            const canvas = document.querySelector<HTMLCanvasElement>(
              '.leaflet-overlay-pane canvas'
            );
            if (!canvas?.width || !canvas.height) return false;
            return (
              canvas
                .getContext('2d')
                ?.getImageData(0, 0, canvas.width, canvas.height)
                .data.some((value, index) => index % 4 === 3 && value > 0) &&
              [...document.querySelectorAll('[role="status"]')].some(
                (element) =>
                  element.textContent?.includes('表示対象候補 6,300地物')
              )
            );
          });
          await page.locator('.leaflet-container').scrollIntoViewIfNeeded();
          await page.screenshot({
            path: path.join(reportDir, 'L03-a-revealed.png'),
          });
          console.log('PASS L03-a hidden panel reveal without window resize');
        }
        if (errors.length) throw new Error(errors.join('; '));
        entry.map = {
          initialDisplay: automatic ? 'automatic' : 'manual-large-file',
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
        await save();
      }
    }
  } finally {
    await browser.close();
  }
  console.log(JSON.stringify(await save()));
  if (entries.some((entry) => requested.includes(entry.dataId) && entry.error))
    process.exitCode = 1;
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
