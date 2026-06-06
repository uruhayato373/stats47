#!/usr/bin/env tsx
/**
 * ブログ記事サムネイル・OGP の監査 + 生成 + cloud R2 push (完全DBレス)
 *
 * 読み=公開 R2 URL (storage.stats47.jp)、
 * 書き=wrangler CLI (`wrangler r2 object put --remote`、S3 鍵不要)。
 * 生成物は /tmp に出して push するだけなのでローカルに残らない。
 *
 * Usage:
 *   # 監査のみ (cloud で thumbnail が 404/非画像の記事を一覧、read-only)
 *   npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --audit
 *
 *   # 欠落分を生成 (dry-run、/tmp に出すだけで push しない)
 *   npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts
 *
 *   # 欠落分を生成して cloud R2 へ push
 *   npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --apply
 *
 *   # 特定 slug を対象 (カンマ区切り or --slug 複数)
 *   npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --slug a,b,c --apply
 *
 *   # cloud に既にあっても強制再生成
 *   npx tsx apps/web/scripts/generate-blog-thumbnails-cloud.ts --slug a --force --apply
 *
 * push 後に公開 URL が 404 をキャッシュしている場合は CDN purge が要る
 * (storage.stats47.jp/app/blog/<slug>/* を purge)。
 */

import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// render lib (satori / sharp / react) は生成時のみ動的 import する。
// --audit モード (CI ゲート) は fetch だけで完結させ native binding に依存させない。

const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME ?? "stats47";
const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");

interface CliOptions {
  audit: boolean;
  apply: boolean;
  force: boolean;
  slugs: string[] | null;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const slugIdx = args.indexOf("--slug");
  const rawSlug = slugIdx !== -1 ? args[slugIdx + 1] : null;
  return {
    audit: args.includes("--audit"),
    apply: args.includes("--apply"),
    force: args.includes("--force"),
    slugs: rawSlug ? rawSlug.split(",").map((s) => s.trim()).filter(Boolean) : null,
  };
}

/** cloud の blog all.json から全 slug を列挙。 */
async function listAllSlugs(): Promise<string[]> {
  const res = await fetch(`${PUBLIC_URL}/app/blog/all.json`);
  if (!res.ok) throw new Error(`all.json fetch failed: ${res.status}`);
  const json = (await res.json()) as unknown;
  const arr = Array.isArray(json)
    ? json
    : Array.isArray((json as { articles?: unknown }).articles)
      ? (json as { articles: unknown[] }).articles
      : [];
  const slugs = arr
    .map((a) => (a && typeof a === "object" ? (a as { slug?: string }).slug : null))
    .filter((s): s is string => typeof s === "string" && s.length > 0);
  return [...new Set(slugs)];
}

/** cloud で thumbnail-light が 200 かつ画像か。 */
async function cloudThumbnailOk(slug: string): Promise<boolean> {
  try {
    const res = await fetch(`${PUBLIC_URL}/app/blog/${slug}/thumbnail-light.webp`, {
      method: "HEAD",
    });
    return res.ok && (res.headers.get("content-type") ?? "").includes("image");
  } catch {
    return false;
  }
}

/** article.md を公開 URL から取得 (frontmatter パースは呼び出し側で行う)。 */
async function fetchArticleMarkdown(slug: string): Promise<string | null> {
  const res = await fetch(`${PUBLIC_URL}/app/blog/${slug}/article.md`);
  if (!res.ok) return null;
  return res.text();
}

function putToR2(key: string, filePath: string, contentType: string): void {
  execFileSync(
    "npx",
    [
      "wrangler",
      "r2",
      "object",
      "put",
      `${BUCKET}/${key}`,
      `--file=${filePath}`,
      `--content-type=${contentType}`,
      "--remote",
    ],
    { stdio: "inherit", cwd: PROJECT_ROOT },
  );
}

async function main() {
  const opts = parseArgs();

  console.log(`公開URL: ${PUBLIC_URL} / bucket: ${BUCKET}`);
  console.log("対象 slug を解決中...");

  const allSlugs = opts.slugs ?? (await listAllSlugs());
  console.log(`候補 slug: ${allSlugs.length} 件`);

  // 監査: cloud で thumbnail が欠落している slug を抽出 (--force 時は全件生成対象)
  const missing: string[] = [];
  const targets: string[] = [];
  for (const slug of allSlugs) {
    const ok = await cloudThumbnailOk(slug);
    if (!ok) {
      missing.push(slug);
      console.log(`  [欠落] ${slug}`);
    }
    if (!ok || opts.force) targets.push(slug);
  }
  console.log(`\n欠落 (cloud thumbnail 非200/非画像): ${missing.length} 件 / 生成対象: ${targets.length} 件`);

  if (opts.audit) {
    console.log("\n--audit のため生成しません。生成は --audit を外して実行 (push は --apply)。");
    process.exit(missing.length > 0 ? 1 : 0);
  }

  if (targets.length === 0) {
    console.log("生成対象なし。完了。");
    return;
  }

  // 生成パスに入ってから render lib (satori/sharp) を読み込む
  const {
    buildElement,
    deriveOgpFromFrontmatter,
    loadFonts,
    parseFrontmatter,
    renderToPng,
    renderToWebP,
  } = await import("./lib/blog-thumbnail-render");

  console.log("\nフォント読み込み中...");
  const fonts = loadFonts(PROJECT_ROOT);

  const stage = mkdtempSync(join(tmpdir(), "blog-thumbs-"));
  let generated = 0;
  let pushed = 0;

  for (const slug of targets) {
    const md = await fetchArticleMarkdown(slug);
    const ogp = md ? deriveOgpFromFrontmatter(parseFrontmatter(md)) : null;
    if (!ogp) {
      console.log(`  [skip] ${slug}: article.md / frontmatter title 取得不可`);
      continue;
    }
    const data = { title: ogp.title, subtitle: ogp.subtitle ?? null, date: "", category: "BLOG" };
    const dir = join(stage, slug);
    mkdirSync(join(dir, "ogp"), { recursive: true });
    const lightOut = join(dir, "thumbnail-light.webp");
    const darkOut = join(dir, "thumbnail-dark.webp");
    const pngOut = join(dir, "ogp", "ogp.png");
    const ogpJsonOut = join(dir, "ogp", "ogp.json");

    process.stdout.write(`  ${slug} ... 生成`);
    await renderToWebP(buildElement(data, false), fonts, lightOut);
    await renderToWebP(buildElement(data, true), fonts, darkOut);
    await renderToPng(buildElement(data, false), fonts, pngOut);
    writeFileSync(
      ogpJsonOut,
      JSON.stringify({ title: ogp.title, subtitle: ogp.subtitle ?? null }, null, 2) + "\n",
      "utf-8",
    );
    generated++;

    if (opts.apply) {
      process.stdout.write(" → push");
      putToR2(`app/blog/${slug}/thumbnail-light.webp`, lightOut, "image/webp");
      putToR2(`app/blog/${slug}/thumbnail-dark.webp`, darkOut, "image/webp");
      putToR2(`app/blog/${slug}/ogp/ogp.png`, pngOut, "image/png");
      putToR2(`app/blog/${slug}/ogp/ogp.json`, ogpJsonOut, "application/json");
      pushed++;
      console.log(" ✓");
    } else {
      console.log(` (dry-run, /tmp 出力のみ: ${dir})`);
    }
  }

  console.log(`\n生成: ${generated} 件 / push: ${pushed} 件 (stage: ${stage})`);

  if (opts.apply && pushed > 0) {
    console.log("\ncloud 反映確認 (公開URL、CDN キャッシュで遅延の可能性あり)...");
    for (const slug of targets) {
      const ok = await cloudThumbnailOk(slug);
      console.log(`  ${ok ? "200 ✓" : "まだ404 (要 CDN purge)"}  ${slug}`);
    }
  } else if (!opts.apply) {
    console.log("\n--apply を付けると cloud R2 へ push します。");
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
