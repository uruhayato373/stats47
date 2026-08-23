#!/usr/bin/env tsx
/**
 * R2 上の公開記事を入力に、変更された blog image bundle だけを生成する。
 *
 * - semantic input + renderer + output contract の fingerprint が一致した bundle は skip
 * - AI背景は promptHash + 背景SHA を別管理し、renderer変更時は既存背景を再利用
 * - 404 だけを欠落と扱い、timeout / 5xx / invalid JSON は fail-closed
 * - R2へ直接書かず exact publish plan を出力
 *
 * R2反映:
 *   npx tsx packages/r2-storage/src/scripts/push-generated-image-set.ts \
 *     --plan .local/image-generation-publish-plan-blog.json
 */

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import {
  createS3ImageObjectStoreFromEnv,
  type ImageObjectStore,
} from '@stats47/r2-storage/image-pipeline';
import dotenv from 'dotenv';

import { BLOG_CODEX_BACKGROUND_BY_SLUG } from './data/blog-codex-background-catalog';
import {
  BLOG_AI_BACKGROUND_NORMALIZER_SOURCES,
  BLOG_IMAGE_GENERATOR_SPEC,
  blogRendererSources,
} from './data/image-generator-registry';
import {
  computeAiBackgroundCacheFingerprint,
  createAiBackgroundCache,
  readPublishedBackgroundState,
  resolveCachedAiBackground,
  type AiBackgroundCache,
} from './lib/blog-ai-background-cache';
import { normalizeAiBackgroundBuffer } from './lib/blog-ai-background-normalizer';
import {
  parseBlogArticleImageContext,
  resolveArticleBackgroundSource,
} from './lib/blog-article-background';
import { resolveCodexBackgroundSource } from './lib/blog-codex-background-workflow';
import {
  BLOG_IMAGE_PUBLISH_PLAN,
  BLOG_IMAGE_STAGE_ROOT,
  blogImageKeys,
  createBlogImagePlan,
  publishedBlogSlugsFromIndex,
  stageBlogImagePath,
  writeBlogImageManifest,
  type BlogBackgroundMetadata,
  type BlogImageData,
  type BlogImageMetadata,
} from './lib/blog-image-generation';
import {
  calculateRendererHash,
  createImageGenerationPublishPlan,
  selectChangedImageBatch,
  sha256,
  type ImageGenerationPlan,
  type ImageGenerationStatus,
} from './lib/image-generation-manifest';
import { createImageGenerationInspector } from './lib/image-generation-r2-inspector';

dotenv.config({ path: '.env.local' });

const PUBLIC_URL =
  process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp';
const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, '../../..');
const CONCURRENCY = 8;

interface CliOptions {
  audit: boolean;
  force: boolean;
  slugs: string[] | null;
  aiBackground: boolean;
  visualTypeOverride: string | null;
  limit: number | null;
  maxGenerate: number | null;
  maxAttempts: number;
  budgetUsd: number;
  outDir: string | null;
}

interface AiDescriptor {
  prompt: string;
  promptHash: string;
  legacyPromptHash: string | null;
  model: string;
  promptVersion: string;
  visualType: import('@stats47/types').OgpVisualType;
  motif: string;
}

interface ResolvedAiBackground {
  location: 'published' | 'cache' | 'codex';
  cacheFingerprint: string | null;
  metadata: BlogBackgroundMetadata & { source: 'ai' };
  buffer?: Buffer;
}

interface PreparedBlogImage {
  slug: string;
  data: BlogImageData;
  ai: AiDescriptor;
  plan: ImageGenerationPlan | null;
  status: ImageGenerationStatus | null;
  background: ResolvedAiBackground | null;
  needsAiGeneration: boolean;
}

function stringArg(args: string[], flag: string): string | null {
  const index = args.indexOf(flag);
  return index >= 0 ? (args[index + 1] ?? null) : null;
}

function positiveNumberArg(
  args: string[],
  flag: string,
  fallback: number
): number {
  const raw = stringArg(args, flag);
  if (raw === null) return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`${flag} は0より大きい数値で指定してください`);
  }
  return value;
}

function positiveIntegerArg(args: string[], flag: string): number | null {
  const raw = stringArg(args, flag);
  if (raw === null) return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1) {
    throw new Error(`${flag} は1以上の整数で指定してください`);
  }
  return value;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  if (args.includes('--apply')) {
    throw new Error(
      '--apply は廃止しました。生成後に exact plan publisher を実行してください'
    );
  }
  const rawSlugs = stringArg(args, '--slug');
  const slugs = rawSlugs
    ? rawSlugs
        .split(',')
        .map((slug) => slug.trim())
        .filter(Boolean)
    : null;
  if (slugs?.some((slug) => !/^[a-z0-9][a-z0-9-]*$/.test(slug))) {
    throw new Error('--slug に不正な値が含まれています');
  }
  const force = args.includes('--force');
  if (force && !slugs) {
    throw new Error('--force は必ず --slug と組み合わせてください');
  }
  if (args.includes('--force-background')) {
    throw new Error(
      '--force-background は廃止しました。AI背景を更新する場合は' +
        'prompt/catalog/normalizerのSSOTを変更してください'
    );
  }
  const outDir = stringArg(args, '--out-dir');
  if (
    outDir &&
    (!outDir.startsWith('.local/') || outDir.split('/').includes('..'))
  ) {
    throw new Error('--out-dir は .local/ 配下を指定してください');
  }
  return {
    audit: args.includes('--audit'),
    force,
    slugs,
    aiBackground: args.includes('--ai-background'),
    visualTypeOverride: stringArg(args, '--visual-type'),
    limit: positiveIntegerArg(args, '--limit'),
    maxGenerate: positiveIntegerArg(args, '--max-generate'),
    maxAttempts: Math.min(positiveIntegerArg(args, '--max-attempts') ?? 2, 3),
    budgetUsd: positiveNumberArg(args, '--budget-usd', 2),
    outDir,
  };
}

async function pMap<T, R>(
  items: readonly T[],
  worker: (item: T) => Promise<R>,
  concurrency = CONCURRENCY
): Promise<R[]> {
  const output: R[] = [];
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor++;
      output[index] = await worker(items[index]);
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, run)
  );
  return output;
}

async function fetchRequired(url: string): Promise<Response> {
  let response: Response;
  try {
    response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new Error(`R2 fetch failed: ${url}: ${String(error)}`);
  }
  if (!response.ok) {
    throw new Error(`R2 fetch failed: ${url}: HTTP ${response.status}`);
  }
  return response;
}

async function listAllSlugs(): Promise<string[]> {
  const response = await fetchRequired(`${PUBLIC_URL}/app/blog/all.json`);
  const json = (await response.json()) as unknown;
  return publishedBlogSlugsFromIndex(json);
}

function makeAiMetadata(
  descriptor: AiDescriptor,
  backgroundSha: string
): BlogBackgroundMetadata & { source: 'ai' } {
  return {
    source: 'ai',
    promptHash: descriptor.promptHash,
    sha256: backgroundSha,
    model: descriptor.model,
    promptVersion: descriptor.promptVersion,
    visualType: descriptor.visualType,
    motif: descriptor.motif,
  };
}

async function loadAiBackground(options: {
  item: PreparedBlogImage;
  store: ImageObjectStore | null;
  cache: AiBackgroundCache;
}): Promise<Buffer> {
  const background = options.item.background;
  if (!background) {
    throw new Error(`${options.item.slug}: AI背景referenceがありません`);
  }
  if (background.location === 'codex') {
    if (
      !background.buffer ||
      sha256(background.buffer) !== background.metadata.sha256
    ) {
      throw new Error(
        `${options.item.slug}: Codex背景assetのSHAがplan確定後に不整合になりました`
      );
    }
    return background.buffer;
  }
  if (!options.store) {
    throw new Error(`${options.item.slug}: AI背景のR2検証資格情報がありません`);
  }
  if (!background.cacheFingerprint) {
    throw new Error(
      `${options.item.slug}: AI背景cache fingerprintがありません`
    );
  }
  if (background.location === 'cache') {
    const cached = await options.cache.read(background.cacheFingerprint);
    if (!cached || cached.sha256 !== background.metadata.sha256) {
      throw new Error(
        `${options.item.slug}: AI背景cacheがplan確定後に不整合になりました`
      );
    }
    return cached.buffer;
  }
  const published = await readPublishedBackgroundState({
    store: options.store,
    slug: options.item.slug,
    descriptor: options.item.ai,
  });
  if (
    published.source !== 'ai' ||
    !published.reusable ||
    published.reusable.sha256 !== background.metadata.sha256
  ) {
    throw new Error(
      `${options.item.slug}: 公開AI背景がplan確定後に変更されました`
    );
  }
  return published.reusable.buffer;
}

function assetFiles(
  plan: ImageGenerationPlan,
  root: string | null,
  slug: string
): Map<string, string> {
  if (!root) {
    return new Map(
      plan.assets.map((asset) => [
        asset.key,
        stageBlogImagePath(PROJECT_ROOT, plan, asset.key),
      ])
    );
  }
  const keys = blogImageKeys(slug);
  const localByKey = new Map<string, string>([
    [keys.light, join(root, slug, 'thumbnail-light.webp')],
    [keys.dark, join(root, slug, 'thumbnail-dark.webp')],
    [keys.ogp, join(root, slug, 'ogp/ogp.png')],
    [keys.background, join(root, slug, 'ogp/background.jpg')],
  ]);
  const files = new Map<string, string>();
  for (const asset of plan.assets) {
    const path = localByKey.get(asset.key);
    if (!path)
      throw new Error(`pilot output mapping がありません: ${asset.key}`);
    mkdirSync(join(path, '..'), { recursive: true });
    files.set(asset.key, path);
  }
  return files;
}

async function main(): Promise<void> {
  const options = parseArgs();
  const store = createS3ImageObjectStoreFromEnv();
  const isCodexPilot =
    Boolean(options.outDir) &&
    Boolean(options.slugs) &&
    options.slugs!.every(
      (slug) => BLOG_CODEX_BACKGROUND_BY_SLUG[slug] !== undefined
    );
  if (!store && !isCodexPilot) {
    throw new Error(
      'blog画像の既存背景検証にはR2 S3資格情報が必要です。' +
        '公開custom domainのHEAD metadataへはfallbackしません。' +
        '例外は --out-dir + Codex catalog登録済みの明示slugだけです'
    );
  }
  const planPath = join(PROJECT_ROOT, BLOG_IMAGE_PUBLISH_PLAN);
  const stageRoot = join(PROJECT_ROOT, BLOG_IMAGE_STAGE_ROOT);
  rmSync(planPath, { force: true });
  rmSync(stageRoot, { recursive: true, force: true });

  const { deriveOgpFromFrontmatter, parseFrontmatter } =
    await import('./lib/blog-thumbnail-render');
  const {
    buildOgpPrompt,
    computeLegacyPromptHashV1,
    computePromptHash,
    parseOgpVisualFrontmatter,
    resolveOgpVisual,
  } = await import('./lib/blog-ogp-visual');
  const {
    isValidVisualType,
    OGP_MODEL,
    OGP_PRICE_PER_IMAGE_USD,
    OGP_PROMPT_VERSION,
  } = await import('./data/blog-ogp-visual-catalog');
  if (
    options.visualTypeOverride &&
    !isValidVisualType(options.visualTypeOverride)
  ) {
    throw new Error(`--visual-type が不正です: ${options.visualTypeOverride}`);
  }

  const slugs = options.slugs ?? (await listAllSlugs());
  const baseRendererHash = calculateRendererHash(
    PROJECT_ROOT,
    blogRendererSources('ai')
  );
  const normalizerHash = calculateRendererHash(
    PROJECT_ROOT,
    BLOG_AI_BACKGROUND_NORMALIZER_SOURCES
  );
  const backgroundCache = createAiBackgroundCache({
    projectRoot: PROJECT_ROOT,
    store,
  });
  const inspector = createImageGenerationInspector(PUBLIC_URL);
  console.log(
    `blog画像候補=${slugs.length} renderer=${baseRendererHash.slice(0, 12)} ` +
      `inspector=${inspector.mode}`
  );

  const prepared = await pMap(
    slugs,
    async (slug): Promise<PreparedBlogImage> => {
      const response = await fetchRequired(
        `${PUBLIC_URL}/app/blog/${slug}/article.md`
      );
      const markdown = await response.text();
      const derived = deriveOgpFromFrontmatter(parseFrontmatter(markdown));
      if (!derived)
        throw new Error(`${slug}: article frontmatter title がありません`);
      const data: BlogImageData = {
        title: derived.title,
        subtitle: derived.subtitle ?? null,
      };
      const visual = resolveOgpVisual({
        ...parseOgpVisualFrontmatter(markdown),
        ...(options.visualTypeOverride
          ? { ogpVisualType: options.visualTypeOverride }
          : {}),
      });
      const articleSource = await resolveArticleBackgroundSource(
        PROJECT_ROOT,
        parseBlogArticleImageContext(slug, markdown)
      );
      const legacyCodexSource = await resolveCodexBackgroundSource(
        PROJECT_ROOT,
        slug
      );
      const codexSource = articleSource ?? legacyCodexSource;
      const ai: AiDescriptor = codexSource
        ? {
            prompt: codexSource.prompt,
            promptHash: codexSource.promptHash,
            legacyPromptHash: null,
            model: codexSource.model,
            promptVersion: codexSource.promptVersion,
            visualType: visual.visualType,
            motif: codexSource.motif,
          }
        : {
            prompt: buildOgpPrompt({ ...visual, title: data.title }),
            promptHash: computePromptHash({ ...visual, title: data.title }),
            legacyPromptHash: computeLegacyPromptHashV1({
              ...visual,
              title: data.title,
            }),
            model: OGP_MODEL,
            promptVersion: OGP_PROMPT_VERSION,
            visualType: visual.visualType,
            motif: visual.motif,
          };
      if (codexSource) {
        const background: ResolvedAiBackground = {
          location: 'codex',
          cacheFingerprint: null,
          metadata: makeAiMetadata(ai, codexSource.sha256),
          buffer: codexSource.buffer,
        };
        const plan = createBlogImagePlan({
          slug,
          data,
          background: {
            source: 'ai',
            promptHash: background.metadata.promptHash,
            sha256: background.metadata.sha256,
          },
          rendererHash: baseRendererHash,
        });
        const status = await inspector.inspect(plan);
        if (status.reason === 'probe-error') {
          throw new Error(`${slug}: R2 freshness probe に失敗しました`);
        }
        return {
          slug,
          data,
          ai,
          plan,
          status,
          background,
          needsAiGeneration: false,
        };
      }
      if (!store) {
        throw new Error(`${slug}: 既存AI背景のR2検証資格情報がありません`);
      }
      const cacheFingerprint = computeAiBackgroundCacheFingerprint({
        prompt: ai.prompt,
        promptHash: ai.promptHash,
        model: ai.model,
        promptVersion: ai.promptVersion,
        normalizerHash,
      });
      const published = await readPublishedBackgroundState({
        store,
        slug,
        descriptor: ai,
      });
      const remoteWasAi = published.source === 'ai';
      const publishedReusable = published.reusable;
      const cached =
        !publishedReusable && (options.aiBackground || remoteWasAi)
          ? await backgroundCache.read(cacheFingerprint)
          : null;
      const reusableSha = publishedReusable?.sha256 ?? cached?.sha256 ?? null;
      const reusableLocation = publishedReusable
        ? 'published'
        : cached
          ? 'cache'
          : null;

      if (!options.aiBackground && remoteWasAi && !reusableSha) {
        throw new Error(
          `${slug}: AI背景のpromptまたは画像が陳腐化しています。` +
            '--ai-background --slug で明示再生成してください'
        );
      }
      const needsAiGeneration = options.aiBackground && !reusableSha;
      const background: ResolvedAiBackground | null =
        reusableSha && reusableLocation
          ? {
              location: reusableLocation,
              cacheFingerprint,
              metadata: makeAiMetadata(ai, reusableSha),
            }
          : null;
      if (!background && !needsAiGeneration) {
        throw new Error(
          `${slug}: 記事固有背景がありません。` +
            'blog-images:codex request-article で生成してください'
        );
      }
      const plan = needsAiGeneration
        ? null
        : createBlogImagePlan({
            slug,
            data,
            background: {
              source: 'ai',
              promptHash: background!.metadata.promptHash,
              sha256: background!.metadata.sha256,
            },
            rendererHash: baseRendererHash,
          });
      const status = plan ? await inspector.inspect(plan) : null;
      if (status?.reason === 'probe-error') {
        throw new Error(`${slug}: R2 freshness probe に失敗しました`);
      }
      return {
        slug,
        data,
        ai,
        plan,
        status,
        background,
        needsAiGeneration,
      };
    }
  );

  const changed = prepared.filter(
    (item) => item.needsAiGeneration || options.force || !item.status?.isCurrent
  );
  if (options.audit || (options.aiBackground && !options.slugs)) {
    console.log(
      `blog画像監査: 全${prepared.length}件 / 更新必要${changed.length}件 / ` +
        `AI背景生成必要${changed.filter((item) => item.needsAiGeneration).length}件`
    );
    for (const item of changed.slice(0, 30)) {
      console.log(
        `  [${item.needsAiGeneration ? 'ai-background-required' : (item.status?.reason ?? 'changed')}] ${item.slug}`
      );
    }
    if (options.audit && changed.length > 0) process.exitCode = 1;
    return;
  }

  const { targets, remaining } = selectChangedImageBatch(changed, options);
  if (targets.length === 0) {
    const emptyPlan = createImageGenerationPublishPlan({
      generator: BLOG_IMAGE_GENERATOR_SPEC.generator,
      stageRoot: BLOG_IMAGE_STAGE_ROOT,
      items: [],
    });
    writeFileSync(planPath, `${JSON.stringify(emptyPlan, null, 2)}\n`);
    console.log(
      `blog画像: fingerprint変更なし / plan=${BLOG_IMAGE_PUBLISH_PLAN}`
    );
    return;
  }
  if (remaining > 0) {
    console.log(`blog画像: 今回${targets.length}件 / 次回以降${remaining}件`);
  }

  const aiTargets = targets.filter((item) => item.needsAiGeneration);
  const estimatedCost = aiTargets.length * OGP_PRICE_PER_IMAGE_USD;
  if (estimatedCost > options.budgetUsd) {
    throw new Error(
      `AI背景${aiTargets.length}件の推定費用$${estimatedCost.toFixed(3)}が` +
        `予算$${options.budgetUsd.toFixed(3)}を超えています。部分生成せず中止します`
    );
  }
  const aiApiKey =
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? null;
  if (aiTargets.length > 0 && !aiApiKey) {
    throw new Error('AI背景生成には GEMINI_API_KEY が必要です');
  }

  if (aiTargets.length > 0) {
    const { generateBackgroundImage } =
      await import('./lib/gemini-image-client');
    for (const item of aiTargets) {
      const cacheFingerprint = computeAiBackgroundCacheFingerprint({
        prompt: item.ai.prompt,
        promptHash: item.ai.promptHash,
        model: item.ai.model,
        promptVersion: item.ai.promptVersion,
        normalizerHash,
      });
      const cached = await resolveCachedAiBackground({
        cache: backgroundCache,
        fingerprint: cacheFingerprint,
        generate: async () =>
          (
            await generateBackgroundImage({
              prompt: item.ai.prompt,
              apiKey: aiApiKey!,
              maxAttempts: options.maxAttempts,
            })
          ).buffer,
        normalize: (input) => normalizeAiBackgroundBuffer(input, false),
      });
      item.background = {
        location: 'cache',
        cacheFingerprint,
        metadata: makeAiMetadata(item.ai, cached.sha256),
      };
      item.plan = createBlogImagePlan({
        slug: item.slug,
        data: item.data,
        background: {
          source: 'ai',
          promptHash: item.ai.promptHash,
          sha256: cached.sha256,
        },
        rendererHash: baseRendererHash,
      });
      item.status = await inspector.inspect(item.plan);
      if (item.status.reason === 'probe-error') {
        throw new Error(`${item.slug}: AI生成後のR2 probeに失敗しました`);
      }
    }
  }

  const pilotRoot = options.outDir
    ? resolve(PROJECT_ROOT, options.outDir)
    : null;
  if (pilotRoot) rmSync(pilotRoot, { recursive: true, force: true });
  const { loadFonts } = await import('./lib/blog-thumbnail-render');
  const { renderBlogImageBundle } = await import('./lib/blog-image-render');
  const fonts = loadFonts(PROJECT_ROOT);
  const failures: Array<{ slug: string; error: unknown }> = [];
  const generatedManifests = new Map<
    string,
    ReturnType<typeof writeBlogImageManifest>
  >();

  await pMap(targets, async (item) => {
    try {
      if (!item.plan || !item.status) {
        throw new Error('generation plan が確定していません');
      }
      if (!item.background) {
        throw new Error(`${item.slug}: 記事固有背景がありません`);
      }
      const files = assetFiles(item.plan, pilotRoot, item.slug);
      const keys = blogImageKeys(item.slug);
      const metadata: BlogImageMetadata = {
        title: item.data.title,
        subtitle: item.data.subtitle,
        background: item.background.metadata,
      };
      const aiBackground = await loadAiBackground({
        item,
        store,
        cache: backgroundCache,
      });
      await renderBlogImageBundle({
        data: item.data,
        fonts,
        outputs: {
          light: files.get(keys.light)!,
          dark: files.get(keys.dark)!,
          ogp: files.get(keys.ogp)!,
          background: files.get(keys.background)!,
        },
        aiBackground: {
          buffer: aiBackground,
          sha256: item.background.metadata.sha256,
        },
      });
      if (pilotRoot) {
        const metadataPath = join(pilotRoot, item.slug, 'ogp/ogp.json');
        mkdirSync(join(metadataPath, '..'), { recursive: true });
        writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`);
      } else {
        const manifest = writeBlogImageManifest({
          projectRoot: PROJECT_ROOT,
          plan: item.plan,
          assetFiles: files,
          metadata,
        });
        generatedManifests.set(item.slug, manifest);
      }
      console.log(`  [generated] ${item.slug}`);
    } catch (error) {
      failures.push({ slug: item.slug, error });
    }
  });
  if (failures.length > 0) {
    throw new Error(
      `blog画像生成失敗: ${failures
        .map(({ slug, error }) => `${slug}=${String(error)}`)
        .join(' / ')}`
    );
  }

  if (pilotRoot) {
    console.log(`blog画像パイロット: ${targets.length}件 / ${options.outDir}`);
    return;
  }
  const publishPlan = createImageGenerationPublishPlan({
    generator: BLOG_IMAGE_GENERATOR_SPEC.generator,
    stageRoot: BLOG_IMAGE_STAGE_ROOT,
    items: targets.map((item) => ({
      plan: item.plan!,
      manifest: generatedManifests.get(item.slug)!,
      expectedRemoteFingerprint: item.status!.remoteFingerprint,
      expectedRemoteManifestSha256: item.status!.remoteManifestSha256,
    })),
  });
  writeFileSync(planPath, `${JSON.stringify(publishPlan, null, 2)}\n`);
  console.log(
    `blog画像生成: ${targets.length}件 / AI費用見込=$${estimatedCost.toFixed(3)} / ` +
      `plan=${BLOG_IMAGE_PUBLISH_PLAN}`
  );
}

main().catch((error) => {
  console.error(
    `Fatal: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
