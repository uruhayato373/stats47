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
 * 出品台帳 (config/kdp-listings.json) の epubPath が指す入稿版の EPUB を、管理画面で章ごとに読める形にする
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
  const book = parseEpub(fs.readFileSync(listed.file));
  return {
    id,
    title: book.title || id,
    asin: listed.asin,
    epubPath: listed.epubPath,
    modified: book.modified,
    chapters: book.chapters.map(({ body, ...chapter }) => ({ ...chapter, html: sanitizeChapterHtml(body, id) })),
  };
}

/** 図 1 枚だけを読む (章の HTML は組み立てない)。 */
export function readKindleImage(id: string, relative: string): Buffer | null {
  const listed = listedEpub(id);
  if (!listed || !IMAGE_PATH.test(relative)) return null;
  const zip = readZip(fs.readFileSync(listed.file));
  return zip.get(path.posix.join(path.posix.dirname(epubBase(zip)), relative))?.() ?? null;
}
