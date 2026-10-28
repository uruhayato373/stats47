#!/usr/bin/env node
/**
 * archive-blog-articles.mjs — 公開中のブログ本文 (R2 app/blog/<slug>/article.md) の版を private R2 に退避する。
 *
 * 本文の正本は公開 R2 だけで、公開後は git の outbox から消え、R2 を直接上書きすると履歴が残らない
 * (2026-10-28 に 7 月の本文の控えで改稿済みの記事を上書きしかけた)。note の記事と同じく、
 * 上書きの前後に版を `stats47-private:blog-archive/<slug>/<sha256>.md` へ不変保存し、読み戻して SHA を照合する。
 * 同じ SHA の版が既にあれば書かない (write-once)。消さない。
 *
 * 使い方:
 *   node .claude/scripts/blog/archive-blog-articles.mjs --slugs a,b   # 今の公開版を退避
 *   node .claude/scripts/blog/archive-blog-articles.mjs --all         # app/blog/all.json の全記事
 *   node .claude/scripts/blog/archive-blog-articles.mjs --file <path> --slug <slug>  # 手元の版 (上げる版) を退避
 *
 * 呼び元: blog-auto-publish.yml (公開の前後) / push-article-md-r2.ts (上書きの前後)。
 * 復元: 版の一覧は private R2 の `blog-archive/<slug>/` を list する。
 */
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { config } from "dotenv";

import { createR2Store } from "../note/lib/cover-storage.mjs";

const require = createRequire(import.meta.url);
// 手元では .env.local の S3 認証情報で書く (無ければ createR2Store が wrangler login に落ちる)。CI は env で渡す
config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..", ".env.local"), quiet: true });
const { R2_BUCKET, R2_PRIVATE_BUCKET, R2_PUBLIC_BASE_URL } = require("../lib/site-config.cjs");

export const ARCHIVE_PREFIX = "blog-archive";
// S3 経由の同時数。wrangler 経由 (S3 認証情報が無いとき) は Cloudflare API の流量制限 (HTTP 429) に当たりうる
const CONCURRENCY = 8;

export const archiveKey = (slug, sha256) => `${ARCHIVE_PREFIX}/${slug}/${sha256}.md`;
const sha256Of = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");

/**
 * 1 版を退避する。live が null (未公開) なら何もしない。
 * @param {string} slug
 * @param {Buffer|null} bytes
 * @param {{get(key:string):Promise<Buffer|null>, put(key:string, bytes:Buffer):Promise<void>}} archive
 * @returns {Promise<{slug:string, status:"absent"|"exists"|"stored", sha256?:string}>}
 */
export async function archiveVersion(slug, bytes, archive) {
  if (!bytes) return { slug, status: "absent" };
  const sha256 = sha256Of(bytes);
  const key = archiveKey(slug, sha256);
  const existing = await archive.get(key);
  if (existing) {
    if (sha256Of(existing) !== sha256) throw new Error(`${key}: 退避済みの版の SHA が名前と一致しない`);
    return { slug, status: "exists", sha256 };
  }
  await archive.put(key, bytes);
  const back = await archive.get(key);
  if (!back || sha256Of(back) !== sha256) throw new Error(`${key}: 読み戻した版の SHA が一致しない`);
  return { slug, status: "stored", sha256 };
}

async function listAllSlugs() {
  const res = await fetch(`${process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL}/app/blog/all.json`);
  if (!res.ok) throw new Error(`app/blog/all.json: HTTP ${res.status}`);
  const json = await res.json();
  const articles = Array.isArray(json) ? json : json.articles;
  if (!Array.isArray(articles)) throw new Error("app/blog/all.json に記事の配列が無い");
  return articles.map((a) => a.slug).filter(Boolean);
}

async function main(argv) {
  const arg = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : null;
  };
  const archive = createR2Store({ bucket: R2_PRIVATE_BUCKET });
  const file = arg("--file");
  if (file) {
    const slug = arg("--slug");
    if (!slug) throw new Error("--file には --slug が要る");
    const r = await archiveVersion(slug, fs.readFileSync(file), archive);
    console.log(`[archive] ${slug} ${r.status} ${r.sha256 ?? ""}`);
    return;
  }
  const slugs = argv.includes("--all") ? await listAllSlugs() : String(arg("--slugs") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  if (slugs.length === 0) throw new Error("--slugs a,b / --all / --file <path> --slug <slug> のどれかが要る");
  const live = createR2Store({ bucket: R2_BUCKET });
  const counts = { absent: 0, exists: 0, stored: 0 };
  const failed = [];
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, slugs.length) }, async () => {
      while (i < slugs.length) {
        const slug = slugs[i++];
        try {
          const r = await archiveVersion(slug, await live.get(`app/blog/${slug}/article.md`), archive);
          counts[r.status]++;
        } catch (e) {
          failed.push(`${slug}: ${e.message}`);
        }
      }
    }),
  );
  console.log(`[archive] ${slugs.length} 記事: 新規 ${counts.stored} / 退避済み ${counts.exists} / 未公開 ${counts.absent} / 失敗 ${failed.length}`);
  if (failed.length) {
    failed.forEach((f) => console.error(`  ${f}`));
    process.exit(1);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
