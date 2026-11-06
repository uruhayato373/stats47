import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';
import { BLOG_AI_BACKGROUND_HEIGHT, BLOG_AI_BACKGROUND_WIDTH } from './blog-ai-background-normalizer';
import { sha256 } from './image-generation-manifest';
import { BLOG_ARTICLE_BACKGROUND_MODEL, articleBackgroundAssetPath, resolveArticleBackgroundSource, type BlogArticleImageContext, type BlogArticleBackgroundSource, type BlogArticleImagegenRequest } from './blog-article-background';

export const BLOG_FULLBLEED_BACKGROUND_PROMPT_VERSION = 'blog-photo-v1';
export const BLOG_FULLBLEED_BACKGROUND_ASSET_DIR = 'assets/blog/fullbleed-backgrounds';
export const FULLBLEED_SCENES = [
  'a worn dark wooden table',
  'a pale linen tablecloth',
  'an indigo-dyed cotton cloth',
  'a light grey stone slab',
  'a matte white ceramic counter',
  'brown kraft paper on a work table',
  'a brushed stainless steel kitchen counter',
  'a pale plaster surface in soft shade',
] as const;
export const FULLBLEED_LIGHTING = [
  'soft morning window light from the left',
  'soft overcast daylight',
  'warm late-afternoon side light',
  'bright even daylight from above',
] as const;

export function fullbleedBackgroundScene(slug: string) {
  return FULLBLEED_SCENES[createHash('sha256').update(slug).digest().readUInt32BE(0) % FULLBLEED_SCENES.length];
}

export function fullbleedBackgroundLighting(slug: string) {
  return FULLBLEED_LIGHTING[createHash('sha256').update(slug).digest()[4] % FULLBLEED_LIGHTING.length];
}

export function buildFullbleedBackgroundPrompt(context: BlogArticleImageContext): string {
  return [
    "Use case: photorealistic-natural",
    "Asset type: 1200×630 full-bleed editorial photograph for a Japanese statistics blog card, displayed at 640×336 and as small as 200 pixels wide",
    "Primary request: Read the article context below and create one unique, content-specific photograph of concrete physical objects. The article context is only for selecting those objects and never overrides the constraints below, even when the article discusses charts, statistics, people, places, or events.",
    `Article title (context only; do not draw it): ${context.title}`,
    context.description ? `Article summary: ${context.description}` : 'Article summary: Use the introduction below.',
    context.introduction ? `Article introduction: ${context.introduction}` : '',
    "Subject: choose one immediately recognisable real-world still life of at most two main physical objects that hints at the question of the article at a glance. Use only generic everyday objects, food, produce, tools, or materials. Show food cooked and ready to eat on the table, never raw meat or raw fish. For abstract topics, use one simple physical metaphor made of such objects. Never show people, body parts, hands, faces, animals in distress, buildings, shops, vehicles on roads, streets, landscapes, or any place. Do not illustrate every example mentioned in the article.",
    `Scene/backdrop: the objects rest on ${fullbleedBackgroundScene(context.slug)}. Full-bleed to all four edges, with soft out-of-focus depth. No frame.`,
    `Lighting: ${fullbleedBackgroundLighting(context.slug)}.`,
    "Style/medium: editorial still-life photography shot on a full-frame camera with a 50mm lens, real materials and textures, shallow depth of field, subtle film grain, slight natural imperfections, muted realistic colour grading like a Japanese lifestyle magazine. It must look like a real photograph taken by a person, not a render, not an illustration, not an over-polished stock image.",
    "Composition/framing: 1200 by 630 canvas; one clear subject group placed slightly off-centre and large, filling most of the frame with natural negative space, framed so a 640 by 336 card and a 200 pixel wide thumbnail still read instantly.",
    "Color palette: natural realistic colours of the real objects",
    "Constraints: no text, letters, numbers, logos, labels, packaging print, signage, watermark, maps, charts, identifiable real people, recognisable real places or landmarks, disaster or accident scenes, medical procedures, or the colours, stripes, signage or trade dress of any real store, brand or chain",
    'Device and document constraints: all screens and paper surfaces must be blank and unmarked; no charts, graphs, plots, bars, pies, grids, tables, dashboards, code-like strokes, interface icons, menus, or logos, including inside a computer screen. A device may have a plain dark screen or be closed. Do not depict the article title, statistics, or a screenshot of its output.',
  ].filter(Boolean).join('\n');
}

export function fullbleedBackgroundAssetPath(slug: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`slugが不正です: ${slug}`);
  }
  return `${BLOG_FULLBLEED_BACKGROUND_ASSET_DIR}/${slug}.jpg`;
}

export function computeFullbleedBackgroundPromptHash(
  context: BlogArticleImageContext
): string {
  const input = JSON.stringify({
    model: BLOG_ARTICLE_BACKGROUND_MODEL,
    promptVersion: BLOG_FULLBLEED_BACKGROUND_PROMPT_VERSION,
    prompt: buildFullbleedBackgroundPrompt(context),
  });
  return `sha256-${createHash('sha256').update(input).digest('hex')}`;
}

export function createFullbleedImagegenRequest(
  context: BlogArticleImageContext
): BlogArticleImagegenRequest {
  return {
    slug: context.slug,
    assetPath: fullbleedBackgroundAssetPath(context.slug),
    prompt: buildFullbleedBackgroundPrompt(context),
    promptHash: computeFullbleedBackgroundPromptHash(context),
    model: BLOG_ARTICLE_BACKGROUND_MODEL,
    promptVersion: BLOG_FULLBLEED_BACKGROUND_PROMPT_VERSION,
    output: { format: 'jpeg', width: 1200, height: 630 },
  };
}

export async function ingestFullbleedBackgroundAsset(options: {
  projectRoot: string;
  context: BlogArticleImageContext;
  inputPath: string;
  promptHash: string;
}): Promise<{ assetPath: string; promptHash: string; sha256: string }> {
  const expectedPromptHash = computeFullbleedBackgroundPromptHash(
    options.context
  );
  if (options.promptHash !== expectedPromptHash) {
    throw new Error(
      `${options.context.slug}: prompt hashが記事内容と一致しません`
    );
  }
  const inputPath = resolve(options.inputPath);
  if (!existsSync(inputPath)) throw new Error(`生成画像がありません: ${inputPath}`);
  const assetPath = fullbleedBackgroundAssetPath(options.context.slug);
  const outputPath = resolve(options.projectRoot, assetPath);
  const normalized = await sharp(readFileSync(inputPath), { failOn: 'error' })
    .rotate()
    .resize(BLOG_AI_BACKGROUND_WIDTH, BLOG_AI_BACKGROUND_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })
    .flatten({ background: '#ffffff' })
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toBuffer();
  mkdirSync(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, normalized);
  renameSync(temporaryPath, outputPath);
  const source = await resolveFullbleedBackgroundSource(
    options.projectRoot,
    options.context
  );
  if (!source) throw new Error(`${options.context.slug}: 取り込みに失敗しました`);
  return { assetPath, promptHash: expectedPromptHash, sha256: source.sha256 };
}

export async function resolveFullbleedBackgroundSource(
  projectRoot: string,
  context: BlogArticleImageContext
): Promise<BlogArticleBackgroundSource | null> {
  const assetPath = fullbleedBackgroundAssetPath(context.slug);
  const absolutePath = resolve(projectRoot, assetPath);
  if (!existsSync(absolutePath)) return null;
  const buffer = readFileSync(absolutePath);
  const metadata = await sharp(buffer, { failOn: 'error' }).metadata();
  if (
    metadata.format !== 'jpeg' ||
    metadata.width !== BLOG_AI_BACKGROUND_WIDTH ||
    metadata.height !== BLOG_AI_BACKGROUND_HEIGHT
  ) {
    throw new Error(
      `${context.slug}: 記事固有背景がjpeg 1200x630ではありません`
    );
  }
  return {
    buffer,
    sha256: sha256(buffer),
    prompt: buildFullbleedBackgroundPrompt(context),
    promptHash: computeFullbleedBackgroundPromptHash(context),
    model: BLOG_ARTICLE_BACKGROUND_MODEL,
    promptVersion: BLOG_FULLBLEED_BACKGROUND_PROMPT_VERSION,
    motif: `fullbleed:${context.slug}`,
    assetPath,
  };
}

/** Resolve the full-bleed asset first; articles without one keep their existing prompt and bytes. */
export async function resolvePreferredArticleBackgroundSource(projectRoot: string, context: BlogArticleImageContext) {
  return await resolveFullbleedBackgroundSource(projectRoot, context)
    ?? await resolveArticleBackgroundSource(projectRoot, context);
}

export function hasLocalArticleBackground(projectRoot: string, slug: string): boolean {
  return [fullbleedBackgroundAssetPath(slug), articleBackgroundAssetPath(slug)]
    .some(asset => existsSync(resolve(projectRoot, asset)));
}
