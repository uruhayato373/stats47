#!/usr/bin/env tsx
/**
 * ブログ記事サムネイル一括生成 (Satori + sharp)
 *
 * Usage:
 *   npx tsx apps/web/scripts/generate-blog-thumbnails.ts
 *   npx tsx apps/web/scripts/generate-blog-thumbnails.ts --force
 *   npx tsx apps/web/scripts/generate-blog-thumbnails.ts --slug noodle-consumption-prefecture-character
 *
 * 出力: .local/r2/blog/{slug}/thumbnail-light.webp
 *       .local/r2/blog/{slug}/thumbnail-dark.webp
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";

import satori from "satori";
import sharp from "sharp";

import { BRAND } from "../src/features/ogp/brand";

interface OgpData {
  title: string;
  subtitle?: string | null;
  date?: string;
  category?: string;
}

type SatoriFont = {
  name: string;
  data: ArrayBuffer;
  weight: 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
  style: "normal" | "italic";
};

function loadFonts(projectRoot: string): SatoriFont[] {
  const base = join(
    projectRoot,
    "node_modules/@expo-google-fonts/noto-sans-jp",
  );
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

function buildElement(data: OgpData, dark: boolean) {
  const category = data.category ?? "BLOG";
  const date = data.date ?? "";

  const bg = dark ? "#0F172A" : "#FFFFFF";
  const panel = dark ? "#1E293B" : BRAND.paper;
  const titleColor = dark ? "#FFFFFF" : BRAND.ink;
  const mutedColor = dark ? "#94A3B8" : BRAND.muted;
  const lineColor = dark ? "#334155" : BRAND.line;

  const FONT_JP = '"Noto Sans JP", sans-serif';
  const FONT_MONO = '"JetBrains Mono", monospace';

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
        background: panel,
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
        background: panel,
      },
    }),
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
              fontSize: 42,
              color: titleColor,
              lineHeight: 1.3,
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
                  fontSize: 17,
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
          "stats47.jp/blog",
        ),
      ),
    ),
  );
}

async function renderToWebP(
  element: ReturnType<typeof createElement>,
  fonts: SatoriFont[],
  outputPath: string,
) {
  const svg = await satori(element, { width: 1200, height: 630, fonts });
  await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outputPath);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const slugIdx = args.indexOf("--slug");
  const slugFilter = slugIdx !== -1 ? args[slugIdx + 1] : null;

  const projectRoot = join(import.meta.dirname ?? __dirname, "../../..");
  const blogDir = join(projectRoot, ".local/r2/app/blog");

  console.log("フォントを読み込み中...");
  const fonts = loadFonts(projectRoot);
  console.log("フォント読み込み完了");

  const slugs = readdirSync(blogDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((slug) => !slugFilter || slug === slugFilter);

  let generated = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const dir = join(blogDir, slug);
    const ogpJson = join(dir, "ogp/ogp.json");
    const lightOut = join(dir, "thumbnail-light.webp");
    const darkOut = join(dir, "thumbnail-dark.webp");

    if (!existsSync(ogpJson)) {
      skipped++;
      continue;
    }

    if (!force && existsSync(lightOut) && existsSync(darkOut)) {
      skipped++;
      continue;
    }

    const { title, subtitle } = JSON.parse(
      readFileSync(ogpJson, "utf-8"),
    ) as OgpData;
    const data: OgpData = { title, subtitle: subtitle ?? null, date: "", category: "BLOG" };

    process.stdout.write(`  ${slug} ... `);

    await renderToWebP(buildElement(data, false), fonts, lightOut);
    await renderToWebP(buildElement(data, true), fonts, darkOut);

    console.log("ok");
    generated++;
  }

  console.log(`\n完了: ${generated} 件生成、${skipped} 件スキップ`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
