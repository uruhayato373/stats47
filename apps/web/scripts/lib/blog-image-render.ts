import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

import type { SatoriFont } from './satori-image-render';
import {
  BLOG_THUMBNAIL_SIZE,
  buildBlogOgpElement,
  buildBlogThumbnailElement,
  renderToPng,
  renderToWebP,
} from './blog-thumbnail-render';
import { normalizeAiBackground } from './blog-ai-background-normalizer';

/**
 * 記事固有AI背景をOGPとカードへ用途別に合成する。
 * 背景は1200x630 JPEGのsource artifactで、plan inputのSHAと一致必須。
 */
export async function renderBlogImageBundle(options: {
  data: { title: string; subtitle: string | null };
  fonts: SatoriFont[];
  outputs: {
    light: string;
    dark: string;
    ogp: string;
    background?: string;
  };
  aiBackground: { buffer: Buffer; sha256: string };
}): Promise<void> {
  let lightBackground: string | undefined;
  let darkBackground: string | undefined;

  if (!options.outputs.background) {
    throw new Error('AI background の出力先がありません');
  }
  const actualSha = createHash('sha256')
    .update(options.aiBackground.buffer)
    .digest('hex');
  if (actualSha !== options.aiBackground.sha256) {
    throw new Error(
      `background SHA が plan と不一致です: expected=${options.aiBackground.sha256} actual=${actualSha}`
    );
  }
  lightBackground = `data:image/jpeg;base64,${options.aiBackground.buffer.toString('base64')}`;
  darkBackground = await normalizeAiBackground(options.aiBackground.buffer, true);
  writeFileSync(options.outputs.background, options.aiBackground.buffer);

  const renderData = {
    title: options.data.title,
    subtitle: options.data.subtitle,
    date: '',
    category: 'BLOG',
    domainPath: 'stats47.jp/blog',
  };
  await renderToWebP(
    buildBlogThumbnailElement(false, lightBackground),
    options.fonts,
    options.outputs.light,
    BLOG_THUMBNAIL_SIZE
  );
  await renderToWebP(
    buildBlogThumbnailElement(true, darkBackground),
    options.fonts,
    options.outputs.dark,
    BLOG_THUMBNAIL_SIZE
  );
  await renderToPng(
    buildBlogOgpElement(renderData, lightBackground),
    options.fonts,
    options.outputs.ogp
  );
}
