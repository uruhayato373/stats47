import { createHash } from 'node:crypto';
import { writeFileSync } from 'node:fs';

import type { SatoriFont } from './satori-image-render';
import {
  buildElement,
  renderToPng,
  renderToWebP,
} from './blog-thumbnail-render';
import { normalizeAiBackground } from './blog-ai-background-normalizer';

/**
 * brand / AI のどちらも同じ最終合成経路で描画する。
 * aiBackground は 1200x630 JPEG の source artifact で、plan input の SHA と一致必須。
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
  aiBackground?: { buffer: Buffer; sha256: string };
}): Promise<void> {
  let lightBackground: string | undefined;
  let darkBackground: string | undefined;

  if (options.aiBackground) {
    if (!options.outputs.background) {
      throw new Error('AI background の出力先がありません');
    }
    const actualSha = createHash('sha256')
      .update(options.aiBackground.buffer)
      .digest('hex');
    if (actualSha !== options.aiBackground.sha256) {
      throw new Error(
        `AI background SHA が plan と不一致です: expected=${options.aiBackground.sha256} actual=${actualSha}`
      );
    }
    lightBackground = `data:image/jpeg;base64,${options.aiBackground.buffer.toString('base64')}`;
    darkBackground = await normalizeAiBackground(
      options.aiBackground.buffer,
      true
    );
    writeFileSync(options.outputs.background, options.aiBackground.buffer);
  } else if (options.outputs.background) {
    throw new Error('brand background に background 出力先は指定できません');
  }

  const renderData = {
    title: options.data.title,
    subtitle: options.data.subtitle,
    date: '',
    category: 'BLOG',
    domainPath: 'stats47.jp/blog',
  };
  await renderToWebP(
    buildElement(renderData, false, {
      background: true,
      backgroundImage: lightBackground,
    }),
    options.fonts,
    options.outputs.light
  );
  await renderToWebP(
    buildElement(renderData, true, {
      background: true,
      backgroundImage: darkBackground,
    }),
    options.fonts,
    options.outputs.dark
  );
  await renderToPng(
    buildElement(renderData, false, {
      background: true,
      backgroundImage: lightBackground,
    }),
    options.fonts,
    options.outputs.ogp
  );
}
