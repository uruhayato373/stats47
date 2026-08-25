import { createHash } from 'node:crypto';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import sharp from 'sharp';
import { afterEach, describe, expect, it } from 'vitest';

import { createBlogImagePlan } from '../blog-image-generation';
import { renderBlogImageBundle } from '../blog-image-render';
import {
  buildBlogOgpElement,
  buildBlogThumbnailElement,
  loadFonts,
  resolveBlogOgpTypography,
} from '../blog-thumbnail-render';

const temporaryDirectories: string[] = [];

// Windows では libvips のキャッシュが生成物を保持し、後片付けを妨げることがある。
sharp.cache(false);

function makeTemporaryDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), 'stats47-blog-images-'));
  temporaryDirectories.push(directory);
  return directory;
}

async function readImageMetadata(path: string) {
  const image = sharp(path);
  try {
    return await image.metadata();
  } finally {
    image.destroy();
  }
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    // sharp/libvips が Windows で出力ハンドルを数十ms保持する場合がある。
    rmSync(directory, { recursive: true, force: true, maxRetries: 30, retryDelay: 100 });
  }
});

describe('blog image variants', () => {
  it('OGPはタイトル長に応じて文字を大きくし、長文ではsubtitleを省く', () => {
    expect(resolveBlogOgpTypography('短いタイトル')).toEqual({
      titleFontSize: 72,
      titleLineHeight: 1.15,
      showSubtitle: true,
    });
    expect(resolveBlogOgpTypography('あ'.repeat(25))).toMatchObject({
      titleFontSize: 60,
      showSubtitle: true,
    });
    expect(resolveBlogOgpTypography('あ'.repeat(38))).toMatchObject({
      titleFontSize: 50,
      showSubtitle: false,
    });
    expect(resolveBlogOgpTypography('あ'.repeat(50))).toMatchObject({
      titleFontSize: 44,
      showSubtitle: false,
    });
  });

  it('OGPだけがタイトルを持ち、サイト用サムネイルは文字を合成しない', () => {
    const title = '都道府県の違いがわかる記事';
    const background = 'data:image/jpeg;base64,AA==';
    const ogp = buildBlogOgpElement(
      { title, subtitle: '比較して読み解く' },
      background
    );
    const thumbnail = buildBlogThumbnailElement(false, background);

    expect(JSON.stringify(ogp)).toContain(title);
    expect(JSON.stringify(thumbnail)).not.toContain(title);
    expect(JSON.stringify(thumbnail)).not.toContain('stats47');
  });

  it('manifestはOGP 1200×630とサムネイル640×336を区別する', () => {
    const plan = createBlogImagePlan({
      slug: 'example',
      data: { title: '記事', subtitle: null },
      background: { source: 'brand' },
      rendererHash: 'a'.repeat(64),
    });

    expect(plan.assets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          variant: 'light',
          width: 640,
          height: 336,
        }),
        expect.objectContaining({
          variant: 'dark',
          width: 640,
          height: 336,
        }),
        expect.objectContaining({
          variant: 'ogp',
          width: 1200,
          height: 630,
        }),
      ])
    );
  });

  it('3種類を契約どおりの形式と寸法で生成する', async () => {
    const root = resolve(process.cwd());
    const output = makeTemporaryDirectory();
    const light = join(output, 'thumbnail-light.webp');
    const dark = join(output, 'thumbnail-dark.webp');
    const ogp = join(output, 'ogp.png');
    const backgroundPath = join(output, 'background.jpg');
    const background = await sharp({
      create: {
        width: 1200,
        height: 630,
        channels: 3,
        background: '#f6f1e7',
      },
    })
      .jpeg()
      .toBuffer();

    await renderBlogImageBundle({
      data: { title: '人口が増えている県は？', subtitle: '統計から比較する' },
      fonts: loadFonts(root),
      outputs: { light, dark, ogp, background: backgroundPath },
      aiBackground: {
        buffer: background,
        sha256: createHash('sha256').update(background).digest('hex'),
      },
    });

    await expect(readImageMetadata(light)).resolves.toMatchObject({
      format: 'webp',
      width: 640,
      height: 336,
    });
    await expect(readImageMetadata(dark)).resolves.toMatchObject({
      format: 'webp',
      width: 640,
      height: 336,
    });
    await expect(readImageMetadata(ogp)).resolves.toMatchObject({
      format: 'png',
      width: 1200,
      height: 630,
    });
    await expect(readImageMetadata(backgroundPath)).resolves.toMatchObject({
      format: 'jpeg',
      width: 1200,
      height: 630,
    });
  });

});
