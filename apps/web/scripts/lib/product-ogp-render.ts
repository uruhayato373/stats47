/**
 * 商品ページ (/products/<slug>) OGP レンダラー。
 *
 * kindle 商品は product-factory の表紙背景 (read-only) を、それ以外はブランド背景を使う。
 * 全面背景 (object-fit: cover) + 左60%可読性スクリーンにチャンネルラベル・タイトル (≤2行)・
 * 価格・ブランドマークを Satori で合成する (既存 blog OGP と同じ「全面画像 + 左スクリーン」構図)。
 *
 * 正典: .claude/rules/ogp-image-standards.md §5
 */

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createElement as h } from 'react';

import { ProductOgp, type ProductOgpData } from '../../src/features/ogp/ProductOgp';

export type ProductOgpChannel = 'kindle' | 'coconala';

const BRAND_BACKGROUND_RELATIVE_PATH = 'apps/web/scripts/lib/assets/ogp-bg-brand-light.jpg';
const KINDLE_COVER_BACKGROUNDS_RELATIVE_DIR =
  'packages/product-factory/src/channels/kindle/assets/cover-backgrounds';

export interface ResolveProductBackgroundInput {
  projectRoot: string;
  channel: ProductOgpChannel;
  /** kindle 商品の場合のみ使用する storefront product.id (例: "K-S1-02")。 */
  productId: string;
}

/** channel から背景 JPEG の絶対パスを決定する (read-only、product-factory の資産を書き換えない)。 */
export function resolveProductBackgroundPath(input: ResolveProductBackgroundInput): string {
  if (input.channel === 'kindle') {
    const path = join(
      input.projectRoot,
      KINDLE_COVER_BACKGROUNDS_RELATIVE_DIR,
      `${input.productId}.jpg`
    );
    if (!existsSync(path)) {
      throw new Error(`kindle cover background が見つかりません: ${path}`);
    }
    return path;
  }
  return join(input.projectRoot, BRAND_BACKGROUND_RELATIVE_PATH);
}

/** 背景ファイルの内容 SHA-256。背景差し替えだけで再生成させる入力指紋として使う。 */
export function sha256File(path: string): string {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function readImageDataUri(path: string): string {
  return `data:image/jpeg;base64,${readFileSync(path).toString('base64')}`;
}

/** 全角=1・半角=0.55として見積もる表示幅 (note-cover-render.ts と同じ考え方)。 */
function visualLength(value: string): number {
  return [...value].reduce((sum, ch) => sum + (/^[\x00-\x7f]$/.test(ch) ? 0.55 : 1), 0);
}

const TITLE_BREAK_CHARS = ['—', '－', '：', ':', '　', ' ', '、'];

/**
 * タイトルを最大2行へ分割する。自然な区切り文字 (em dash・コロン・読点等) があれば
 * そこで割り、無ければ表示幅の中央付近で機械的に割る (simple length split)。
 */
export function splitProductTitle(title: string): string[] {
  const trimmed = title.trim();
  if (trimmed.length === 0) return [''];
  if (visualLength(trimmed) <= 14) return [trimmed];

  for (const breakChar of TITLE_BREAK_CHARS) {
    const idx = trimmed.indexOf(breakChar);
    if (idx > 0 && idx < trimmed.length - 1) {
      const first = trimmed.slice(0, idx).trim();
      const second = trimmed.slice(idx + breakChar.length).trim();
      if (first && second) return [first, second];
    }
  }
  const chars = [...trimmed];
  const mid = Math.ceil(chars.length / 2);
  return [chars.slice(0, mid).join('').trim(), chars.slice(mid).join('').trim()];
}

export interface ProductTitleLayout {
  lines: string[];
  fontSize: number;
}

/** 2行に分割済みのタイトルが、各行とも横幅へ収まるフォントサイズを表示幅から逆算する。 */
export function resolveProductTitleLayout(title: string, boxWidth = 620): ProductTitleLayout {
  const lines = splitProductTitle(title);
  const longest = Math.max(...lines.map(visualLength), 1);
  const fontSize = Math.min(56, Math.max(26, Math.floor((boxWidth - 16) / longest)));
  return { lines, fontSize };
}

export interface BuildProductOgpElementInput {
  projectRoot: string;
  channel: ProductOgpChannel;
  channelLabel: string;
  title: string;
  priceYen: number;
  /** kindle 商品の場合のみ使用する storefront product.id。 */
  productId: string;
}

export function buildProductOgpElement(input: BuildProductOgpElementInput) {
  const backgroundPath = resolveProductBackgroundPath(input);
  const backgroundImage = readImageDataUri(backgroundPath);
  const { lines, fontSize } = resolveProductTitleLayout(input.title);
  const data: ProductOgpData = {
    channelLabel: input.channelLabel,
    titleLines: lines,
    titleFontSize: fontSize,
    priceYen: input.priceYen,
    backgroundImage,
  };
  return h(ProductOgp, { data });
}
