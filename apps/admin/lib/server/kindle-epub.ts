import "server-only";

import fs from "node:fs";
import path from "node:path";
import { inflateRawSync } from "node:zlib";

import { localKindleBooksDir, projectRoot } from "@/lib/server/project-root";
import { KDP_LISTINGS } from "../../../../config/paths.mjs";

/**
 * 出品台帳 (config/kdp-listings.json) の epubPath が指す入稿版の EPUB を読み、
 * 章ごとの本文・図・リンクを管理画面で見られる形にする (読むだけ。EPUB は書き換えない)。
 *
 * EPUB は ZIP なので、依存を増やさず node:zlib で読む (格納方式は無圧縮か deflate だけを認める)。
 */

export const BOOK_ID = /^K-S[1-4]-\d{2}$/;
const IMAGE_PATH = /^images\/[A-Za-z0-9_.-]+\.(?:png|jpe?g)$/;

/** ZIP の中央ディレクトリを読み、名前 → 中身の読み出し関数を返す。 */
export function readZip(buffer: Buffer): Map<string, () => Buffer> {
  const eocdMin = 22;
  let eocd = -1;
  for (let i = buffer.length - eocdMin; i >= Math.max(0, buffer.length - eocdMin - 0xffff); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error("zip: end of central directory not found");
  const count = buffer.readUInt16LE(eocd + 10);
  let offset = buffer.readUInt32LE(eocd + 16);
  const entries = new Map<string, () => Buffer>();
  for (let n = 0; n < count; n++) {
    if (buffer.readUInt32LE(offset) !== 0x02014b50) throw new Error("zip: bad central directory entry");
    const method = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const nameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localOffset = buffer.readUInt32LE(offset + 42);
    const name = buffer.toString("utf8", offset + 46, offset + 46 + nameLength);
    offset += 46 + nameLength + extraLength + commentLength;
    if (name.endsWith("/")) continue;
    entries.set(name, () => {
      if (buffer.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`zip: bad local header: ${name}`);
      const start = localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28);
      const data = buffer.subarray(start, start + compressedSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return inflateRawSync(data);
      throw new Error(`zip: unsupported compression method ${method}: ${name}`);
    });
  }
  return entries;
}

export interface KindleChapter {
  readonly id: string;
  readonly href: string;
  readonly title: string;
  /** body の中身。script・style・on* 属性を除き、画像は管理画面のルートへ向け直したもの */
  readonly html: string;
  readonly chars: number;
  readonly figures: number;
  /** 図の直後に説明の段落が続いていない図の数 */
  readonly figuresWithoutText: number;
  readonly siteLinks: number;
  readonly siteLinksWithUtm: number;
}

export interface KindleBookView {
  readonly id: string;
  readonly title: string;
  readonly asin: string | null;
  readonly epubPath: string;
  readonly modified: string | null;
  readonly chapters: readonly KindleChapter[];
}

function decodeEntities(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

function textOf(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, "")).replace(/\s+/g, "");
}

/** 本文の HTML を管理画面で表示できる形にする。中身は自分たちの生成物だが、念のため実行されるものは落とす。 */
export function sanitizeChapterHtml(body: string, bookId: string): string {
  return body
    .replace(/<script\b[\s\S]*?<\/script>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style>/gi, "")
    .replace(/\son[a-z]+="[^"]*"/gi, "")
    .replace(/(<img\b[^>]*\bsrc=")([^"]*)(")/gi, (_, open: string, src: string, close: string) =>
      IMAGE_PATH.test(src) ? `${open}/kindle-book/${bookId}/${src}${close}` : `${open}${close}`,
    )
    .replace(/(<a\b[^>]*)>/gi, (_, open: string) =>
      /\btarget=/.test(open) ? `${open}>` : `${open} target="_blank" rel="noopener noreferrer">`,
    );
}

/** 章 1 つ分の数字。図の直後の要素が段落でなければ「説明なし」と数える。 */
export function chapterMetrics(body: string) {
  const figures = [...body.matchAll(/<figure\b[\s\S]*?<\/figure>\s*(<[a-z0-9]+)?/gi)];
  const links = [...body.matchAll(/<a\b[^>]*\bhref="(https?:\/\/(?:www\.)?stats47\.jp[^"]*)"/gi)].map((m) => decodeEntities(m[1]));
  return {
    chars: textOf(body).length,
    figures: figures.length,
    figuresWithoutText: figures.filter((m) => m[1]?.toLowerCase() !== "<p").length,
    siteLinks: links.length,
    siteLinksWithUtm: links.filter((href) => /[?&]utm_source=/.test(href)).length,
  };
}

function attr(tag: string, name: string): string | null {
  return tag.match(new RegExp(`\\b${name}="([^"]*)"`))?.[1] ?? null;
}

/** EPUB の spine の順に、本文の章 (表紙・目次を除く) を読む。 */
export function parseEpub(buffer: Buffer, bookId: string) {
  const zip = readZip(buffer);
  const read = (name: string) => {
    const entry = zip.get(name);
    if (!entry) throw new Error(`epub: missing ${name}`);
    return entry().toString("utf8");
  };
  const container = read("META-INF/container.xml");
  const opfPath = attr(container.match(/<rootfile\b[^>]*>/)?.[0] ?? "", "full-path");
  if (!opfPath) throw new Error("epub: rootfile not found");
  const base = path.posix.dirname(opfPath);
  const opf = read(opfPath);
  const manifest = new Map<string, { href: string; properties: string }>();
  for (const [tag] of opf.matchAll(/<item\b[^>]*>/g)) {
    const id = attr(tag, "id");
    const href = attr(tag, "href");
    if (id && href) manifest.set(id, { href, properties: attr(tag, "properties") ?? "" });
  }
  const chapters: KindleChapter[] = [];
  for (const [tag] of opf.matchAll(/<itemref\b[^>]*>/g)) {
    const id = attr(tag, "idref");
    const item = id ? manifest.get(id) : undefined;
    if (!id || !item || /\b(?:nav|svg)\b/.test(item.properties)) continue;
    const xhtml = read(path.posix.join(base, item.href));
    const body = xhtml.match(/<body\b[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? "";
    const heading = xhtml.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ?? "";
    const title = decodeEntities(heading.replace(/<[^>]+>/g, "")).replace(/\s+/g, " ").trim() || item.href;
    chapters.push({ id, href: item.href, title, html: sanitizeChapterHtml(body, bookId), ...chapterMetrics(body) });
  }
  return {
    title: decodeEntities(opf.match(/<dc:title>([\s\S]*?)<\/dc:title>/)?.[1] ?? bookId),
    modified: opf.match(/<meta property="dcterms:modified">([^<]+)<\/meta>/)?.[1] ?? null,
    chapters,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** 出品台帳の入稿版 EPUB の場所。.local/kindle-books/<id>/ の外は認めない。 */
export function listedEpub(id: string): { file: string; epubPath: string; asin: string | null } | null {
  if (!BOOK_ID.test(id)) return null;
  const raw: unknown = JSON.parse(fs.readFileSync(path.join(projectRoot(), KDP_LISTINGS), "utf8"));
  const listing = isRecord(raw) && isRecord(raw.listings) ? raw.listings[id] : undefined;
  if (!isRecord(listing) || typeof listing.epubPath !== "string") return null;
  const epubPath = listing.epubPath.replaceAll("\\", "/");
  const file = path.resolve(projectRoot(), epubPath);
  const root = path.join(localKindleBooksDir(), id) + path.sep;
  if (!file.startsWith(root) || !file.endsWith(".epub") || !fs.existsSync(file)) return null;
  return { file, epubPath, asin: typeof listing.asin === "string" ? listing.asin : null };
}

export function readKindleBook(id: string): KindleBookView | null {
  const listed = listedEpub(id);
  if (!listed) return null;
  const book = parseEpub(fs.readFileSync(listed.file), id);
  return { id, title: book.title, asin: listed.asin, epubPath: listed.epubPath, modified: book.modified, chapters: book.chapters };
}

/** 図 1 枚だけを読む (章の HTML は組み立てない)。 */
export function readKindleImage(id: string, relative: string): Buffer | null {
  const listed = listedEpub(id);
  if (!listed || !IMAGE_PATH.test(relative)) return null;
  const zip = readZip(fs.readFileSync(listed.file));
  const container = zip.get("META-INF/container.xml")?.().toString("utf8") ?? "";
  const opfPath = attr(container.match(/<rootfile\b[^>]*>/)?.[0] ?? "", "full-path");
  if (!opfPath) return null;
  return zip.get(path.posix.join(path.posix.dirname(opfPath), relative))?.() ?? null;
}
