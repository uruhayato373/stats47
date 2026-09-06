/** Bind a generated edition to its authored recipe and the chapters actually reviewed. */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import type { KindleBook } from "./types";
import { KINDLE_EDITORIAL_CORRECTIONS } from "./editorial-corrections";

const hash = (value: string | Buffer): string => createHash("sha256").update(value).digest("hex");
/** Current revision's editing participants. A receipt cannot omit its own author to claim independence. */
export function revisionEditorIds(bookId: string): string[] {
  const ids = ["/root"];
  if (/^K-S1-0[134567]$/.test(bookId) || /^K-S2-0[134567]$/.test(bookId)) ids.push("/root/kindle_theme_author_a");
  if (bookId === "K-S1-02" || bookId === "K-S2-01" || /^K-S2-(08|09|10|11)$/.test(bookId) || bookId === "K-S4-01") ids.push("/root/kindle_theme_author_b");
  if (/^K-S1-(08|09|10|11|12)$/.test(bookId) || bookId.startsWith("K-S3-")) ids.push("/root/kindle_region_author");
  return ids;
}
export function authoredBookSha256(book: KindleBook, factoryRoot: string): string {
  const fresh = book.chapters.filter(ch => ch.source === "fresh").map(ch => {
    if (!ch.freshFile) return { title: ch.title, text: ch.freshText ?? "" };
    const path = resolve(factoryRoot, ch.freshFile), rel = relative(resolve(factoryRoot), path);
    if (isAbsolute(ch.freshFile) || rel.startsWith("..") || isAbsolute(rel)) throw new Error("unsafe manuscript path");
    if (!existsSync(path)) return { title: ch.title, file: ch.freshFile, missing: true };
    const real = relative(realpathSync(factoryRoot), realpathSync(path));
    if (real.startsWith("..") || isAbsolute(real)) throw new Error("unsafe manuscript symlink");
    return { title: ch.title, file: ch.freshFile, sha256: hash(readFileSync(path)) };
  });
  const corrections = book.chapters.filter(ch => ch.blogSlug).map(ch => ({
    slug: ch.blogSlug, corrections: KINDLE_EDITORIAL_CORRECTIONS[ch.blogSlug!] ?? [],
  }));
  return hash(JSON.stringify({ book, fresh, corrections, editorIds: revisionEditorIds(book.id) }));
}

export interface ReviewedChapter { fileName: string; sha256: string }
interface SemanticReview {
  schemaVersion: 1; bookId: string; version: string; epubSha256: string;
  authoredSha256: string; verdict: "PASS" | "FAIL"; reviewedAt: string;
  reviewer: string; authorIds: string[]; scope: "all-chapters";
  chapters: ReviewedChapter[]; unresolvedFindings: string[];
}

/** A receipt is evidence, not permission to publish. Missing/stale/partial reviews fail closed. */
export function semanticReviewErrors(input: unknown, expected: {
  bookId: string; version: string; epubSha256: string; authoredSha256: string; chapters: ReviewedChapter[]; authorIds: readonly string[];
}): string[] {
  if (!input || typeof input !== "object") return ["independent semantic review missing"];
  const r = input as Partial<SemanticReview>;
  const errors: string[] = [];
  if (r.schemaVersion !== 1 || r.verdict !== "PASS" || r.scope !== "all-chapters") errors.push("full-book PASS required");
  const canonicalId = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9/_-]+$/.test(v);
  if (!canonicalId(r.reviewer) || !Array.isArray(r.authorIds) || !r.authorIds.length ||
    r.authorIds.some(id => !canonicalId(id)) || r.authorIds.includes(r.reviewer ?? "") ||
    !expected.authorIds.length || expected.authorIds.some(id => !r.authorIds?.includes(id)) ||
    expected.authorIds.includes(r.reviewer ?? "")) errors.push("independent reviewer identity required");
  if (typeof r.reviewedAt !== "string" || !Number.isFinite(Date.parse(r.reviewedAt))) errors.push("review date required");
  for (const key of ["bookId", "version", "epubSha256", "authoredSha256"] as const) {
    if (!expected[key] || r[key] !== expected[key]) errors.push(`review ${key} mismatch`);
  }
  if (!Array.isArray(r.unresolvedFindings) || r.unresolvedFindings.length) errors.push("unresolved review findings");
  const reviewed = Array.isArray(r.chapters) ? r.chapters : [];
  if (!expected.chapters.length || reviewed.length !== expected.chapters.length ||
    new Set(reviewed.map(ch => ch?.fileName)).size !== reviewed.length ||
    expected.chapters.some(ch => !reviewed.some(c => c?.fileName === ch.fileName && c.sha256 === ch.sha256))) errors.push("review chapter coverage mismatch");
  return errors;
}

export function chapterEvidence(chapters: readonly { fileName: string; bodyXhtml: string }[]): ReviewedChapter[] {
  return chapters.map(ch => ({ fileName: ch.fileName, sha256: hash(ch.bodyXhtml) }));
}

/** Extract hashes from actual EPUB bodies, not a self-reported metadata chapter list. */
export function xhtmlChapterEvidence(entries: readonly { fileName: string; xhtml: string }[]): ReviewedChapter[] {
  const chapters = entries.filter(e => !["nav.xhtml", "cover.xhtml"].includes(e.fileName));
  if (!chapters.length || new Set(chapters.map(c => c.fileName)).size !== chapters.length) throw new Error("invalid EPUB chapter population");
  return chapters.map(c => {
    const body = /<body>\n([\s\S]*)\n<\/body>/.exec(c.xhtml)?.[1];
    if (body === undefined) throw new Error(`missing EPUB body: ${c.fileName}`);
    return { fileName: c.fileName, sha256: hash(body) };
  });
}
