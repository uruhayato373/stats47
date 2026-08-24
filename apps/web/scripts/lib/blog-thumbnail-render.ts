/**
 * ブログ記事サムネイル / OGP の Satori レンダリング共通ロジック。
 *
 * ローカル版 (generate-blog-thumbnails.ts) と cloud-first 版
 * (generate-blog-thumbnails-cloud.ts) で同一デザインを共有し drift を防ぐ。
 * デザインを変えるときは本ファイルだけを編集すれば両経路に反映される。
 */

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { createElement } from 'react';

import { BRAND } from '../../src/features/ogp/brand';

export { loadFonts, renderToPng, renderToWebP } from './satori-image-render';
export type { RenderSize, SatoriFont } from './satori-image-render';
export { normalizeAiBackground } from './blog-ai-background-normalizer';

export interface OgpData {
  title: string;
  subtitle?: string | null;
  date?: string;
  category?: string;
  /** フッターに表示するドメインパス (既定 "stats47.jp/blog")。ranking/areas 等で上書きする。 */
  domainPath?: string;
}

/**
 * ブランド背景素材 (日本地図 + データ可視化) を data URI で返す。
 * 背景オプション付き (blog OGP) のときだけ使う。module-level で 1 回だけ読む。
 */
let bgLightCache: string | null = null;
let bgDarkCache: string | null = null;
function brandBackground(dark: boolean): string {
  if (dark) {
    if (!bgDarkCache) bgDarkCache = readBrandBg('ogp-bg-brand-dark.jpg');
    return bgDarkCache;
  }
  if (!bgLightCache) bgLightCache = readBrandBg('ogp-bg-brand-light.jpg');
  return bgLightCache;
}
function readBrandBg(file: string): string {
  const p = join(import.meta.dirname ?? __dirname, 'assets', file);
  return `data:image/jpeg;base64,${readFileSync(p).toString('base64')}`;
}

export interface BuildOptions {
  /** true で日本地図ブランド背景 + 左寄せレイアウト (blog OGP 用)。既定は従来のストライプ枠。 */
  background?: boolean;
  /**
   * AI 生成背景の data URI (blog OGP AI パイプライン)。指定時は brandBackground の代わりに使う。
   * 未指定なら従来どおりブランド背景 (回帰なし)。正典: docs/02_実装計画/23。
   */
  backgroundImage?: string;
}

export const BLOG_OGP_SIZE = { width: 1200, height: 630 } as const;
export const BLOG_THUMBNAIL_SIZE = { width: 640, height: 336 } as const;

export interface BlogOgpTypography {
  titleFontSize: number;
  titleLineHeight: number;
  showSubtitle: boolean;
}

/** 日本語タイトルの長さに応じ、OGP内で最大限大きく読める決定的な文字組みを返す。 */
export function resolveBlogOgpTypography(title: string): BlogOgpTypography {
  const length = Array.from(title.trim()).length;
  if (length <= 18) {
    return { titleFontSize: 72, titleLineHeight: 1.15, showSubtitle: true };
  }
  if (length <= 30) {
    return { titleFontSize: 60, titleLineHeight: 1.18, showSubtitle: true };
  }
  if (length <= 42) {
    return { titleFontSize: 50, titleLineHeight: 1.2, showSubtitle: false };
  }
  return { titleFontSize: 44, titleLineHeight: 1.18, showSubtitle: false };
}

/**
 * サイト内カード専用。元背景の右側を拡大して主役を見せ、文字は一切合成しない。
 * 記事タイトルはカード側のDOMテキストを正典とする。
 */
export function buildBlogThumbnailElement(
  dark: boolean,
  backgroundImage?: string
) {
  const source = backgroundImage ?? brandBackground(dark);
  return createElement(
    'div',
    {
      style: {
        width: BLOG_THUMBNAIL_SIZE.width,
        height: BLOG_THUMBNAIL_SIZE.height,
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        background: dark ? '#0F172A' : '#F8FAFC',
      },
    },
    createElement('img', {
      src: source,
      width: 960,
      height: 504,
      style: {
        position: 'absolute',
        right: 0,
        top: -84,
        width: 960,
        height: 504,
        objectFit: 'fill',
      },
    })
  );
}

/** SNS共有専用。タイトルとブランドを持つ1200×630の自己完結画像。 */
export function buildBlogOgpElement(data: OgpData, backgroundImage?: string) {
  return buildElement(data, false, {
    background: true,
    backgroundImage,
  });
}

export function buildElement(
  data: OgpData,
  dark: boolean,
  opts?: BuildOptions
) {
  const category = data.category ?? 'BLOG';
  const date = data.date ?? '';

  const bg = dark ? '#0F172A' : '#FFFFFF';
  const panel = dark ? '#1E293B' : BRAND.paper;
  const titleColor = dark ? '#FFFFFF' : BRAND.ink;
  const mutedColor = dark ? '#94A3B8' : BRAND.muted;
  const lineColor = dark ? '#334155' : BRAND.line;

  const FONT_JP = '"Noto Sans JP", sans-serif';
  const FONT_MONO = '"JetBrains Mono", monospace';

  // --- background variant (blog OGP): 日本地図ブランド背景 + 左寄せテキスト ---
  if (opts?.background) {
    const typography = resolveBlogOgpTypography(data.title);
    return createElement(
      'div',
      {
        style: {
          width: 1200,
          height: 630,
          position: 'relative',
          display: 'flex',
          fontFamily: FONT_JP,
          overflow: 'hidden',
        },
      },
      // full-bleed background image (AI 背景が指定されればそれを、無ければブランド背景)
      createElement('img', {
        src: opts?.backgroundImage ?? brandBackground(dark),
        width: 1200,
        height: 630,
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
          width: 1200,
          height: 630,
          objectFit: 'cover',
        },
      }),
      // 背景モチーフが安全域へ少し入っても、タイトルの可読性を一定に保つ。
      createElement('div', {
        style: {
          position: 'absolute',
          left: 0,
          top: 0,
          width: 820,
          height: 630,
          background:
            'linear-gradient(90deg, rgba(248,250,252,0.99) 0%, rgba(248,250,252,0.95) 76%, rgba(248,250,252,0) 100%)',
        },
      }),
      // content column (left)
      createElement(
        'div',
        {
          style: {
            position: 'absolute',
            left: 64,
            top: 56,
            width: 680,
            height: 518,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          },
        },
        // category badge
        createElement(
          'div',
          { style: { display: 'flex' } },
          createElement(
            'div',
            {
              style: {
                padding: '6px 14px',
                background: BRAND.primary,
                color: '#fff',
                fontFamily: FONT_JP,
                fontSize: 16,
                fontWeight: 800,
                letterSpacing: 3,
              },
            },
            category
          )
        ),
        // title + accent line + subtitle
        createElement(
          'div',
          { style: { display: 'flex', flexDirection: 'column' } },
          createElement(
            'div',
            {
              style: {
                fontFamily: FONT_JP,
                fontWeight: 900,
                fontSize: typography.titleFontSize,
                color: titleColor,
                lineHeight: typography.titleLineHeight,
                letterSpacing: -1,
              },
            },
            data.title
          ),
          createElement('div', {
            style: {
              width: 64,
              height: 4,
              background: BRAND.vermilion,
              marginTop: 20,
              marginBottom: 16,
            },
          }),
          data.subtitle && typography.showSubtitle
            ? createElement(
                'div',
                {
                  style: {
                    fontFamily: FONT_JP,
                    fontSize: 24,
                    color: mutedColor,
                    fontWeight: 500,
                    lineHeight: 1.5,
                  },
                },
                data.subtitle
              )
            : null
        ),
        // footer: logo + domain
        createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 4 } },
          createElement(
            'span',
            {
              style: {
                fontWeight: 900,
                fontSize: 22,
                color: titleColor,
                fontFamily: FONT_JP,
              },
            },
            'stats'
          ),
          createElement(
            'span',
            {
              style: {
                fontWeight: 900,
                fontSize: 22,
                color: '#fff',
                background: BRAND.primary,
                padding: '2px 7px',
                fontFamily: FONT_JP,
              },
            },
            '47'
          ),
          createElement(
            'span',
            {
              style: {
                fontFamily: FONT_JP,
                fontSize: 14,
                color: mutedColor,
                marginLeft: 10,
                letterSpacing: 1,
              },
            },
            data.domainPath ?? 'stats47.jp/blog'
          )
        )
      )
    );
  }

  const stripePattern = dark
    ? `repeating-linear-gradient(135deg, ${panel} 0 20px, ${bg} 20px 40px)`
    : `repeating-linear-gradient(135deg, ${panel} 0 20px, #fff 20px 40px)`;

  return createElement(
    'div',
    {
      style: {
        width: 1200,
        height: 630,
        position: 'relative',
        background: bg,
        display: 'flex',
        fontFamily: FONT_JP,
        overflow: 'hidden',
      },
    },
    // left stripe
    createElement('div', {
      style: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 285,
        height: 630,
        background: stripePattern,
      },
    }),
    // right stripe
    createElement('div', {
      style: {
        position: 'absolute',
        right: 0,
        top: 0,
        width: 285,
        height: 630,
        background: stripePattern,
      },
    }),
    // center panel (light only - shadow not supported in Satori)
    !dark
      ? createElement('div', {
          style: {
            position: 'absolute',
            left: 285,
            top: 0,
            width: 630,
            height: 630,
            background: '#fff',
            boxShadow: '0 0 40px rgba(15,23,42,0.08)',
          },
        })
      : null,
    // content
    createElement(
      'div',
      {
        style: {
          position: 'absolute',
          left: 285,
          top: 0,
          width: 630,
          height: 630,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '48px 36px',
        },
      },
      // header: category badge + date
      createElement(
        'div',
        { style: { display: 'flex', alignItems: 'center', gap: 10 } },
        createElement(
          'div',
          {
            style: {
              padding: '3px 10px',
              background: BRAND.primary,
              color: '#fff',
              fontFamily: FONT_MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
            },
          },
          category
        ),
        createElement(
          'div',
          {
            style: {
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: mutedColor,
              letterSpacing: 2,
            },
          },
          date
        )
      ),
      // body: title + accent line + subtitle
      createElement(
        'div',
        { style: { display: 'flex', flexDirection: 'column' } },
        createElement(
          'div',
          {
            style: {
              fontFamily: FONT_JP,
              fontWeight: 900,
              fontSize: 46,
              color: titleColor,
              lineHeight: 1.25,
              letterSpacing: -1,
            },
          },
          data.title
        ),
        createElement('div', {
          style: {
            width: 60,
            height: 3,
            background: BRAND.vermilion,
            marginTop: 20,
            marginBottom: 16,
          },
        }),
        data.subtitle
          ? createElement(
              'div',
              {
                style: {
                  fontFamily: FONT_JP,
                  fontSize: 18,
                  color: mutedColor,
                  fontWeight: 500,
                },
              },
              data.subtitle
            )
          : null
      ),
      // footer: logo + domain
      createElement(
        'div',
        {
          style: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 12,
            borderTop: `1px solid ${lineColor}`,
          },
        },
        createElement(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 4 } },
          createElement(
            'span',
            {
              style: {
                fontWeight: 900,
                fontSize: 16,
                color: titleColor,
                fontFamily: FONT_JP,
              },
            },
            'stats'
          ),
          createElement(
            'span',
            {
              style: {
                fontWeight: 900,
                fontSize: 16,
                color: '#fff',
                background: BRAND.primary,
                padding: '2px 6px',
                fontFamily: FONT_JP,
              },
            },
            '47'
          )
        ),
        createElement(
          'div',
          {
            style: {
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: mutedColor,
              letterSpacing: 2,
            },
          },
          data.domainPath ?? 'stats47.jp/blog'
        )
      )
    )
  );
}

/**
 * frontmatter の title / subtitle から ogp の {title, subtitle} を導出。
 * subtitle が無い場合は title を ｜ (全角) / | (半角) で分割して補う。
 */
export function deriveOgpFromFrontmatter(fm: {
  title?: string | null;
  subtitle?: string | null;
}): OgpData | null {
  if (!fm?.title) return null;
  let title = fm.title;
  let subtitle = fm.subtitle ?? null;
  if (!subtitle) {
    const parts = title.split(/[｜|]/);
    if (parts.length >= 2) {
      title = parts[0].trim();
      subtitle = parts.slice(1).join(' ').trim() || null;
    }
  }
  return { title, subtitle };
}

/** article.md 先頭の YAML frontmatter から title / subtitle / seoTitle を抜く。 */
export function parseFrontmatter(markdown: string): {
  title: string | null;
  subtitle: string | null;
  seoTitle: string | null;
} {
  const m = markdown.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const block = m ? m[1] : '';
  const get = (key: string): string | null => {
    const line = block.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'));
    if (!line) return null;
    let v = line[1].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    return v || null;
  };
  return {
    title: get('title'),
    subtitle: get('subtitle'),
    seoTitle: get('seoTitle'),
  };
}
