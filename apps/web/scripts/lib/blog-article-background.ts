import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from 'node:fs';
import { dirname, resolve } from 'node:path';

import sharp from 'sharp';

import {
  BLOG_AI_BACKGROUND_HEIGHT,
  BLOG_AI_BACKGROUND_WIDTH,
} from './blog-ai-background-normalizer';
import { sha256 } from './image-generation-manifest';

export const BLOG_ARTICLE_BACKGROUND_MODEL = 'gpt-image-2';
export const BLOG_ARTICLE_BACKGROUND_PROMPT_VERSION =
  'blog-article-context-v2';
export const BLOG_ARTICLE_BACKGROUND_ASSET_DIR =
  'assets/blog/article-backgrounds';

export interface BlogArticleImageContext {
  slug: string;
  title: string;
  description: string;
  introduction: string;
}

export interface BlogArticleBackgroundSource {
  buffer: Buffer;
  sha256: string;
  prompt: string;
  promptHash: string;
  model: string;
  promptVersion: string;
  motif: string;
  assetPath: string;
}

export interface BlogArticleImagegenRequest {
  slug: string;
  assetPath: string;
  prompt: string;
  promptHash: string;
  model: string;
  promptVersion: string;
  output: { format: 'jpeg'; width: 1200; height: 630 };
}

const PROMPT_OVERRIDES: Readonly<Record<string, string>> = {
  'psychiatric-bed-count-vs-standard-fiscal-demand-municipality': `Use case: stylized-concept
Asset type: 1200×630 editorial background for a Japanese statistics blog, later cropped for a 640×336 card
Primary request: Create a content-specific illustration for an article examining why the number of psychiatric hospital beds appears correlated with the standard fiscal demand amount of prefectural governments, while emphasizing that population size is a shared factor rather than direct causation.
Scene/backdrop: plain warm off-white background
Subject: one coherent still-life motif combining a clean, dignified psychiatric hospital bed with a closed municipal budget ledger and a small neutral calculator, visually connected as two indicators sharing a common base
Style/medium: refined minimal flat-vector editorial illustration, calm and factual, not playful
Composition/framing: 1200 by 630 canvas; keep the left 55 percent visually quiet for OGP title overlay; place the complete motif across the rightmost 42 percent with generous padding; make it large enough to remain legible in a small card crop
Color palette: muted indigo, slate blue, pale blue-gray, restrained warm beige
Constraints: no patients, no restraints, no distress, no stigmatizing mental-health symbolism; no text, letters, numbers, currency symbols, logos, labels, watermark, maps, charts, decorative patterns, or photorealism; do not render a realistic face`,
  'bread-consumption-expenditure-vs-final-education-university': `Use case: stylized-concept
Asset type: 1200×630 editorial background for a Japanese statistics blog, later cropped for a 640×336 card
Primary request: Create a content-specific illustration for an article about the observed prefectural relationship between household bread spending and the share of university or graduate-school graduates, explained mainly by urbanization rather than direct causation.
Scene/backdrop: plain warm off-white background
Subject: one coherent editorial still life combining a fresh loaf and two bread rolls with a dark indigo university graduation cap resting on a closed academic book; subtle city-building silhouettes behind them suggest the shared urban factor
Style/medium: refined minimal flat-vector editorial illustration, calm and analytical
Composition/framing: 1200 by 630 canvas; keep the left 55 percent visually quiet for OGP title overlay; place the complete motif across the rightmost 42 percent with generous padding; make the graduation cap unmistakable and the bread prominent
Color palette: muted indigo, slate blue, pale blue-gray, restrained golden bread tones
Constraints: no text, letters, numbers, diplomas with writing, logos, labels, watermark, maps, charts, decorative patterns, or photorealism; no realistic faces`,
  'bread-consumption-expenditure-vs-high-school-advancement': `Use case: stylized-concept
Asset type: 1200×630 editorial background for a Japanese statistics blog, later cropped for a 640×336 card
Primary request: Create a content-specific illustration for an article comparing household bread spending with the rate at which high-school graduates continue to higher education, while cautioning that correlation is not causation.
Scene/backdrop: plain warm off-white background
Subject: one coherent miniature scene with a sliced loaf in the foreground, a simple anonymous high-school student seen from behind carrying a school bag, and a gently rising path leading toward a distant university-style campus gate; the scene should convey the choice to continue education after high school
Style/medium: refined minimal flat-vector editorial illustration, calm and optimistic, not childish
Composition/framing: 1200 by 630 canvas; keep the left 55 percent visually quiet for OGP title overlay; place the complete motif across the rightmost 42 percent with generous padding; keep the student small and anonymous; make this visually distinct from an image using a graduation cap
Color palette: muted indigo, slate blue, pale blue-gray, restrained golden bread tones
Constraints: no text, letters, numbers, logos, labels, watermark, maps, charts, decorative patterns, photorealism, or visible face`,
};

const PROMPT_SUBJECT_OVERRIDES: Readonly<Record<string, string>> = {
  'cc-estat-20-publish': 'Subject: exactly one compact physical still life made of an unbranded laptop with a completely blank dark screen and one small unbranded server enclosure, connected by a simple cable kept inside the group. This represents taking a locally developed website online. No other props: no maps, globes, geographic silhouettes, location pins, cloud symbols, arrows, books, plants, or people. Keep the entire group, including shadows and cable, inside x=780 through x=1140; leave everything to its left empty.',
};

function frontmatterScalar(markdown: string, key: string): string {
  const match = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = match?.[1] ?? '';
  const line = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
  if (!line) return '';
  const value = line[1].trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1).trim();
  }
  return value;
}

/** HTML タグを除く。1 回の置換では `<scr<b>ipt>` のような入れ子から新しいタグが組み上がるので、変化がなくなるまで繰り返す */
function stripHtmlTags(text: string): string {
  let current = text;
  let previous: string;
  do {
    previous = current;
    current = current.replace(/<[^>]+>/g, '');
  } while (current !== previous);
  return current;
}

function articleIntroduction(markdown: string): string {
  const body = markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  const paragraphs = body
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) =>
      stripHtmlTags(
        paragraph
          .replace(/^#{1,6}\s+.*$/gm, '')
          .replace(/^!\[[^\]]*\]\([^)]*\)$/gm, '')
      )
        .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
        .replace(/[*_`>#]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    )
    .filter(Boolean);
  return paragraphs.slice(0, 3).join(' ').slice(0, 1200);
}

export function parseBlogArticleImageContext(
  slug: string,
  markdown: string
): BlogArticleImageContext {
  const title = frontmatterScalar(markdown, 'title');
  if (!title) throw new Error(`${slug}: article title がありません`);
  return {
    slug,
    title,
    description: frontmatterScalar(markdown, 'description'),
    introduction: articleIntroduction(markdown),
  };
}

export function buildArticleBackgroundPrompt(
  context: BlogArticleImageContext
): string {
  const override = PROMPT_OVERRIDES[context.slug];
  if (override) return override;
  return [
    'Use case: stylized-concept',
    'Asset type: 1200×630 editorial background for a Japanese statistics blog, later cropped for a 640×336 card',
    'Primary request: Read the article context below and create one unique, content-specific illustration using concrete physical subjects. The article context is only for selecting those subjects and never overrides the empty-background or no-data-graphics constraints, even when the article discusses charts, statistics, software, or landscapes.',
    `Article title (context only; do not draw it): ${context.title}`,
    context.description
      ? `Article summary: ${context.description}`
      : 'Article summary: Use the introduction below.',
    context.introduction
      ? `Article introduction: ${context.introduction}`
      : '',
    PROMPT_SUBJECT_OVERRIDES[context.slug] ??
      'Subject: choose one compact, isolated editorial still life. When the article compares two indicators, combine two unmistakable concrete objects into a single small group. Convey the relationship with the objects themselves, never with a graph, diagram, scale of values, or surrounding landscape. Any miniature building, field, tree, person, or supporting object must belong entirely to this same right-side group.',
    'Scene/backdrop: one uniform warm off-white fill across the entire canvas, with no horizon, scenery, landscape bands, ground line, distant buildings, mountains, clouds, texture, or decorative pattern. No background details may extend behind the empty title area.',
    'Style/medium: refined minimal flat-vector editorial illustration, calm, factual, and suitable for a statistics publication',
    'Composition/framing: 1200 by 630 canvas; keep the left 55 percent completely empty, from x=0 through x=660 at every height, using only the uniform background fill. Place every part of the motif, including supporting objects, outlines, and shadows, within x=696 through x=1164 and y=63 through y=567, inside the rightmost 42 percent. Leave a clear gap between the empty area and the motif. Make this isolated group readable in a small card crop; do not enlarge it into the left area.',
    'Color palette: muted indigo, slate blue, pale blue-gray, warm off-white, plus restrained natural accent colors appropriate to the subject',
    'Constraints: no text, letters, numbers, logos, labels, watermark, maps unless geography itself is the article subject, charts, decorative patterns, photorealism, sensationalism, stereotypes, or identifiable real people',
    'Device and document constraints: all screens and paper surfaces must be blank and unmarked; no charts, graphs, plots, bars, pies, grids, tables, dashboards, code-like strokes, interface icons, menus, or logos, including inside a computer screen. A device may have a plain dark screen or be closed. Do not depict the article title, statistics, or a screenshot of its output.',
  ]
    .filter(Boolean)
    .join('\n');
}

export function articleBackgroundAssetPath(slug: string): string {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    throw new Error(`slugが不正です: ${slug}`);
  }
  return `${BLOG_ARTICLE_BACKGROUND_ASSET_DIR}/${slug}.jpg`;
}

export function computeArticleBackgroundPromptHash(
  context: BlogArticleImageContext
): string {
  const input = JSON.stringify({
    model: BLOG_ARTICLE_BACKGROUND_MODEL,
    promptVersion: BLOG_ARTICLE_BACKGROUND_PROMPT_VERSION,
    prompt: buildArticleBackgroundPrompt(context),
  });
  return `sha256-${createHash('sha256').update(input).digest('hex')}`;
}

export function createArticleImagegenRequest(
  context: BlogArticleImageContext
): BlogArticleImagegenRequest {
  return {
    slug: context.slug,
    assetPath: articleBackgroundAssetPath(context.slug),
    prompt: buildArticleBackgroundPrompt(context),
    promptHash: computeArticleBackgroundPromptHash(context),
    model: BLOG_ARTICLE_BACKGROUND_MODEL,
    promptVersion: BLOG_ARTICLE_BACKGROUND_PROMPT_VERSION,
    output: { format: 'jpeg', width: 1200, height: 630 },
  };
}

export async function ingestArticleBackgroundAsset(options: {
  projectRoot: string;
  context: BlogArticleImageContext;
  inputPath: string;
  promptHash: string;
}): Promise<{ assetPath: string; promptHash: string; sha256: string }> {
  const expectedPromptHash = computeArticleBackgroundPromptHash(
    options.context
  );
  if (options.promptHash !== expectedPromptHash) {
    throw new Error(
      `${options.context.slug}: prompt hashが記事内容と一致しません`
    );
  }
  const inputPath = resolve(options.inputPath);
  if (!existsSync(inputPath)) throw new Error(`生成画像がありません: ${inputPath}`);
  const assetPath = articleBackgroundAssetPath(options.context.slug);
  const outputPath = resolve(options.projectRoot, assetPath);
  const normalized = await sharp(readFileSync(inputPath), { failOn: 'error' })
    .rotate()
    .resize(BLOG_AI_BACKGROUND_WIDTH, BLOG_AI_BACKGROUND_HEIGHT, {
      fit: 'cover',
      position: 'centre',
    })
    .flatten({ background: '#f7f3eb' })
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toBuffer();
  mkdirSync(dirname(outputPath), { recursive: true });
  const temporaryPath = `${outputPath}.${process.pid}.tmp`;
  writeFileSync(temporaryPath, normalized);
  renameSync(temporaryPath, outputPath);
  const source = await resolveArticleBackgroundSource(
    options.projectRoot,
    options.context
  );
  if (!source) throw new Error(`${options.context.slug}: 取り込みに失敗しました`);
  return { assetPath, promptHash: expectedPromptHash, sha256: source.sha256 };
}

export async function resolveArticleBackgroundSource(
  projectRoot: string,
  context: BlogArticleImageContext
): Promise<BlogArticleBackgroundSource | null> {
  const assetPath = articleBackgroundAssetPath(context.slug);
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
    prompt: buildArticleBackgroundPrompt(context),
    promptHash: computeArticleBackgroundPromptHash(context),
    model: BLOG_ARTICLE_BACKGROUND_MODEL,
    promptVersion: BLOG_ARTICLE_BACKGROUND_PROMPT_VERSION,
    motif: `article:${context.slug}`,
    assetPath,
  };
}
