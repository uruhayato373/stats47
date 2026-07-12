/**
 * ブログ記事サムネイル / OGP の Satori レンダリング共通ロジック。
 *
 * ローカル版 (generate-blog-thumbnails.ts) と cloud-first 版
 * (generate-blog-thumbnails-cloud.ts) で同一デザインを共有し drift を防ぐ。
 * デザインを変えるときは本ファイルだけを編集すれば両経路に反映される。
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";

import satori from "satori";
import sharp from "sharp";

import { BRAND } from "../../src/features/ogp/brand";

export interface OgpData {
  title: string;
  subtitle?: string | null;
  date?: string;
  category?: string;
  /** フッターに表示するドメインパス (既定 "stats47.jp/blog")。ranking/areas 等で上書きする。 */
  domainPath?: string;
}

export type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
};

export function loadFonts(projectRoot: string): SatoriFont[] {
  const base = join(projectRoot, "node_modules/@expo-google-fonts/noto-sans-jp");
  return [
    {
      name: "Noto Sans JP",
      data: readFileSync(join(base, "400Regular/NotoSansJP_400Regular.ttf"))
        .buffer as ArrayBuffer,
      weight: 400,
      style: "normal",
    },
    {
      name: "Noto Sans JP",
      data: readFileSync(join(base, "700Bold/NotoSansJP_700Bold.ttf"))
        .buffer as ArrayBuffer,
      weight: 700,
      style: "normal",
    },
    {
      name: "Noto Sans JP",
      data: readFileSync(join(base, "900Black/NotoSansJP_900Black.ttf"))
        .buffer as ArrayBuffer,
      weight: 900,
      style: "normal",
    },
  ];
}

/**
 * ブランド背景素材 (日本地図 + データ可視化) を data URI で返す。
 * 背景オプション付き (blog OGP) のときだけ使う。module-level で 1 回だけ読む。
 */
let bgLightCache: string | null = null;
let bgDarkCache: string | null = null;
function brandBackground(dark: boolean): string {
  if (dark) {
    if (!bgDarkCache) bgDarkCache = readBrandBg("ogp-bg-brand-dark.jpg");
    return bgDarkCache;
  }
  if (!bgLightCache) bgLightCache = readBrandBg("ogp-bg-brand-light.jpg");
  return bgLightCache;
}
function readBrandBg(file: string): string {
  const p = join(import.meta.dirname ?? __dirname, "assets", file);
  return `data:image/jpeg;base64,${readFileSync(p).toString("base64")}`;
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

export function buildElement(data: OgpData, dark: boolean, opts?: BuildOptions) {
  const category = data.category ?? "BLOG";
  const date = data.date ?? "";

  const bg = dark ? "#0F172A" : "#FFFFFF";
  const panel = dark ? "#1E293B" : BRAND.paper;
  const titleColor = dark ? "#FFFFFF" : BRAND.ink;
  const mutedColor = dark ? "#94A3B8" : BRAND.muted;
  const lineColor = dark ? "#334155" : BRAND.line;

  const FONT_JP = '"Noto Sans JP", sans-serif';
  const FONT_MONO = '"JetBrains Mono", monospace';

  // --- background variant (blog OGP): 日本地図ブランド背景 + 左寄せテキスト ---
  if (opts?.background) {
    return createElement(
      "div",
      {
        style: {
          width: 1200,
          height: 630,
          position: "relative",
          display: "flex",
          fontFamily: FONT_JP,
          overflow: "hidden",
        },
      },
      // full-bleed background image (AI 背景が指定されればそれを、無ければブランド背景)
      createElement("img", {
        src: opts?.backgroundImage ?? brandBackground(dark),
        width: 1200,
        height: 630,
        style: { position: "absolute", left: 0, top: 0, width: 1200, height: 630, objectFit: "cover" },
      }),
      // content column (left)
      createElement(
        "div",
        {
          style: {
            position: "absolute",
            left: 72,
            top: 72,
            width: 656,
            height: 486,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          },
        },
        // category badge
        createElement(
          "div",
          { style: { display: "flex" } },
          createElement(
            "div",
            {
              style: {
                padding: "4px 12px",
                background: BRAND.primary,
                color: "#fff",
                fontFamily: FONT_JP,
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: 3,
              },
            },
            category,
          ),
        ),
        // title + accent line + subtitle
        createElement(
          "div",
          { style: { display: "flex", flexDirection: "column" } },
          createElement(
            "div",
            {
              style: {
                fontFamily: FONT_JP,
                fontWeight: 900,
                fontSize: 48,
                color: titleColor,
                lineHeight: 1.25,
                letterSpacing: -1,
              },
            },
            data.title,
          ),
          createElement("div", {
            style: { width: 64, height: 4, background: BRAND.vermilion, marginTop: 20, marginBottom: 16 },
          }),
          data.subtitle
            ? createElement(
                "div",
                {
                  style: {
                    fontFamily: FONT_JP,
                    fontSize: 20,
                    color: mutedColor,
                    fontWeight: 500,
                    lineHeight: 1.5,
                  },
                },
                data.subtitle,
              )
            : null,
        ),
        // footer: logo + domain
        createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 4 } },
          createElement(
            "span",
            { style: { fontWeight: 900, fontSize: 18, color: titleColor, fontFamily: FONT_JP } },
            "stats",
          ),
          createElement(
            "span",
            {
              style: {
                fontWeight: 900,
                fontSize: 18,
                color: "#fff",
                background: BRAND.primary,
                padding: "2px 7px",
                fontFamily: FONT_JP,
              },
            },
            "47",
          ),
          createElement(
            "span",
            { style: { fontFamily: FONT_JP, fontSize: 12, color: mutedColor, marginLeft: 10, letterSpacing: 1 } },
            data.domainPath ?? "stats47.jp/blog",
          ),
        ),
      ),
    );
  }

  const stripePattern = dark
    ? `repeating-linear-gradient(135deg, ${panel} 0 20px, ${bg} 20px 40px)`
    : `repeating-linear-gradient(135deg, ${panel} 0 20px, #fff 20px 40px)`;

  return createElement(
    "div",
    {
      style: {
        width: 1200,
        height: 630,
        position: "relative",
        background: bg,
        display: "flex",
        fontFamily: FONT_JP,
        overflow: "hidden",
      },
    },
    // left stripe
    createElement("div", {
      style: {
        position: "absolute",
        left: 0,
        top: 0,
        width: 285,
        height: 630,
        background: stripePattern,
      },
    }),
    // right stripe
    createElement("div", {
      style: {
        position: "absolute",
        right: 0,
        top: 0,
        width: 285,
        height: 630,
        background: stripePattern,
      },
    }),
    // center panel (light only - shadow not supported in Satori)
    !dark
      ? createElement("div", {
          style: {
            position: "absolute",
            left: 285,
            top: 0,
            width: 630,
            height: 630,
            background: "#fff",
            boxShadow: "0 0 40px rgba(15,23,42,0.08)",
          },
        })
      : null,
    // content
    createElement(
      "div",
      {
        style: {
          position: "absolute",
          left: 285,
          top: 0,
          width: 630,
          height: 630,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "48px 36px",
        },
      },
      // header: category badge + date
      createElement(
        "div",
        { style: { display: "flex", alignItems: "center", gap: 10 } },
        createElement(
          "div",
          {
            style: {
              padding: "3px 10px",
              background: BRAND.primary,
              color: "#fff",
              fontFamily: FONT_MONO,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 3,
            },
          },
          category,
        ),
        createElement(
          "div",
          {
            style: {
              fontFamily: FONT_MONO,
              fontSize: 11,
              color: mutedColor,
              letterSpacing: 2,
            },
          },
          date,
        ),
      ),
      // body: title + accent line + subtitle
      createElement(
        "div",
        { style: { display: "flex", flexDirection: "column" } },
        createElement(
          "div",
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
          data.title,
        ),
        createElement("div", {
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
              "div",
              {
                style: {
                  fontFamily: FONT_JP,
                  fontSize: 18,
                  color: mutedColor,
                  fontWeight: 500,
                },
              },
              data.subtitle,
            )
          : null,
      ),
      // footer: logo + domain
      createElement(
        "div",
        {
          style: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: 12,
            borderTop: `1px solid ${lineColor}`,
          },
        },
        createElement(
          "div",
          { style: { display: "flex", alignItems: "center", gap: 4 } },
          createElement(
            "span",
            {
              style: {
                fontWeight: 900,
                fontSize: 16,
                color: titleColor,
                fontFamily: FONT_JP,
              },
            },
            "stats",
          ),
          createElement(
            "span",
            {
              style: {
                fontWeight: 900,
                fontSize: 16,
                color: "#fff",
                background: BRAND.primary,
                padding: "2px 6px",
                fontFamily: FONT_JP,
              },
            },
            "47",
          ),
        ),
        createElement(
          "div",
          {
            style: {
              fontFamily: FONT_MONO,
              fontSize: 10,
              color: mutedColor,
              letterSpacing: 2,
            },
          },
          data.domainPath ?? "stats47.jp/blog",
        ),
      ),
    ),
  );
}

export interface RenderSize {
  width: number;
  height: number;
}
const DEFAULT_SIZE: RenderSize = { width: 1200, height: 630 };

export async function renderToWebP(
  element: ReturnType<typeof createElement>,
  fonts: SatoriFont[],
  outputPath: string,
  size: RenderSize = DEFAULT_SIZE,
) {
  const svg = await satori(element, { ...size, fonts });
  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outputPath);
}

export async function renderToPng(
  element: ReturnType<typeof createElement>,
  fonts: SatoriFont[],
  outputPath: string,
  size: RenderSize = DEFAULT_SIZE,
) {
  const svg = await satori(element, { ...size, fonts });
  await sharp(Buffer.from(svg)).png().toFile(outputPath);
}

/** 左タイトルセーフゾーン用の半透明スクリム (左→透明のグラデ)。 */
function leftScrimSvg(w: number, h: number, rgb: string, opacity: number): Buffer {
  return Buffer.from(
    `<svg width="${w}" height="${h}"><defs>` +
      `<linearGradient id="g" x1="0" y1="0" x2="1" y2="0">` +
      `<stop offset="0" stop-color="rgb(${rgb})" stop-opacity="${opacity}"/>` +
      `<stop offset="0.55" stop-color="rgb(${rgb})" stop-opacity="0"/>` +
      `</linearGradient></defs><rect width="${w}" height="${h}" fill="url(#g)"/></svg>`,
  );
}

/**
 * AI 生成背景を OGP 合成用に決定的に正規化する。
 * - 1200×630 に cover リサイズ
 * - dark 版は明度・彩度を落とし藍色オーバーレイを重ねる (API を再度呼ばない)
 * - 左タイトルセーフゾーンに半透明スクリムを重ね可読性を確保 (§10)
 * 返り値は buildElement の backgroundImage に渡す JPEG data URI。
 * ※ satori の <img> 画像サイズ解析は webp 非対応 (u is not iterable で throw) のため
 *   JPEG で返す (ブランド背景も JPEG で実績あり)。
 */
export async function normalizeAiBackground(input: Buffer, dark: boolean): Promise<string> {
  const W = 1200;
  const H = 630;
  const overlays: sharp.OverlayOptions[] = [];
  let pipeline = sharp(input).resize(W, H, { fit: "cover", position: "centre" });
  if (dark) {
    pipeline = pipeline.modulate({ brightness: 0.72, saturation: 0.75 });
    // 全面の藍色オーバーレイ + 左スクリム (濃紺)
    overlays.push({
      input: Buffer.from(
        `<svg width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="rgba(23,32,66,0.42)"/></svg>`,
      ),
    });
    overlays.push({ input: leftScrimSvg(W, H, "15,23,42", 0.7) });
  } else {
    overlays.push({ input: leftScrimSvg(W, H, "255,255,255", 0.72) });
  }
  const out = await pipeline.composite(overlays).jpeg({ quality: 88 }).toBuffer();
  return `data:image/jpeg;base64,${out.toString("base64")}`;
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
      subtitle = parts.slice(1).join(" ").trim() || null;
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
  const block = m ? m[1] : "";
  const get = (key: string): string | null => {
    const line = block.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
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
  return { title: get("title"), subtitle: get("subtitle"), seoTitle: get("seoTitle") };
}
