/** Decode all staged variants, validate provenance/freshness, optionally audit cards in a real browser. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { GIS_DATASETS_BY_ID, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';
import { chromium } from 'playwright';
import sharp from 'sharp';

import {
  parseGeoSourceCatalog,
  parseGeoSourceItem,
} from '../src/features/geo-analysis/lib/geo-source-catalog';
import {
  GEO_SOURCE_THUMBNAILS,
  GEO_THUMBNAIL_SIZES,
  geoThumbnailKey,
} from '../src/features/geo-analysis/lib/geo-source-thumbnail';

import { GEO_THUMBNAIL_GENERATOR_SPEC as spec } from './data/image-generator-registry';
import {
  calculateRendererHash,
  compareImageGenerationManifest,
  createImageGenerationPlan,
  sha256,
} from './lib/image-generation-manifest';

import type { ImageGenerationManifest } from '@stats47/types';

const root = process.cwd();
const stage = join(root, '.local/image-staging/geo-thumbnails');
const report = join(root, '.local/geo-source-thumbnails');
const json = (file: string): unknown => JSON.parse(readFileSync(file, 'utf8'));
const assert = (condition: unknown, message: string) => {
  if (!condition) throw new Error(message);
};

async function main() {
  mkdirSync(report, { recursive: true });
  const catalog = parseGeoSourceCatalog(
    json(join(root, '.local/r2/app/geo/layers/items.json'))
  );
  if (!catalog) throw new Error('Source catalog unavailable');
  assert(
    Object.keys(GEO_SOURCE_THUMBNAILS).length === catalog.items.length,
    'Thumbnail/catalog coverage differs'
  );
  const rendererHash = calculateRendererHash(root, spec.rendererSources);
  const audit: { id: string; bytes: number; coloredPixels: number[] }[] = [];
  const visibilityFailures: string[] = [];
  for (const entry of catalog.items) {
    const config = GEO_SOURCE_THUMBNAILS[entry.dataId];
    const meta = GIS_DATASETS_BY_ID.get(entry.dataId);
    assert(
      config?.version === entry.version &&
        meta?.latestVersion === entry.version &&
        meta &&
        getKsjLicensePolicy(meta.license).sourcePublication ===
          'public-r2-eligible',
      `${entry.dataId}: eligibility/version`
    );
    const manifestKey = `app/geo/datasets/${entry.dataId}/thumbnails/${entry.version}/manifest.json`;
    const manifest = json(join(stage, manifestKey)) as ImageGenerationManifest<{
      inputs: { key: string; sha256: string; bytes: number }[];
    }>;
    const assets = Object.entries(GEO_THUMBNAIL_SIZES).map(
      ([variant, size]) => ({
        key: geoThumbnailKey(
          entry.dataId,
          entry.version,
          variant as keyof typeof GEO_THUMBNAIL_SIZES
        ),
        variant,
        contentType: 'image/webp' as const,
        ...size,
      })
    );
    const plan = createImageGenerationPlan({
      generator: spec.generator,
      entityId: entry.dataId,
      manifestKey,
      rendererHash,
      input: {
        config,
        inputs: manifest.metadata.inputs,
        sourceUrl: entry.sourceUrl,
        license: meta!.license,
      },
      assets,
    });
    assert(
      compareImageGenerationManifest(manifest, plan).isCurrent,
      `${entry.dataId}: stale manifest`
    );
    const item = parseGeoSourceItem(
      json(join(root, `.local/r2/app/geo/datasets/${entry.dataId}/item.json`))
    );
    assert(
      config.files.length === manifest.metadata.inputs.length &&
        manifest.metadata.inputs.every(
          (input, index) =>
            input.key ===
              `gis/mlit-ksj/${entry.dataId}/${entry.version}/${config.files[index]}` &&
            item?.assets.some((a) => a.key === input.key)
        ),
      `${entry.dataId}: source lineage`
    );
    const pixels: number[] = [];
    for (const asset of manifest.assets) {
      const file = join(stage, asset.key);
      assert(existsSync(file), `${asset.key}: missing`);
      const bytes = readFileSync(file);
      assert(
        bytes.length === asset.bytes && sha256(bytes) === asset.sha256,
        `${asset.key}: SHA/size`
      );
      const decoded = await sharp(bytes)
        .removeAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      assert(
        decoded.info.width === asset.width &&
          decoded.info.height === asset.height,
        `${asset.key}: dimensions`
      );
      let colored = 0;
      for (let i = 0; i < decoded.data.length; i += decoded.info.channels) {
        const rgb = [decoded.data[i], decoded.data[i + 1], decoded.data[i + 2]];
        if (Math.max(...rgb) - Math.min(...rgb) >= 28) colored++;
      }
      if (colored < 20)
        visibilityFailures.push(
          `${asset.key}: no visible data pixels (${colored})`
        );
      pixels.push(colored);
    }
    audit.push({
      id: entry.dataId,
      bytes: manifest.assets.reduce((sum, a) => sum + a.bytes, 0),
      coloredPixels: pixels,
    });
  }
  // A contact sheet is a review artifact, not an additional published aspect ratio.
  for (let offset = 0; offset < catalog.items.length; offset += 25) {
    const cells = [];
    for (const [index, entry] of catalog.items
      .slice(offset, offset + 25)
      .entries()) {
      const x = (index % 5) * 260,
        y = Math.floor(index / 5) * 172;
      const image = await sharp(
        join(stage, geoThumbnailKey(entry.dataId, entry.version, 'wide'))
      )
        .resize(256, 144)
        .png()
        .toBuffer();
      const label = Buffer.from(
        `<svg width="256" height="24"><text x="5" y="17" font-size="14">${entry.dataId}</text></svg>`
      );
      cells.push(
        { input: label, left: x, top: y },
        { input: image, left: x, top: y + 24 }
      );
    }
    await sharp({
      create: { width: 1300, height: 860, channels: 3, background: '#ffffff' },
    })
      .composite(cells)
      .png()
      .toFile(join(report, `gallery-${offset / 25 + 1}.png`));
  }
  const widths: number[] = [];
  assert(visibilityFailures.length === 0, visibilityFailures.join('\n'));
  if (process.argv.includes('--browser')) {
    const browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
    });
    try {
      const context = await browser.newContext({
        viewport: { width: 320, height: 960 },
      });
      for (const width of [320, 390, 768, 1280, 1440]) {
        console.log(`Browser ${width}: opening directory`);
        const page = await context.newPage();
        await page.setViewportSize({ width, height: 960 });
        page.setDefaultTimeout(30000);
        try {
          const response = await page.goto('http://localhost:3000/geo/layers', {
            waitUntil: 'domcontentloaded',
            timeout: 120000,
          });
          assert(response?.ok(), `${width}: directory response`);
          const section = page.getByRole('region', { name: '公開GIS一覧' });
          const cards = section.locator('[data-geo-source-card]');
          await cards.first().waitFor();
          const rejectCookies = page.getByRole('button', {
            name: '拒否',
            exact: true,
          });
          if (await rejectCookies.isVisible()) await rejectCookies.click();
          assert(
            (await cards.count()) === catalog.items.length,
            `${width}: card count`
          );
          for (const card of await cards.all()) {
            const img = card.locator('img');
            console.log(
              `Browser ${width}: ${await card.getAttribute('data-geo-source-card')}`
            );
            await img.scrollIntoViewIfNeeded();
            // Fetch every variant for the audit, including images a background
            // browser may still defer. The shipped card remains native-lazy.
            await img.evaluate((node: HTMLImageElement) => {
              node.loading = 'eager';
            });
            await img.evaluate((node: HTMLImageElement) =>
              Promise.race([
                node.decode(),
                new Promise((_, reject) =>
                  setTimeout(
                    () =>
                      reject(
                        new Error(`Image decode timeout: ${node.currentSrc}`)
                      ),
                    20000
                  )
                ),
              ])
            );
            const dimensions = await img.evaluate((node: HTMLImageElement) => ({
              naturalWidth: node.naturalWidth,
              viewport: window.innerWidth,
              src: node.currentSrc,
              media: window.matchMedia('(min-width: 640px)').matches,
            }));
            assert(
              dimensions.naturalWidth === (dimensions.media ? 640 : 256),
              `${width}: wrong aspect source ${JSON.stringify(dimensions)}`
            );
          }
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth
            ),
            `${width}: horizontal overflow`
          );
          const search = section.getByLabel('データ名で検索');
          await search.fill('P29');
          assert((await cards.count()) === 1, `${width}: search`);
          await search.fill('');
          await page.evaluate(() => window.scrollTo(0, 0));
          await page.screenshot({
            path: join(report, `directory-${width}.png`),
          });
          await cards.filter({ hasText: '地価公示' }).click();
          await page.waitForURL('**/geo/datasets/L01', {
            waitUntil: 'domcontentloaded',
            timeout: 120000,
          });
          const related = page.getByRole('heading', {
            name: 'あわせて見るGIS',
          });
          await related.scrollIntoViewIfNeeded();
          const relatedImages = page.locator(
            '[data-geo-reading] [data-geo-source-card] img'
          );
          assert(
            (await relatedImages.count()) > 0,
            `${width}: related images missing`
          );
          for (const img of await relatedImages.all()) {
            await img.scrollIntoViewIfNeeded();
            await img.evaluate((node: HTMLImageElement) => node.decode());
          }
          assert(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= window.innerWidth
            ),
            `${width}: related overflow`
          );
          widths.push(width);
          console.log(`Browser ${width}: PASS`);
        } finally {
          await page.close();
        }
      }
    } finally {
      await browser.close();
    }
  }
  const result = {
    checkedAt: new Date().toISOString(),
    rendererHash,
    datasets: audit.length,
    images: audit.length * 2,
    totalBytes: audit.reduce((sum, item) => sum + item.bytes, 0),
    browserWidths: widths,
    items: audit,
    productionVerified: false,
  };
  writeFileSync(
    join(root, '.claude/state/geo/source-thumbnails-audit.json'),
    JSON.stringify(result, null, 2) + '\n'
  );
  console.log(
    JSON.stringify({
      datasets: result.datasets,
      images: result.images,
      totalBytes: result.totalBytes,
      browserWidths: widths,
    })
  );
}
main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
