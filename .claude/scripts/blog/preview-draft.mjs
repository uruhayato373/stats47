#!/usr/bin/env node
/**
 * 公開前の記事を開発画面で本番と同じページとして見る。
 *
 *   npm run blog:preview -- --slug <slug>
 *
 * 開発サーバーの R2 の手前に小さなサーバーを置き、記事のファイルと索引の 1 行だけ contents/blog の下書きを重ねる。
 * それ以外は R2 の値をそのまま返す。Windows は開発サーバーの中継 (r2-dev-gateway.ps1) の先へ流すので、
 * 会社のプロキシの対応はそちらに任せる。ローカルの開発サーバーだけがここを読むので、本番には影響しない。
 */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { createRequire } from "node:module";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { buildPreviewEntry, parseFrontmatter } from "./lib/preview-draft-core.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../../..");
const { R2_PUBLIC_BASE_URL } = createRequire(import.meta.url)("../lib/site-config.cjs");
const UPSTREAM = process.platform === "win32" ? "http://127.0.0.1:4777" : R2_PUBLIC_BASE_URL;
const PORT = 4780;
const TYPES = { ".md": "text/markdown; charset=utf-8", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp" };

const arg = (name) => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
};
const slug = arg("--slug");
const draftDir = slug && join(ROOT, "contents/blog", slug);
if (!slug || !existsSync(join(draftDir, "article.md"))) {
  console.error(`下書きが無い: contents/blog/${slug ?? "<slug>"}/article.md`);
  process.exit(2);
}

const upstream = (path) => fetch(`${UPSTREAM}${path}`);

async function serveIndex(res, path) {
  const response = await upstream(path);
  const index = await response.json();
  const entry = buildPreviewEntry({ slug, frontmatter: parseFrontmatter(readFileSync(join(draftDir, "article.md"), "utf8")) });
  index.articles = [entry, ...index.articles.filter((a) => a.slug !== slug)];
  res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(index));
}

async function serveUpstream(res, path) {
  const response = await upstream(path);
  res.writeHead(response.status, { "content-type": response.headers.get("content-type") ?? "application/octet-stream", "access-control-allow-origin": "*" });
  res.end(Buffer.from(await response.arrayBuffer()));
}

const server = createServer(async (req, res) => {
  const path = new URL(req.url, "http://localhost").pathname;
  try {
    if (path === "/app/blog/all.json") return await serveIndex(res, path);
    const prefix = `/app/blog/${slug}/`;
    if (path.startsWith(prefix)) {
      const relative = normalize(path.slice(prefix.length));
      const file = join(draftDir, relative);
      if (!relative.startsWith("..") && existsSync(file)) {
        res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream", "access-control-allow-origin": "*", "cache-control": "no-store" });
        return res.end(readFileSync(file));
      }
    }
    return await serveUpstream(res, path);
  } catch (error) {
    console.error(`${path}: ${error instanceof Error ? error.message : error}`);
    res.writeHead(502).end();
  }
});

server.listen(PORT, () => {
  const base = `http://127.0.0.1:${PORT}`;
  console.log(`確認先: http://localhost:3000/blog/${slug}`);
  const env = { BLOG_PREVIEW_R2_URL: base, R2_PUBLIC_FETCH_URL: base, NEXT_PUBLIC_R2_PUBLIC_URL: base, BLOG_PREVIEW_SLUG: slug };
  spawn("npm", ["run", "dev:web"], { cwd: ROOT, stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, ...env } });
});
