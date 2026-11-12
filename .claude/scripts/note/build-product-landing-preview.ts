#!/usr/bin/env tsx
/**
 * 商品台帳から note の無料部分だけを再生成する。公開記事・有料本文・添付には触れない。
 * npx tsx .claude/scripts/note/build-product-landing-preview.ts [--check] [--serve 4792]
 * 出力: .local/product-portfolio/note-landings/ (再生成できるローカル目視用の派生物)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { parseArgs } from "node:util";

import { STOREFRONT_PRODUCTS } from "../../../apps/web/src/features/products/storefront.generated";
import type { StorefrontProduct } from "../../../apps/web/src/features/products/types";
import { R2_PUBLIC_BASE_URL, SITE_ORIGIN } from "../lib/site-config.cjs";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const OUTPUT_DIRECTORY = path.join(PROJECT_ROOT, ".local/product-portfolio/note-landings");
const LOCAL_SITE_ORIGIN = "http://127.0.0.1:3000";
const LOCAL_IMAGE_ORIGIN = "http://127.0.0.1:4777";

type Block =
  | { kind: "heading"; level: 1 | 2 | 3; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: readonly { title?: string; text: string }[] }
  | { kind: "image"; key: string; alt: string }
  | { kind: "link"; text: string; href: string };

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
}[char] ?? char));
const escapeMarkdown = (value: string): string => value.replace(/[\\`*_{}\[\]<>#]/g, "\\$&");
const titleOf = (product: StorefrontProduct): string => product.displayTitle ?? product.title;
const priceOf = (product: StorefrontProduct): string => `${product.priceYen.toLocaleString("ja-JP")}円`;
const imageUrl = (origin: string, key: string): string => `${origin}/${key}`;

/** 公開前の突合結果は確認画面だけに置き、記事本文の Block には混ぜない。 */
function indicatorCountReview(product: StorefrontProduct): string {
  const countOf = (text: string | undefined): number | undefined => {
    const match = text?.normalize("NFKC").match(/(\d[\d,]*)\s*指標/);
    return match ? Number(match[1].replaceAll(",", "")) : undefined;
  };
  const titleCount = countOf(product.title);
  const deliveredCount = countOf(product.included.find((item) => /^\s*CSV\b/i.test(item)));
  if (titleCount === undefined || deliveredCount === undefined || titleCount === deliveredCount) return "";
  return `<aside aria-label="公開前の確認"><strong>販売記事名${titleCount.toLocaleString("ja-JP")}指標／固定納品${deliveredCount.toLocaleString("ja-JP")}指標：公開前に確認</strong></aside>`;
}

/** 見出し・本文・画像の並びは一度だけ組み、Markdown と HTML の両方が使う。 */
function articleBlocks(product: StorefrontProduct): Block[] {
  const blocks: Block[] = [
    { kind: "heading", level: 1, text: titleOf(product) },
    { kind: "paragraph", text: product.description },
    { kind: "paragraph", text: `販売価格：${priceOf(product)}` },
    { kind: "heading", level: 2, text: "含まれるもの" },
    { kind: "list", items: product.included.map((text) => ({ text })) },
    { kind: "heading", level: 2, text: "こんな用途に" },
    { kind: "list", items: (product.useCases ?? []).map(({ title, description }) => ({ title, text: description })) },
  ];
  const charts = product.showcase?.filter((section) => section.kind === "chart") ?? [];
  const files = product.showcase?.filter((section) => section.kind === "file") ?? [];
  if (charts.length) blocks.push({ kind: "heading", level: 2, text: "作成例" });
  for (const section of [...charts, ...files]) {
    blocks.push({ kind: "heading", level: section.kind === "chart" ? 3 : 2, text: section.heading });
    blocks.push({ kind: "paragraph", text: section.lead });
    for (const figure of section.figures) {
      blocks.push({ kind: "image", key: `app/products/${product.slug}/showcase/${figure.file}`, alt: figure.alt });
    }
  }
  if (product.showcaseNote) blocks.push({ kind: "paragraph", text: product.showcaseNote });
  blocks.push(
    { kind: "heading", level: 2, text: "購入前にご確認ください" },
    { kind: "list", items: (product.purchaseNotes ?? []).map((text) => ({ text })) },
    { kind: "link", text: "サイトで商品内容・作成例を見る", href: `${SITE_ORIGIN}/products/${product.slug}` },
  );
  return blocks;
}

function renderMarkdown(blocks: readonly Block[]): string {
  return `${blocks.map((block) => {
    switch (block.kind) {
      case "heading": return `${"#".repeat(block.level)} ${escapeMarkdown(block.text)}`;
      case "paragraph": return escapeMarkdown(block.text);
      case "list": return block.items.map((item) => `- ${item.title ? `**${escapeMarkdown(item.title)}**：` : ""}${escapeMarkdown(item.text)}`).join("\n");
      case "image": return `![${escapeMarkdown(block.alt)}](${imageUrl(R2_PUBLIC_BASE_URL, block.key)})`;
      case "link": return `[${escapeMarkdown(block.text)}](${block.href})`;
    }
  }).join("\n\n")}\n`;
}

function renderHtml(blocks: readonly Block[]): string {
  return blocks.map((block) => {
    switch (block.kind) {
      case "heading": return `<h${block.level}>${escapeHtml(block.text)}</h${block.level}>`;
      case "paragraph": return `<p>${escapeHtml(block.text)}</p>`;
      case "list": return `<ul>${block.items.map((item) => `<li>${item.title ? `<strong>${escapeHtml(item.title)}</strong>：` : ""}${escapeHtml(item.text)}</li>`).join("")}</ul>`;
      case "image": return `<figure><img src="${escapeHtml(imageUrl(LOCAL_IMAGE_ORIGIN, block.key))}" alt="${escapeHtml(block.alt)}" loading="lazy" decoding="async"><figcaption>${escapeHtml(block.alt)}</figcaption></figure>`;
      case "link": return `<p><a href="${escapeHtml(block.href.replace(SITE_ORIGIN, LOCAL_SITE_ORIGIN))}">${escapeHtml(block.text)}</a></p>`;
    }
  }).join("\n");
}

function htmlDocument(title: string, content: string): string {
  return `<!doctype html>
<html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${escapeHtml(title)}</title>
<style>
body{max-width:48rem;margin:0 auto;padding:1.25rem;font:1rem/1.9 system-ui,sans-serif;overflow-wrap:anywhere}
h1{font-size:1.6rem;line-height:1.5}h2{font-size:1.2rem;margin-top:2.5rem}h3{font-size:1rem;margin-top:2rem}
p,ul,figure{margin:1rem 0}ul{padding-left:1.4rem}li+li{margin-top:.65rem}img{display:block;max-width:100%;height:auto;margin:auto}figcaption{font-size:.8rem}
nav{display:flex;flex-wrap:wrap;gap:.5rem 1.25rem;margin:1.5rem 0}aside{font-size:.85rem}article+nav{margin-top:3rem}a{color:inherit;text-underline-offset:.2em}
</style></head><body>${content}</body></html>\n`;
}

function navigation(products: readonly StorefrontProduct[], index: number): string {
  const product = products[index];
  const previous = products[index - 1];
  const next = products[index + 1];
  return `<nav aria-label="商品プレビューの移動">
<a href="index.html">商品一覧</a>
${previous ? `<a href="${previous.slug}.html">前：${escapeHtml(titleOf(previous))}</a>` : ""}
${next ? `<a href="${next.slug}.html">次：${escapeHtml(titleOf(next))}</a>` : ""}
<a href="${LOCAL_SITE_ORIGIN}/products/${product.slug}" target="_blank" rel="noopener">サイトのLP</a>
<a href="${escapeHtml(product.externalUrl)}" target="_blank" rel="noopener">公開中のnote</a>
<a href="${product.slug}.md" download>無料部分のMarkdown</a>
</nav>`;
}

export function buildPreviewFiles(input: readonly StorefrontProduct[]): ReadonlyMap<string, string> {
  const products = input.filter((product) => product.channel === "note")
    .sort((left, right) => left.id.localeCompare(right.id, "en", { numeric: true }));
  if (!products.length) throw new Error("note 商品がありません");
  const ids = new Set<string>();
  const slugs = new Set<string>();
  for (const product of products) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) || ids.has(product.id) || slugs.has(product.slug)) {
      throw new Error(`${product.id}: 商品 ID・slug の重複または不正な slug`);
    }
    if (!product.description.trim() || !product.included.length || !product.useCases?.length ||
      !product.showcase?.some((section) => section.kind === "chart") || !product.purchaseNotes?.length) {
      throw new Error(`${product.id}: 商品説明・収録内容・用途・作成例・購入前確認が必要です`);
    }
    if (!Number.isFinite(product.priceYen) || product.priceYen < 0 || new URL(product.externalUrl).protocol !== "https:") {
      throw new Error(`${product.id}: 価格・販売先 URL が不正です`);
    }
    for (const section of product.showcase) {
      if (!section.heading.trim() || !section.lead.trim() || !section.figures.length ||
        section.figures.some((figure) => !/^[a-z0-9][a-z0-9._-]*\.png$/.test(figure.file) || !figure.alt.trim())) {
        throw new Error(`${product.id}: 作成例の見出し・説明・PNG・代替文が必要です`);
      }
    }
    ids.add(product.id);
    slugs.add(product.slug);
  }
  const files = new Map<string, string>();
  for (const [index, product] of products.entries()) {
    const blocks = articleBlocks(product);
    const nav = navigation(products, index);
    files.set(`${product.slug}.md`, renderMarkdown(blocks));
    files.set(`${product.slug}.html`, htmlDocument(titleOf(product), `${nav}
<aside>note 無料部分の初稿です。公開中の記事・有料部分・添付ファイルには反映していません。</aside>
${indicatorCountReview(product)}
<main><article>${renderHtml(blocks)}</article></main>${nav}`));
  }
  files.set("index.html", htmlDocument("データ商品のLP・note初稿", `<main>
<h1>データ商品のLP・note初稿</h1>
<p>${products.length} 商品の説明・用途・作成例を、同じ商品台帳から作成しています。</p>
<p>この画面は目視確認用です。note の無料部分のみを表示し、有料本文・添付ファイルは変更しません。</p>
<ol>${products.map((product) => `<li><strong>${escapeHtml(product.id)} ${escapeHtml(titleOf(product))}</strong>（${priceOf(product)}）
${indicatorCountReview(product)}
<nav><a href="${LOCAL_SITE_ORIGIN}/products/${product.slug}" target="_blank" rel="noopener">サイトのLP</a><a href="${product.slug}.html">note初稿</a><a href="${product.slug}.md" download>Markdown</a></nav></li>`).join("\n")}</ol>
</main>`));
  return files;
}

export function writePreviewFiles(files: ReadonlyMap<string, string>, directory: string, check: boolean): void {
  if (!check) mkdirSync(directory, { recursive: true });
  const stale: string[] = [];
  for (const [filename, content] of files) {
    const target = path.join(directory, filename);
    if (check) {
      if (!existsSync(target) || readFileSync(target, "utf8") !== content) stale.push(filename);
    } else writeFileSync(target, content, "utf8");
  }
  if (stale.length) throw new Error(`無料部分の派生プレビューを再生成してください: ${stale.join(", ")}`);
}

/** 出力一覧にある HTML/Markdown だけを配信し、リポジトリ全体を公開しない。 */
export function createPreviewServer(files: ReadonlyMap<string, string>, directory: string) {
  return createServer((request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, { Allow: "GET, HEAD" }).end();
      return;
    }
    const pathname = new URL(request.url ?? "/", "http://127.0.0.1").pathname;
    const filename = pathname === "/" ? "index.html" : pathname.slice(1);
    if (!files.has(filename)) {
      response.writeHead(404).end();
      return;
    }
    try {
      const content = readFileSync(path.join(directory, filename));
      response.writeHead(200, {
        "content-type": filename.endsWith(".md") ? "text/markdown; charset=utf-8" : "text/html; charset=utf-8",
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      response.end(request.method === "HEAD" ? undefined : content);
    } catch {
      response.writeHead(404).end();
    }
  });
}

function main(): void {
  const { values } = parseArgs({ options: { check: { type: "boolean" }, serve: { type: "string" } } });
  const port = values.serve === undefined ? undefined : Number(values.serve);
  if (port !== undefined && (!Number.isInteger(port) || port < 1 || port > 65_535)) {
    throw new Error("--serve は 1〜65535 のポート番号で指定してください");
  }
  const files = buildPreviewFiles(STOREFRONT_PRODUCTS);
  writePreviewFiles(files, OUTPUT_DIRECTORY, values.check ?? false);
  console.log(`${values.check ? "検証" : "生成"}: ${(files.size - 1) / 2} 商品 → ${OUTPUT_DIRECTORY}`);
  if (port !== undefined) {
    createPreviewServer(files, OUTPUT_DIRECTORY).listen(port, "127.0.0.1", () => {
      console.log(`目視確認: http://127.0.0.1:${port}/`);
    });
  }
}

if (require.main === module) {
  try { main(); } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
