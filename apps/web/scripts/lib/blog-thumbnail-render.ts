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

export function buildElement(data: OgpData, dark: boolean) {
  const category = data.category ?? "BLOG";
  const date = data.date ?? "";

  const bg = dark ? "#0F172A" : "#FFFFFF";
  const panel = dark ? "#1E293B" : BRAND.paper;
  const titleColor = dark ? "#FFFFFF" : BRAND.ink;
  const mutedColor = dark ? "#94A3B8" : BRAND.muted;
  const lineColor = dark ? "#334155" : BRAND.line;

  const FONT_JP = '"Noto Sans JP", sans-serif';
  const FONT_MONO = '"JetBrains Mono", monospace';

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
