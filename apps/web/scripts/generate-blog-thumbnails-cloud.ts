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
  // --- AI 背景 (blog OGP AI パイプライン。docs/02_実装計画/23) ---
  aiBackground: boolean;
  limit: number | null;
  maxAttempts: number;
  budgetUsd: number;
  forceBackground: boolean;
  visualTypeOverride: string | null;
}

function numArg(args: string[], flag: string, def: number): number {
  const i = args.indexOf(flag);
  if (i === -1) return def;
  const v = Number(args[i + 1]);
  return Number.isFinite(v) ? v : def;
}

function strArg(args: string[], flag: string): string | null {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : null;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const rawSlug = strArg(args, "--slug");
  const rawLimit = strArg(args, "--limit");
  return {
    audit: args.includes("--audit"),
    apply: args.includes("--apply"),
    force: args.includes("--force"),
    slugs: rawSlug ? rawSlug.split(",").map((s) => s.trim()).filter(Boolean) : null,
    aiBackground: args.includes("--ai-background"),
    limit: rawLimit ? Math.max(0, Math.floor(Number(rawLimit)) || 0) : null,
    maxAttempts: Math.min(Math.max(numArg(args, "--max-attempts", 2), 1), 3),
    budgetUsd: numArg(args, "--budget-usd", 2),
    forceBackground: args.includes("--force-background"),
    visualTypeOverride: strArg(args, "--visual-type"),
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

/** 同期スリープ (execFileSync ベースの逐次処理内で使う)。 */
function sleepSync(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/**
 * R2 へ put。wrangler の一時的な `fetch failed` 等で 1 回落ちても
 * バッチ全体を止めないよう、指数バックオフで最大 MAX_ATTEMPTS 回リトライする。
 * 全リトライ失敗時のみ throw (呼び出し側で slug 単位に握って継続)。
 */
function putToR2(key: string, filePath: string, contentType: string): void {
  const MAX_ATTEMPTS = 4;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
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
        { stdio: attempt === 1 ? "inherit" : "ignore", cwd: PROJECT_ROOT },
      );
      return;
    } catch (e) {
      if (attempt === MAX_ATTEMPTS) throw e;
      const waitMs = 2000 * attempt; // 2s, 4s, 6s
      console.log(`\n  [retry ${attempt}/${MAX_ATTEMPTS - 1}] ${key} (${waitMs}ms 後)`);
      sleepSync(waitMs);
    }
  }
}

/**
 * 既存 AI 背景がキャッシュ命中か。ogp.json の background.promptHash が一致し、
 * background.webp が 200 なら再利用可能 (API を呼ばない)。エラーは false 扱い。
 */
async function bgCacheHit(slug: string, promptHash: string): Promise<boolean> {
  try {
    const res = await fetch(`${PUBLIC_URL}/app/blog/${slug}/ogp/ogp.json`);
    if (!res.ok) return false;
    const json = (await res.json()) as { background?: { promptHash?: string } };
    if (json.background?.promptHash !== promptHash) return false;
    const bg = await fetch(`${PUBLIC_URL}/app/blog/${slug}/ogp/background.webp`, {
      method: "HEAD",
    });
    return bg.ok && (bg.headers.get("content-type") ?? "").includes("image");
  } catch {
    return false;
  }
}

async function main() {
  const opts = parseArgs();

  console.log(`公開URL: ${PUBLIC_URL} / bucket: ${BUCKET}`);
  console.log("対象 slug を解決中...");

  let allSlugs = opts.slugs ?? (await listAllSlugs());
  // AI 背景は既存サムネの背景を差し替える用途なので全記事が対象。--limit を候補に先に適用して
  // 無駄な thumbnail HEAD チェックを避ける (欠落監査の従来モードとは対象選定が異なる)。
  if (opts.aiBackground && opts.limit != null && opts.limit < allSlugs.length) {
    allSlugs = allSlugs.slice(0, opts.limit);
  }
  console.log(`候補 slug: ${allSlugs.length} 件`);

  // 監査: cloud で thumbnail が欠落している slug を抽出 (--force / --ai-background 時は全件対象)
  const missing: string[] = [];
  const targets: string[] = [];
  for (const slug of allSlugs) {
    const ok = await cloudThumbnailOk(slug);
    if (!ok) {
      missing.push(slug);
      console.log(`  [欠落] ${slug}`);
    }
    if (!ok || opts.force || opts.aiBackground) targets.push(slug);
  }
  console.log(`\n欠落 (cloud thumbnail 非200/非画像): ${missing.length} 件 / 生成対象: ${targets.length} 件`);

  if (opts.limit != null && opts.limit < targets.length) {
    targets.length = opts.limit;
    console.log(`--limit ${opts.limit} 適用 → 生成対象: ${targets.length} 件`);
  }

  if (opts.audit) {
    console.log("\n--audit のため生成しません。生成は --audit を外して実行 (push は --apply)。");
    process.exit(missing.length > 0 ? 1 : 0);
  }

  if (targets.length === 0) {
    console.log("生成対象なし。完了。");
    return;
  }

  // AI 背景の純粋監査 (bulk = --slug なし): API を呼ばず生成予定・最大費用のみ出す (§7)。
  if (opts.aiBackground && !opts.slugs) {
    const { deriveOgpFromFrontmatter, parseFrontmatter } = await import(
      "./lib/blog-thumbnail-render"
    );
    const { resolveOgpVisual, parseOgpVisualFrontmatter, computePromptHash } = await import(
      "./lib/blog-ogp-visual"
    );
    const { OGP_MODEL, OGP_PRICE_PER_IMAGE_USD, OGP_PROMPT_VERSION } = await import(
      "./data/blog-ogp-visual-catalog"
    );
    let cacheHit = 0;
    let newGen = 0;
    const byType: Record<string, number> = {};
    for (const slug of targets) {
      const md = await fetchArticleMarkdown(slug);
      if (!md) continue;
      const visual = resolveOgpVisual(parseOgpVisualFrontmatter(md));
      byType[visual.visualType] = (byType[visual.visualType] ?? 0) + 1;
      const derived = deriveOgpFromFrontmatter(parseFrontmatter(md));
      const title = derived?.title ?? slug;
      const hash = computePromptHash({ ...visual, title });
      if (!opts.forceBackground && (await bgCacheHit(slug, hash))) cacheHit++;
      else newGen++;
    }
    const cappedNewGen = Math.min(newGen, Math.floor(opts.budgetUsd / OGP_PRICE_PER_IMAGE_USD));
    const maxCost = cappedNewGen * OGP_PRICE_PER_IMAGE_USD;
    console.log("\n=== AI 背景 dry-run (純粋監査・API 呼び出しなし) ===");
    console.log(`model: ${OGP_MODEL} / promptVersion: ${OGP_PROMPT_VERSION} / 単価: $${OGP_PRICE_PER_IMAGE_USD}/枚`);
    console.log(`対象: ${targets.length} 件 / キャッシュ命中: ${cacheHit} / 新規生成予定: ${newGen}`);
    console.log(
      `visualType 内訳: ${Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(" / ") || "(なし)"}`,
    );
    console.log(
      `budget 上限: $${opts.budgetUsd} → 予算内で生成可能: ${cappedNewGen} 件 / 最大推定費用: $${maxCost.toFixed(3)} (約 ${Math.round(maxCost * 150)}円, 為替・税別)`,
    );
    if (newGen > cappedNewGen) {
      console.log(`⚠ budget $${opts.budgetUsd} では ${newGen - cappedNewGen} 件が生成対象外。--budget-usd を上げるか --limit を下げてください。`);
    }
    console.log("R2 へは書き込みません (--apply なし・純粋監査)。1 記事生成は --slug <slug> で。");
    return;
  }

  // 生成パスに入ってから render lib (satori/sharp) を読み込む
  const {
    buildElement,
    deriveOgpFromFrontmatter,
    loadFonts,
    normalizeAiBackground,
    parseFrontmatter,
    renderToPng,
    renderToWebP,
  } = await import("./lib/blog-thumbnail-render");

  // AI 背景の依存 (aiBackground 時のみ)
  const ai = opts.aiBackground
    ? {
        ...(await import("./lib/blog-ogp-visual")),
        ...(await import("./lib/gemini-image-client")),
        ...(await import("./data/blog-ogp-visual-catalog")),
        apiKey: process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? null,
      }
    : null;
  let spentUsd = 0;
  if (ai && !ai.apiKey) {
    console.log("⚠ GEMINI_API_KEY 未設定。AI 背景は全件ブランド背景へフォールバックします。");
  }

  console.log("\nフォント読み込み中...");
  const fonts = loadFonts(PROJECT_ROOT);

  const stage = mkdtempSync(join(tmpdir(), "blog-thumbs-"));
  let generated = 0;
  let pushed = 0;
  const failed: string[] = [];

  for (const slug of targets) {
    // 1 記事の失敗 (fetch failed 等) でバッチ全体を止めない。失敗は failed に積んで継続。
    try {
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
      const bgOut = join(dir, "ogp", "background.webp");
      const ogpJsonOut = join(dir, "ogp", "ogp.json");

      // --- AI 背景解決 (aiBackground 時のみ。失敗・予算切れ・key 無しはブランド背景へ) ---
      let bgLight: string | undefined;
      let bgDark: string | undefined;
      let bgBuffer: Buffer | undefined;
      let bgMeta: Record<string, unknown> | undefined;
      if (ai) {
        const visual = ai.resolveOgpVisual({
          ...ai.parseOgpVisualFrontmatter(md ?? ""),
          ...(opts.visualTypeOverride ? { ogpVisualType: opts.visualTypeOverride } : {}),
        });
        const hash = ai.computePromptHash({ ...visual, title: ogp.title });
        if (!opts.forceBackground && (await bgCacheHit(slug, hash))) {
          console.log(`  [cache] ${slug} (背景 hash 一致・再生成不要)`);
          continue;
        }
        const meta = {
          provider: "google",
          model: ai.OGP_MODEL,
          visualType: visual.visualType,
          motif: visual.motif,
          promptVersion: ai.OGP_PROMPT_VERSION,
          promptHash: hash,
        };
        if (ai.apiKey && spentUsd + ai.OGP_PRICE_PER_IMAGE_USD <= opts.budgetUsd) {
          try {
            const img = await ai.generateBackgroundImage({
              prompt: ai.buildOgpPrompt({ ...visual, title: ogp.title }),
              apiKey: ai.apiKey,
              maxAttempts: opts.maxAttempts,
              onAttempt: (i) => process.stdout.write(` [ai a${i.attempt}:${i.classification}]`),
            });
            spentUsd += ai.OGP_PRICE_PER_IMAGE_USD;
            bgBuffer = img.buffer;
            bgLight = await normalizeAiBackground(img.buffer, false);
            bgDark = await normalizeAiBackground(img.buffer, true);
            bgMeta = { ...meta, generatedAt: new Date().toISOString(), source: "ai" };
          } catch (e) {
            const cls = e instanceof ai.GeminiImageError ? e.classification : "error";
            console.log(`\n  [ai-fallback] ${slug}: ${cls} → ブランド背景`);
            bgMeta = { visualType: visual.visualType, motif: visual.motif, source: "brand-fallback" };
          }
        } else {
          const reason = !ai.apiKey ? "GEMINI_API_KEY 無し" : `budget $${opts.budgetUsd} 到達`;
          console.log(`  [ai-skip] ${slug}: ${reason} → ブランド背景`);
          bgMeta = { visualType: visual.visualType, motif: visual.motif, source: "brand-fallback" };
        }
      }

      process.stdout.write(`  ${slug} ... 生成`);
      await renderToWebP(buildElement(data, false, { background: true, backgroundImage: bgLight }), fonts, lightOut);
      await renderToWebP(buildElement(data, true, { background: true, backgroundImage: bgDark }), fonts, darkOut);
      await renderToPng(buildElement(data, false, { background: true, backgroundImage: bgLight }), fonts, pngOut);
      if (bgBuffer && bgLight) {
        // AI 背景 (light 正規化版) を派生成果物として保存
        writeFileSync(bgOut, Buffer.from(bgLight.replace(/^data:image\/webp;base64,/, ""), "base64"));
      }
      writeFileSync(
        ogpJsonOut,
        JSON.stringify(
          { title: ogp.title, subtitle: ogp.subtitle ?? null, ...(bgMeta ? { background: bgMeta } : {}) },
          null,
          2,
        ) + "\n",
        "utf-8",
      );
      generated++;

      if (opts.apply) {
        process.stdout.write(" → push");
        putToR2(`app/blog/${slug}/thumbnail-light.webp`, lightOut, "image/webp");
        putToR2(`app/blog/${slug}/thumbnail-dark.webp`, darkOut, "image/webp");
        putToR2(`app/blog/${slug}/ogp/ogp.png`, pngOut, "image/png");
        putToR2(`app/blog/${slug}/ogp/ogp.json`, ogpJsonOut, "application/json");
        if (bgBuffer) putToR2(`app/blog/${slug}/ogp/background.webp`, bgOut, "image/webp");
        pushed++;
        console.log(" ✓");
      } else {
        console.log(` (dry-run, /tmp 出力のみ: ${dir})`);
      }
    } catch (err) {
      failed.push(slug);
      console.log(`\n  [fail] ${slug}: ${String((err as Error)?.message ?? err).slice(0, 120)}`);
    }
  }

  console.log(`\n生成: ${generated} 件 / push: ${pushed} 件 / 失敗: ${failed.length} 件 (stage: ${stage})`);
  if (failed.length > 0) {
    console.log(`失敗 slug (再実行対象): ${failed.join(",")}`);
  }

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
