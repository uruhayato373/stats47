#!/usr/bin/env tsx
/** R2 + git metric definitions → validated Remotion cards + provenance + draft handoff. */
import { createHash } from 'node:crypto';
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import { bundle } from '@remotion/bundler';
import {
  openBrowser,
  renderStill,
  selectComposition,
} from '@remotion/renderer';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';
import {
  CARD_COMPOSITIONS,
  CARD_KINDS,
  type DataCardProps,
} from '../../../apps/remotion/src/features/data-cards/model';
import { buildDataCard } from './lib/data-card-input';
import { prefectureShape } from './lib/data-card-shape';
import { R2_PUBLIC_BASE_URL, SITE_ORIGIN } from '../lib/site-config.cjs';
import { METRIC_DEFINITIONS_DIR } from '../../../config/paths.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha256 = (bytes: string | Buffer) =>
  createHash('sha256').update(bytes).digest('hex');

async function main() {
  const { values: opts } = parseArgs({
    options: {
      kind: { type: 'string' },
      area: { type: 'string' },
      year: { type: 'string' },
      key: { type: 'string' },
      from: { type: 'string' },
      to: { type: 'string' },
      areas: { type: 'string' },
      platform: { type: 'string', default: 'x' },
      out: { type: 'string' },
      'prepare-only': { type: 'boolean', default: false },
      help: { type: 'boolean', default: false },
    },
  });
  if (opts.help) {
    console.log(
      'render-data-card.ts --kind household-receipt|area-atlas --area 28 [--year 2024]\nrender-data-card.ts --kind rank-routes --key bread-consumption-expenditure --from 2014 --to 2024 [--areas 28,27,33,26]\nrender-data-card.ts --kind tile-change --key total-population|households|births --from <year> --to <year>\n[--platform x|instagram|both] [--out <new-directory>] [--prepare-only]'
    );
    return;
  }
  const kind = CARD_KINDS.find((k) => k === opts.kind);
  if (!kind || !['x', 'instagram', 'both'].includes(opts.platform))
    throw new Error('有効な --kind と --platform を指定してください (--help)');
  if (kind === 'area-atlas' && opts.year)
    throw new Error('県図鑑は指標ごとの最新年を使用します (--year 不可)');
  if (
    !['rank-routes', 'tile-change'].includes(kind) &&
    (opts.key || opts.from || opts.to || opts.areas)
  )
    throw new Error('--key / --from / --to / --areas は順位図専用です');
  if (['rank-routes', 'tile-change'].includes(kind) && (opts.area || opts.year))
    throw new Error('順位図は --areas / --from / --to を使用してください');
  if (kind === 'tile-change' && opts.areas)
    throw new Error('タイル変化図は47県すべてを使います (--areas 不可)');
  const temp = mkdtempSync(join(tmpdir(), 'sns-data-card-'));
  try {
    const generated = join(temp, 'output');
    mkdirSync(join(generated, 'sources'), { recursive: true });
    const sourceFiles: {
      key: string;
      url?: string;
      retrievedAt: string;
      sha256: string;
      file: string;
    }[] = [];
    const record = (key: string, bytes: Buffer, url?: string) => {
      const file = `sources/${key.replaceAll('/', '__')}`;
      writeFileSync(join(generated, file), bytes);
      sourceFiles.push({
        key,
        url,
        retrievedAt: new Date().toISOString(),
        sha256: sha256(bytes),
        file,
      });
    };
    const read = async (key: string): Promise<unknown> => {
      const url = `${process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL}/${key}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(30000) });
      if (!response.ok)
        throw new Error(`R2取得失敗: ${response.status} ${key}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      record(key, bytes, url);
      return JSON.parse(bytes.toString('utf8'));
    };
    const shape = async (area: string) => {
      const key = 'apps/remotion/public/prefecture.topojson';
      const bytes = readFileSync(join(ROOT, key));
      record(key, bytes);
      const topology: Topology<{
        pref: GeometryCollection<{ N03_007: string }>;
      }> = JSON.parse(bytes.toString('utf8'));
      const prefecture = feature(topology, topology.objects.pref).features.find(
        (f) => f.properties?.N03_007 === area.slice(0, 2)
      );
      if (!prefecture) throw new Error(`県境データがありません: ${area}`);
      return prefectureShape(prefecture);
    };
    const card = await buildDataCard(
      {
        kind,
        area: opts.area,
        year: opts.year,
        key: opts.key,
        from: opts.from,
        to: opts.to,
        areas: opts.areas?.split(','),
      },
      read,
      shape
    );
    for (const key of card.metricKeys)
      record(
        `${METRIC_DEFINITIONS_DIR}/${key}.ts`,
        readFileSync(join(ROOT, METRIC_DEFINITIONS_DIR, `${key}.ts`))
      );
    const out = opts.out
      ? resolve(opts.out)
      : join(ROOT, '.local/r2/sns', kind, card.key);
    if (existsSync(out))
      throw new Error(
        `既存成果物を保護しました。別の --out を指定してください: ${out}`
      );
    const props: DataCardProps = { card, slide: 'detail' };
    writeFileSync(
      join(generated, 'props.json'),
      JSON.stringify(props, null, 2)
    );
    const outputs: {
      file: string;
      sha256: string;
      width: number;
      height: number;
    }[] = [];
    if (!opts['prepare-only']) {
      // Only the shared fonts are static assets for these cards (map geometry is in validated props).
      const publicDir = join(temp, 'public');
      cpSync(
        join(ROOT, 'apps/remotion/public/buzz-map/fonts'),
        join(publicDir, 'buzz-map/fonts'),
        { recursive: true }
      );
      const serveUrl = await bundle({
        entryPoint: join(
          ROOT,
          'apps/remotion/src/features/data-cards/entry.tsx'
        ),
        publicDir,
        enableCaching: false,
        outDir: join(temp, 'bundle'),
      });
      const chrome =
        process.env.CHROME_PATH ||
        (process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : undefined);
      const browser = await openBrowser('chrome', {
        browserExecutable: chrome,
      });
      try {
        const platforms =
          opts.platform === 'both' ? ['x', 'instagram'] : [opts.platform];
        for (const platform of platforms) {
          const slides: DataCardProps['slide'][] =
            platform === 'x' ? ['detail'] : ['cover', 'detail', 'source'];
          for (const [index, slide] of slides.entries()) {
            const file =
              platform === 'x'
                ? `x/stills/${card.key}.png`
                : `instagram/stills/slide-${index + 1}-${slide}-1080x1350.png`;
            mkdirSync(dirname(join(generated, file)), { recursive: true });
            const inputProps = { card, slide };
            // renderStill renders composition.props; resolve again for each slide.
            const composition = await selectComposition({
              serveUrl,
              id: CARD_COMPOSITIONS[kind],
              inputProps,
              puppeteerInstance: browser,
            });
            await renderStill({
              serveUrl,
              composition,
              inputProps,
              output: join(generated, file),
              imageFormat: 'png',
              puppeteerInstance: browser,
            });
            outputs.push({
              file,
              sha256: sha256(readFileSync(join(generated, file))),
              width: 1080,
              height: 1350,
            });
          }
          if (
            platform === 'instagram' &&
            new Set(
              outputs
                .filter((o) => o.file.startsWith('instagram/'))
                .map((o) => o.sha256)
            ).size !== 3
          )
            throw new Error('カルーセル3枚が異なる内容になっていません');
          const facts =
            card.kind === 'tile-change'
              ? `${card.beforeYear}→${card.afterYear}年。${card.summary}。全47県を地図に。`
              : kind === 'rank-routes' && card.kind === 'rank-routes'
              ? `${card.routes[0].name}：${card.beforeYear}${card.routes[0].before.rank}位 → ${card.afterYear}${card.routes[0].after.rank}位。`
              : card.kind === 'household-receipt'
                ? `${card.period}の消費支出は${card.total.toLocaleString('ja-JP')}円。`
                : '人口・面積・世帯数・森林面積割合を一枚に。';
          const caption =
            platform === 'x'
              ? `${card.title.replaceAll('\n', '')}\n${facts}\n\n{{url}}\n\n#統計 #地域 #暮らし`
              : `${card.title.replaceAll('\n', '')}\n${facts}\n${card.scope}\n\n出典：${card.sources.map((s) => s.name).join('、')}\n${card.notes.join('\n')}\n\n保存して見比べよう。詳しくはプロフィールのリンクから。\n\n#統計 #地域 #暮らし #都道府県 #データ #日本 #地域比較 #stats47`;
          writeFileSync(join(generated, platform, 'caption.txt'), caption);
          if (platform === 'x') {
            const draft = {
              key: card.key,
              domain: kind,
              template: kind,
              imageKind: kind,
              caption,
              mediaPath: relative(
                ROOT,
                join(out, 'x/stills', `${card.key}.png`)
              ),
              canonicalUrl: `${SITE_ORIGIN}${card.canonicalPath}`,
              campaign: card.key,
              metricKeys: card.metricKeys,
            };
            writeFileSync(
              join(generated, 'x/draft.json'),
              JSON.stringify([draft], null, 2)
            );
          }
        }
      } finally {
        await browser.close({ silent: true });
      }
    }
    writeFileSync(
      join(generated, 'manifest.json'),
      JSON.stringify(
        {
          schemaVersion: 1,
          status: opts['prepare-only'] ? 'prepared' : 'rendered',
          generatedAt: new Date().toISOString(),
          kind,
          key: card.key,
          request: opts,
          sources: sourceFiles.toSorted((a, b) => a.key.localeCompare(b.key)),
          originalSources: card.sources,
          propsSha256: sha256(readFileSync(join(generated, 'props.json'))),
          selection:
            card.kind === 'tile-change'
              ? { population: 47, before: card.beforeYear, after: card.afterYear, calculation: '(after/before-1)*100' }
              : card.kind === 'rank-routes'
              ? {
                  areas: card.routes.map((r) => r.code),
                  population: 47,
                  direction: card.direction,
                  before: card.beforeYear,
                  after: card.afterYear,
                }
              : { area: opts.area, metrics: card.metricKeys },
          notes: card.notes,
          outputs,
        },
        null,
        2
      )
    );
    mkdirSync(dirname(out), { recursive: true });
    cpSync(generated, out, {
      recursive: true,
      errorOnExist: true,
      force: false,
    });
    console.log(
      JSON.stringify(
        {
          out,
          kind,
          key: card.key,
          outputs: outputs.map((o) => o.file),
          status: opts['prepare-only'] ? 'prepared' : 'rendered',
        },
        null,
        2
      )
    );
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
}
// Dedicated CLI: all writes and browser/temp cleanup finish before exiting.
// Remotion's bundler can keep its worker service alive after the result is saved.
main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
);
