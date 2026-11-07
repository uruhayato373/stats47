import { writeFileSync } from 'node:fs';
import sharp from 'sharp';
import { blogRendererSources } from '../data/image-generator-registry';
import { BLOG_FULLBLEED_BACKGROUND_PROMPT_VERSION } from './blog-fullbleed-background';
import { buildBlogExternalOgp, renderBlogImageBundle } from './blog-image-render';
import { BLOG_THUMBNAIL_SIZE, renderToPng } from './blog-thumbnail-render';
import { sha256 } from './image-generation-manifest';

export function blogRendererSourcesForBackground(promptVersion?: string): readonly string[] {
  const legacy = blogRendererSources('ai');
  return promptVersion === BLOG_FULLBLEED_BACKGROUND_PROMPT_VERSION
    ? [...legacy, 'apps/web/scripts/lib/blog-fullbleed-render.ts']
    : legacy;
}

export async function renderFullbleedBlogImageBundle(
  options: Parameters<typeof renderBlogImageBundle>[0]
): Promise<void> {
  if (!options.outputs.background) throw new Error('AI background の出力先がありません');
  if (sha256(options.aiBackground.buffer) !== options.aiBackground.sha256) {
    throw new Error('background SHA が plan と不一致です');
  }
  // Resize the entire canvas; both themes receive exactly the same encoded bytes.
  const thumbnail = await sharp(options.aiBackground.buffer)
    .resize(BLOG_THUMBNAIL_SIZE.width, BLOG_THUMBNAIL_SIZE.height, { fit: 'fill' })
    .webp({ quality: 62, effort: 6 }).toBuffer();
  writeFileSync(options.outputs.light, thumbnail);
  writeFileSync(options.outputs.dark, thumbnail);
  writeFileSync(options.outputs.background, options.aiBackground.buffer);
  await renderToPng(buildBlogExternalOgp(options.data), options.fonts, options.outputs.ogp);
}

export function renderBlogImageBundleForBackground(
  promptVersion: string | undefined,
  options: Parameters<typeof renderBlogImageBundle>[0]
): Promise<void> {
  return promptVersion === BLOG_FULLBLEED_BACKGROUND_PROMPT_VERSION
    ? renderFullbleedBlogImageBundle(options)
    : renderBlogImageBundle(options);
}
