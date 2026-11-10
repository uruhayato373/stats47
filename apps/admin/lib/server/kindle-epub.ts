import "server-only";

import fs from "node:fs";
import path from "node:path";

import { localKindleBooksDir, projectRoot } from "@/lib/server/project-root";
import { KDP_LISTINGS } from "../../../../config/paths.mjs";
import {
  epubBase,
  parseEpub,
  readZip,
  type ChapterMetrics,
} from "../../../../packages/product-factory/src/channels/kindle/epub-inspect";

/**
 * 出品台帳 (data/products/kdp/listings.json) の epubPath が指す入稿版の EPUB を、管理画面で章ごとに読める形にする
 * (読むだけ。EPUB は書き換えない)。章の読み出しと数え方は product-factory の epub-inspect.ts と共通。
 */

export const BOOK_ID = /^K-S[1-4]-\d{2}$/;
const IMAGE_PATH = /^images\/[A-Za-z0-9_.-]+\.(?:png|jpe?g)$/;

export interface KindleChapter extends ChapterMetrics {
  readonly id: string;
  readonly href: string;
  readonly title: string;
  /** body の中身。script・style・on* 属性を除き、画像は管理画面のルートへ向け直したもの */
  readonly html: string;
}

export interface KindleBookView {
  readonly id: string;
  readonly title: string;
  readonly asin: string | null;
  readonly epubPath: string;
  readonly modified: string | null;
  readonly chapters: readonly KindleChapter[];
}

/** 実行されるもの: script / style の要素と開き・閉じタグの残り、イベント属性 (引用符の種類を問わない) */
const EXECUTABLE_PATTERNS = [
  /<script\b[\s\S]*?<\/script\b[^>]*>/gi,
  /<style\b[\s\S]*?<\/style\b[^>]*>/gi,
  /<\/?(?:script|style)\b[^>]*>/gi,
  /\son[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi,
];

/** 1 回の置換で消した結果に新しい一致ができる入れ子 (`<scr<script>ipt>` など) も残さないよう、変わらなくなるまで繰り返す */
function stripExecutable(html: string): string {
  let current = html;
  for (;;) {
    const next = EXECUTABLE_PATTERNS.reduce((text, pattern) => text.replace(pattern, ""), current);
    if (next === current) return next;
    current = next;
  }
}

/** 本文の HTML を管理画面で表示できる形にする。中身は自分たちの生成物だが、念のため実行されるものは落とす。 */
export function sanitizeChapterHtml(body: string, bookId: string, version?: string | null): string {
  const query = version ? `?version=${encodeURIComponent(version)}` : "";
  return stripExecutable(body)
    .replace(/(<img\b[^>]*\bsrc=")([^"]*)(")/gi, (_, open: string, src: string, close: string) =>
      IMAGE_PATH.test(src) ? `${open}/kindle-book/${bookId}/${src}${query}${close}` : `${open}${close}`,
    )
    .replace(/(<a\b[^>]*)>/gi, (_, open: string) =>
      /\btarget=/.test(open) ? `${open}>` : `${open} target="_blank" rel="noopener noreferrer">`,
    );
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

const VERSION = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

/** 出品台帳の入稿版、または version を指定したときは手元の .local/kindle-books/<id>/<version>/book.epub (改訂の見比べ用)。 */
export function bookEpub(id: string, version?: string | null): { file: string; epubPath: string; asin: string | null } | null {
  const listed = listedEpub(id);
  if (!version) return listed;
  if (!BOOK_ID.test(id) || !VERSION.test(version)) return null;
  const file = path.join(localKindleBooksDir(), id, version, "book.epub");
  if (!fs.existsSync(file)) return null;
  return { file, epubPath: path.relative(projectRoot(), file), asin: listed?.asin ?? null };
}

/** 手元にある版の一覧 (新しい順)。 */
export function localVersions(id: string): string[] {
  if (!BOOK_ID.test(id)) return [];
  const dir = path.join(localKindleBooksDir(), id);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((name) => VERSION.test(name) && fs.existsSync(path.join(dir, name, "book.epub")))
    .sort((a, b) => fs.statSync(path.join(dir, b)).mtimeMs - fs.statSync(path.join(dir, a)).mtimeMs);
}

export function readKindleBook(id: string, version?: string | null): KindleBookView | null {
  const listed = bookEpub(id, version);
  if (!listed) return null;
  const book = parseEpub(fs.readFileSync(listed.file));
  return {
    id,
    title: book.title || id,
    asin: listed.asin,
    epubPath: listed.epubPath,
    modified: book.modified,
    chapters: book.chapters.map(({ body, ...chapter }) => ({ ...chapter, html: sanitizeChapterHtml(body, id, version) })),
  };
}

/** 図 1 枚だけを読む (章の HTML は組み立てない)。 */
export function readKindleImage(id: string, relative: string, version?: string | null): Buffer | null {
  const listed = bookEpub(id, version);
  if (!listed || !IMAGE_PATH.test(relative)) return null;
  const zip = readZip(fs.readFileSync(listed.file));
  return zip.get(path.posix.join(path.posix.dirname(epubBase(zip)), relative))?.() ?? null;
}
