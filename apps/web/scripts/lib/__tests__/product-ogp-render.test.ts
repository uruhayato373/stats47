import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import {
  buildProductOgpElement,
  resolveProductBackgroundPath,
  resolveProductTitleLayout,
  sha256File,
  splitProductTitle,
} from '../product-ogp-render';
import { loadFonts, renderToPng } from '../satori-image-render';

// apps/web/scripts/lib/__tests__ から見たリポジトリルート (既存 __tests__ と同じ算出方法)。
const PROJECT_ROOT = resolve(import.meta.dirname, '../../../../..');

describe('splitProductTitle', () => {
  it('短いタイトルは分割しない', () => {
    expect(splitProductTitle('食卓の地図')).toEqual(['食卓の地図']);
  });

  it('em dash 等の自然な区切りがあればそこで2行に割る', () => {
    const lines = splitProductTitle(
      '消費量日本一の食卓 — 家計調査で読む47都道府県の食'
    );
    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe('消費量日本一の食卓');
    expect(lines[1]).toBe('家計調査で読む47都道府県の食');
  });

  it('自然な区切りが無い長いタイトルは中央付近で機械的に割る', () => {
    const title = 'あ'.repeat(30);
    const lines = splitProductTitle(title);
    expect(lines).toHaveLength(2);
    expect(lines.join('')).toBe(title);
  });
});

describe('resolveProductTitleLayout', () => {
  it('2行以内に収め、フォントサイズを既定の上下限に収める', () => {
    const { lines, fontSize } = resolveProductTitleLayout(
      '消費量日本一の食卓 — 家計調査で読む47都道府県の食'
    );
    expect(lines.length).toBeLessThanOrEqual(2);
    expect(fontSize).toBeGreaterThanOrEqual(26);
    expect(fontSize).toBeLessThanOrEqual(56);
  });

  it('長いタイトルほどフォントサイズを小さくする', () => {
    const short = resolveProductTitleLayout('短い書名');
    const long = resolveProductTitleLayout('とても長い書名'.repeat(4));
    expect(long.fontSize).toBeLessThanOrEqual(short.fontSize);
  });
});

describe('resolveProductBackgroundPath', () => {
  it('kindle商品はproduct-factoryの表紙背景を指す', () => {
    const path = resolveProductBackgroundPath({
      projectRoot: PROJECT_ROOT,
      channel: 'kindle',
      productId: 'K-S1-02',
    });
    expect(path).toContain(
      'packages/product-factory/src/channels/kindle/assets/cover-backgrounds/K-S1-02.jpg'
    );
    // 実在確認 (read-only)。
    expect(() => sha256File(path)).not.toThrow();
  });

  it('未知のkindle商品IDはfail-closedでエラーにする', () => {
    expect(() =>
      resolveProductBackgroundPath({
        projectRoot: PROJECT_ROOT,
        channel: 'kindle',
        productId: 'NOT-A-REAL-ID',
      })
    ).toThrow('kindle cover background が見つかりません');
  });

  it('coconala商品は共通ブランド背景を指す', () => {
    const path = resolveProductBackgroundPath({
      projectRoot: PROJECT_ROOT,
      channel: 'coconala',
      productId: 'P-01',
    });
    expect(path).toContain('apps/web/scripts/lib/assets/ogp-bg-brand-light.jpg');
    expect(() => sha256File(path)).not.toThrow();
  });
});

describe('buildProductOgpElement + render', () => {
  it('kindle商品を1200×630のPNGとして描画する', async () => {
    const element = buildProductOgpElement({
      projectRoot: PROJECT_ROOT,
      channel: 'kindle',
      channelLabel: 'Kindle電子書籍',
      title: '消費量日本一の食卓 — 家計調査で読む47都道府県の食',
      priceYen: 800,
      productId: 'K-S1-02',
    });

    const fonts = loadFonts(PROJECT_ROOT);
    const outPath = resolve(
      PROJECT_ROOT,
      '.local/image-staging/products/__test__/kindle-k-s1-02-ogp.png'
    );
    mkdirSync(dirname(outPath), { recursive: true });
    await renderToPng(element, fonts, outPath);

    const image = sharp(outPath);
    try {
      const metadata = await image.metadata();
      expect(metadata.format).toBe('png');
      expect(metadata.width).toBe(1200);
      expect(metadata.height).toBe(630);
    } finally {
      image.destroy();
    }
  });
});
