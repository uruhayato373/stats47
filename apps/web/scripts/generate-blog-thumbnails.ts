#!/usr/bin/env tsx
/**
 * staged blog article から、fingerprint が変わった画像 bundle だけを生成する。
 *
 * 入力: `.local/r2/app/blog/<slug>/article.md`
 * 出力: `.local/image-staging/blog/<R2 key>`
 * plan: `.local/image-generation-publish-plan-blog.json`
 *
 * R2 反映は必ず `push-generated-image-set.ts --plan ...` を使う。記事の
 * prefix push と画像 staging を分離し、古い画像や部分生成物の混入を防ぐ。
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';

import { createS3ImageObjectStoreFromEnv } from '@stats47/r2-storage/image-pipeline';
import { config as loadEnv } from 'dotenv';

import { OGP_MODEL, OGP_PROMPT_VERSION } from './data/blog-ogp-visual-catalog';
import {
  BLOG_IMAGE_GENERATOR_SPEC,
  blogRendererSources,
} from './data/image-generator-registry';
import {
  parseBlogArticleImageContext,
  resolveArticleBackgroundSource,
} from './lib/blog-article-background';
import { resolveCodexBackgroundSource } from './lib/blog-codex-background-workflow';
import {
  BLOG_IMAGE_PUBLISH_PLAN,
  BLOG_IMAGE_STAGE_ROOT,
  adoptLegacyAiBackgroundSha256,
  blogImageKeys,
  createBlogImagePlan,
  stageBlogImagePath,
  writeBlogImageManifest,
  type BlogBackgroundMetadata,
  type BlogImageData,
  type BlogImageMetadata,
} from './lib/blog-image-generation';
import {
  computeLegacyPromptHashV1,
  computePromptHash,
  parseOgpVisualFrontmatter,
  resolveOgpVisual,
} from './lib/blog-ogp-visual';
import {
  deriveOgpFromFrontmatter,
  parseFrontmatter,
} from './lib/blog-thumbnail-render';
import {
  calculateRendererHash,
  createImageGenerationPublishPlan,
  selectChangedImageBatch,
  sha256,
  type ImageGenerationPlan,
  type ImageGenerationStatus,
} from './lib/image-generation-manifest';
import { createImageGenerationInspector } from './lib/image-generation-r2-inspector';

const PUBLIC_URL =
  process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp';
const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, '../../..');
const CONCURRENCY = 6;
loadEnv({ path: join(PROJECT_ROOT, '.env.local') });
const R2_STORE = createS3ImageObjectStoreFromEnv();

interface CliOptions {
  slugs: string[] | null;
  force: boolean;
  audit: boolean;
  limit: number | null;
  maxGenerate: number | null;
}

function readNumberArg(args: string[], flag: string): number | null {
  const index = args.indexOf(flag);
  if (index < 0) return null;
  const parsed = Number(args[index + 1]);
  if (!Number.isSafeInteger(parsed) || parsed < 1) {
    throw new Error(`${flag} は1以上の整数で指定してください`);
  }
  return parsed;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const slugIndex = args.indexOf('--slug');
  const rawSlugs = slugIndex >= 0 ? args[slugIndex + 1] : null;
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
  return {
    slugs,
    force,
    audit: args.includes('--audit'),
    limit: readNumberArg(args, '--limit'),
    maxGenerate: readNumberArg(args, '--max-generate'),
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

function readBlogData(
  directory: string
): { data: BlogImageData; markdown: string } | null {
  const articlePath = join(directory, 'article.md');
  if (existsSync(articlePath)) {
    const markdown = readFileSync(articlePath, 'utf8');
    const derived = deriveOgpFromFrontmatter(parseFrontmatter(markdown));
    if (derived) {
      return {
        data: {
          title: derived.title,
          subtitle: derived.subtitle ?? null,
        },
        markdown,
      };
    }
  }
  const legacyPath = join(directory, 'ogp/ogp.json');
  if (!existsSync(legacyPath)) return null;
  try {
    const legacy = JSON.parse(readFileSync(legacyPath, 'utf8')) as {
      title?: unknown;
      subtitle?: unknown;
    };
    const data =
      typeof legacy.title === 'string'
        ? {
            title: legacy.title,
            subtitle:
              typeof legacy.subtitle === 'string' ? legacy.subtitle : null,
          }
        : null;
    return data ? { data, markdown: '' } : null;
  } catch {
    return null;
  }
}

interface ReusableAiBackground {
  buffer: Buffer;
  metadata: BlogBackgroundMetadata & { source: 'ai' };
}

interface RemoteObjectIdentity {
  body: Buffer;
  etag: string | null;
}

async function readRemoteObjectWithIdentity(
  key: string
): Promise<RemoteObjectIdentity | null> {
  if (R2_STORE) {
    const object = await R2_STORE.get(key);
    return object ? { body: object.body, etag: object.etag } : null;
  }
  let response: Response;
  try {
    const url = new URL(`${PUBLIC_URL}/${key}`);
    url.searchParams.set('stats47-read', Date.now().toString(36));
    response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new Error(`R2 fetch failed: ${key}: ${String(error)}`);
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`R2 fetch failed: ${key}: HTTP ${response.status}`);
  }
  return {
    body: Buffer.from(await response.arrayBuffer()),
    etag: response.headers.get('etag'),
  };
}

async function readRemoteObject(key: string): Promise<Buffer | null> {
  return (await readRemoteObjectWithIdentity(key))?.body ?? null;
}

async function readRemoteShaMetadata(key: string): Promise<string | null> {
  if (R2_STORE) {
    return (await R2_STORE.head(key))?.metadata['stats47-sha256'] ?? null;
  }
  let response: Response;
  try {
    response = await fetch(`${PUBLIC_URL}/${key}`, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });
  } catch (error) {
    throw new Error(`R2 HEAD failed: ${key}: ${String(error)}`);
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`R2 HEAD failed: ${key}: HTTP ${response.status}`);
  }
  return response.headers.get('x-amz-meta-stats47-sha256');
}

function backgroundRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const root = value as Record<string, unknown>;
  const metadata =
    root.metadata && typeof root.metadata === 'object'
      ? (root.metadata as Record<string, unknown>)
      : root;
  return metadata.background &&
    typeof metadata.background === 'object' &&
    !Array.isArray(metadata.background)
    ? (metadata.background as Record<string, unknown>)
    : null;
}

async function readReusableAiBackground(options: {
  slug: string;
  markdown: string;
  title: string;
}): Promise<ReusableAiBackground | null> {
  const keys = blogImageKeys(options.slug);
  const visual = resolveOgpVisual(parseOgpVisualFrontmatter(options.markdown));
  const articleSource = options.markdown
    ? await resolveArticleBackgroundSource(
        PROJECT_ROOT,
        parseBlogArticleImageContext(options.slug, options.markdown)
      )
    : null;
  const legacyCodexSource = await resolveCodexBackgroundSource(
    PROJECT_ROOT,
    options.slug
  );
  const codexSource = articleSource ?? legacyCodexSource;
  if (codexSource) {
    return {
      buffer: codexSource.buffer,
      metadata: {
        source: 'ai',
        promptHash: codexSource.promptHash,
        sha256: codexSource.sha256,
        model: codexSource.model,
        promptVersion: codexSource.promptVersion,
        visualType: visual.visualType,
        motif: codexSource.motif,
      },
    };
  }
  let background: Record<string, unknown> | null = null;
  let declaredAssetSha: string | null = null;
  let backgroundSource: 'common' | 'legacy' | null = null;
  for (const key of [keys.manifest, `app/blog/${options.slug}/ogp/ogp.json`]) {
    const body = await readRemoteObject(key);
    if (!body) continue;
    try {
      const parsed = JSON.parse(body.toString('utf8')) as unknown;
      background = backgroundRecord(parsed);
      if (background) {
        backgroundSource = key === keys.manifest ? 'common' : 'legacy';
      }
      if (
        key === keys.manifest &&
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed)
      ) {
        const assets = Array.isArray((parsed as { assets?: unknown }).assets)
          ? (parsed as { assets: unknown[] }).assets
          : [];
        const asset = assets.find(
          (candidate) =>
            candidate &&
            typeof candidate === 'object' &&
            (candidate as { key?: unknown }).key === keys.background
        ) as { sha256?: unknown } | undefined;
        declaredAssetSha =
          typeof asset?.sha256 === 'string' ? asset.sha256 : null;
      }
    } catch {
      throw new Error(`${options.slug}: remote blog image metadata が不正です`);
    }
    if (background) break;
  }
  if (background?.source !== 'ai') return null;
  if (typeof background.promptHash !== 'string') {
    throw new Error(`${options.slug}: AI背景のpromptHashがありません`);
  }
  if (backgroundSource === 'common' && typeof background.sha256 !== 'string') {
    throw new Error(`${options.slug}: AI背景のSHAがmetadataにありません`);
  }
  if (backgroundSource === 'common' && declaredAssetSha === null) {
    throw new Error(
      `${options.slug}: 共通manifestにAI背景assetのSHAがありません`
    );
  }
  if (declaredAssetSha !== null && declaredAssetSha !== background.sha256) {
    throw new Error(
      `${options.slug}: AI背景SHAが共通manifestのasset契約と一致しません`
    );
  }
  const promptArgs = { ...visual, title: options.title };
  const promptHash = computePromptHash(promptArgs);
  const legacyPromptHash = computeLegacyPromptHashV1(promptArgs);
  if (
    background.promptHash !== promptHash &&
    background.promptHash !== legacyPromptHash
  ) {
    throw new Error(
      `${options.slug}: 記事変更によりAI背景promptが変わりました。` +
        'generate-blog-thumbnails-cloud.ts --ai-background --slug で明示再生成してください'
    );
  }
  const remoteBackground = await readRemoteObjectWithIdentity(keys.background);
  if (!remoteBackground)
    throw new Error(`${options.slug}: AI背景画像がありません`);
  const digest = sha256(remoteBackground.body);
  const declaredSha =
    typeof background.sha256 === 'string'
      ? background.sha256
      : backgroundSource === 'legacy'
        ? adoptLegacyAiBackgroundSha256(
            remoteBackground.body,
            remoteBackground.etag
          )
        : null;
  if (declaredSha !== digest) {
    throw new Error(`${options.slug}: AI背景SHAがmetadataと一致しません`);
  }
  const remoteSha = await readRemoteShaMetadata(keys.background);
  if (
    (backgroundSource === 'common' && remoteSha !== digest) ||
    (remoteSha !== null && remoteSha !== digest)
  ) {
    throw new Error(`${options.slug}: AI背景SHAがHEAD metadataと一致しません`);
  }
  return {
    buffer: remoteBackground.body,
    metadata: {
      source: 'ai',
      promptHash,
      sha256: digest,
      model: OGP_MODEL,
      promptVersion: OGP_PROMPT_VERSION,
      visualType: visual.visualType,
      motif: visual.motif,
    },
  };
}

function outputFiles(plan: ImageGenerationPlan): Map<string, string> {
  return new Map(
    plan.assets.map((asset) => [
      asset.key,
      stageBlogImagePath(PROJECT_ROOT, plan, asset.key),
    ])
  );
}

async function main(): Promise<void> {
  const options = parseArgs();
  const blogRoot =
    process.env.BLOG_DIR ?? join(PROJECT_ROOT, '.local/r2/app/blog');
  const planPath = join(PROJECT_ROOT, BLOG_IMAGE_PUBLISH_PLAN);
  const stageRoot = join(PROJECT_ROOT, BLOG_IMAGE_STAGE_ROOT);
  rmSync(planPath, { force: true });
  rmSync(stageRoot, { recursive: true, force: true });

  if (!existsSync(blogRoot)) {
    throw new Error(`blog staging がありません: ${blogRoot}`);
  }
  const available = readdirSync(blogRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
  const slugs = options.slugs
    ? options.slugs.filter((slug) => available.includes(slug))
    : available;
  if (options.slugs && slugs.length !== options.slugs.length) {
    const missing = options.slugs.filter((slug) => !available.includes(slug));
    throw new Error(
      `blog staging に対象 slug がありません: ${missing.join(', ')}`
    );
  }

  const aiRendererHash = calculateRendererHash(
    PROJECT_ROOT,
    blogRendererSources('ai')
  );
  const inspector = createImageGenerationInspector(PUBLIC_URL);
  const prepared = await pMap(slugs, async (slug) => {
    const source = readBlogData(join(blogRoot, slug));
    if (!source) return null;
    const background = source.markdown
      ? await readReusableAiBackground({
          slug,
          markdown: source.markdown,
          title: source.data.title,
        })
      : null;
    if (!background) {
      throw new Error(
        `${slug}: 記事固有背景がありません。` +
          'blog-images:codex request-article で生成してください'
      );
    }
    return {
      slug,
      data: source.data,
      background,
      plan: createBlogImagePlan({
        slug,
        data: source.data,
        background: {
          source: 'ai',
          promptHash: background.metadata.promptHash,
          sha256: background.metadata.sha256,
        },
        rendererHash: aiRendererHash,
      }),
    };
  });
  const unavailable = prepared.filter((entry) => entry === null).length;
  if (unavailable > 0) {
    throw new Error(`${unavailable}件の記事からOGP titleを導出できません`);
  }
  const items = prepared.filter(
    (entry): entry is NonNullable<typeof entry> => entry !== null
  );
  const checked = await pMap(items, async (item) => ({
    item,
    status: await inspector.inspect(item.plan),
  }));
  const probeErrors = checked.filter(
    ({ status }) => status.reason === 'probe-error'
  );
  if (probeErrors.length > 0) {
    throw new Error(
      `R2 freshness probe が${probeErrors.length}件失敗したため中止します`
    );
  }
  const changed = options.force
    ? checked
    : checked.filter(({ status }) => !status.isCurrent);

  if (options.audit) {
    console.log(
      `blog画像監査: 全${items.length}件 / 更新必要${changed.length}件`
    );
    for (const { item, status } of changed.slice(0, 30)) {
      console.log(`  [${status.reason}] ${item.slug}`);
    }
    if (changed.length > 0) process.exitCode = 1;
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

  const { loadFonts } = await import('./lib/blog-thumbnail-render');
  const { renderBlogImageBundle } = await import('./lib/blog-image-render');
  const fonts = loadFonts(PROJECT_ROOT);
  const failures: Array<{ slug: string; error: unknown }> = [];
  const generatedManifests = new Map<
    string,
    ReturnType<typeof writeBlogImageManifest>
  >();
  await pMap(targets, async ({ item }) => {
    try {
      const files = outputFiles(item.plan);
      const keys = blogImageKeys(item.slug);
      const metadata: BlogImageMetadata = {
        title: item.data.title,
        subtitle: item.data.subtitle,
        background: item.background.metadata,
      };
      await renderBlogImageBundle({
        data: item.data,
        fonts,
        outputs: {
          light: files.get(keys.light)!,
          dark: files.get(keys.dark)!,
          ogp: files.get(keys.ogp)!,
          ...(item.background
            ? { background: files.get(keys.background)! }
            : {}),
        },
        aiBackground: {
          buffer: item.background.buffer,
          sha256: item.background.metadata.sha256,
        },
      });
      const manifest = writeBlogImageManifest({
        projectRoot: PROJECT_ROOT,
        plan: item.plan,
        assetFiles: files,
        metadata,
      });
      generatedManifests.set(item.slug, manifest);
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

  const statusBySlug = new Map<string, ImageGenerationStatus>(
    checked.map(({ item, status }) => [item.slug, status])
  );
  const publishPlan = createImageGenerationPublishPlan({
    generator: BLOG_IMAGE_GENERATOR_SPEC.generator,
    stageRoot: BLOG_IMAGE_STAGE_ROOT,
    items: targets.map(({ item }) => ({
      plan: item.plan,
      manifest: generatedManifests.get(item.slug)!,
      expectedRemoteFingerprint:
        statusBySlug.get(item.slug)?.remoteFingerprint ?? null,
      expectedRemoteManifestSha256:
        statusBySlug.get(item.slug)?.remoteManifestSha256 ?? null,
    })),
  });
  writeFileSync(planPath, `${JSON.stringify(publishPlan, null, 2)}\n`);
  console.log(
    `blog画像生成: ${targets.length}件 / plan=${BLOG_IMAGE_PUBLISH_PLAN}`
  );
}

main().catch((error) => {
  console.error(
    `Fatal: ${error instanceof Error ? error.message : String(error)}`
  );
  process.exit(1);
});
