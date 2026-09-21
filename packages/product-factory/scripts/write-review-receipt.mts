#!/usr/bin/env -S npx tsx
/**
 * 独立意味レビューの受領証 `review.json` を、対象版の実 EPUB・検証レポート・review.md から組む。
 *
 * `verify-publishable.mts` / `kdp-release-gate.mjs` は review.md (人が読む判定) ではなく
 * `review.json` (機械が照合する受領証: bookId / version / epubSha256 / authoredSha256 / 全章 sha256 /
 * 独立した reviewer id) を見る (`src/channels/kindle/revision-evidence.ts`)。受領証は **評価そのもの
 * ではなく評価の写し**なので、次を満たすときだけ書く:
 *   - `<dir>/review.md` の frontmatter が `verdict: PASS` である
 *   - `--report` で作った検証レポートに、この版の EPUB SHA と全章 SHA が載っている (epubcheck 実行済み)
 *   - metadata.authoredSha256 が現行原稿と一致する (再生成が要る版には書かない)
 *
 * Usage:
 *   npx tsx packages/product-factory/scripts/write-review-receipt.mts \
 *     --book K-S1-01 --version v3-20260919-r9 --reviewer /agents/blog-critic [--force]
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { BOOK_BY_ID } from "../src/channels/kindle/book-catalog";
import { authoredBookSha256, revisionEditorIds, semanticReviewErrors } from "../src/channels/kindle/revision-evidence";

const HERE = dirname(fileURLToPath(import.meta.url));
const PF_ROOT = resolve(HERE, "..");
const ROOT = resolve(PF_ROOT, "../..");

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const id = arg("book");
  const version = arg("version");
  const reviewer = arg("reviewer");
  if (!id || !version || !reviewer) throw new Error("--book / --version / --reviewer は必須");
  if (!/^[a-z0-9/_-]+$/.test(reviewer)) throw new Error("reviewer は canonical id (/agents/… の形) で指定する");
  const book = BOOK_BY_ID.get(id);
  if (!book) throw new Error(`未知の bookId: ${id}`);
  const dir = join(ROOT, ".local/kindle-books", id, version);
  const epubPath = join(dir, "book.epub");
  if (!existsSync(epubPath)) throw new Error(`EPUB が無い: ${epubPath}`);

  const reviewMd = readFileSync(join(dir, "review.md"), "utf8");
  const verdict = /^verdict:\s*(\S+)/m.exec(reviewMd)?.[1];
  if (verdict !== "PASS") throw new Error(`review.md の verdict が PASS ではない (${verdict ?? "無し"})`);
  const reviewedAt = /^date:\s*(\S+)/m.exec(reviewMd)?.[1] ?? new Date().toISOString().slice(0, 10);

  const reportPath = join(ROOT, ".claude/state/products", `kindle-${version}-verification.json`);
  if (!existsSync(reportPath)) throw new Error(`検証レポートが無い: ${reportPath} (verify-epub.mts --report で作る)`);
  const verification = JSON.parse(readFileSync(reportPath, "utf8")) as {
    epubcheckExecuted?: boolean;
    report?: Array<{ id: string; version: string; epubSha256: string; errors: number; chapters?: Array<{ fileName: string; sha256: string }> }>;
  };
  if (verification.epubcheckExecuted !== true) throw new Error("検証レポートは epubcheck 実行済みでなければならない");
  const epubSha256 = createHash("sha256").update(readFileSync(epubPath)).digest("hex");
  const entry = verification.report?.find((r) => r.id === id && r.version === version && r.epubSha256 === epubSha256);
  if (!entry || entry.errors !== 0 || !entry.chapters?.length) throw new Error("検証レポートにこの版の EPUB (SHA 一致・error 0・章 SHA) が無い");

  const metadata = JSON.parse(readFileSync(join(dir, "metadata.json"), "utf8")) as { authoredSha256?: string };
  const authoredSha256 = authoredBookSha256(book, PF_ROOT);
  if (metadata.authoredSha256 !== authoredSha256) throw new Error("metadata.authoredSha256 が現行原稿と一致しない (再生成が要る)");

  const receipt = {
    schemaVersion: 1 as const,
    bookId: id,
    version,
    epubSha256,
    authoredSha256,
    verdict: "PASS" as const,
    reviewedAt,
    reviewer,
    authorIds: revisionEditorIds(id),
    scope: "all-chapters" as const,
    chapters: entry.chapters,
    unresolvedFindings: [] as string[],
    basis: {
      reviewMd: `.local/kindle-books/${id}/${version}/review.md`,
      note: "review.md の PASS 判定 (full 審査 → delta 再審査の連鎖) を、この版の実 EPUB 章 SHA に結び付けた受領証。据え置き MINOR (図データ側・ブログ側工程) は review.md に記載。",
    },
  };
  const errors = semanticReviewErrors(receipt, { bookId: id, version, epubSha256, authoredSha256, chapters: entry.chapters, authorIds: revisionEditorIds(id) });
  if (errors.length) throw new Error(`受領証が契約を満たさない: ${errors.join(" / ")}`);
  const out = join(dir, "review.json");
  if (existsSync(out) && !process.argv.includes("--force")) throw new Error(`既に存在する: ${out} (--force で上書き)`);
  writeFileSync(out, `${JSON.stringify(receipt, null, 2)}\n`);
  console.log(`✅ ${id} ${version}: review.json (${entry.chapters.length} 章, reviewer ${reviewer})`);
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
