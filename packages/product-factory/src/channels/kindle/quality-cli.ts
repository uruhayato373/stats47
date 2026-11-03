/**
 * 既刊 Kindle の中身の機械の検査 (KINDLE-QUALITY-LOOP-01 の 1 段目)。
 *
 *   npm run kindle:quality              # 要約を表示する
 *   npm run kindle:quality -- --write   # data/products/kindle-quality.json に記録する
 *
 * 対象は出品台帳で販売中 (kdpStatus=live) の本。読むのは台帳の epubPath が指す入稿版で、EPUB は .local にしか無い
 * (Mac でだけ動く。CI では EPUB が無いので epub-missing になる)。
 */
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseEpub } from "./epub-inspect";
import { bookQuality, qualitySummary } from "./kindle-quality";
import { KDP_LISTINGS } from "../../../../../config/paths.mjs";
import { datasetPath } from "../../../../../config/datasets.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const OUT_PATH = resolve(REPO_ROOT, datasetPath("kindle.quality"));
/** 唯一売れた本を基準にする (2026-08 に 1 冊)。 */
const BASELINE_BOOK_ID = "K-S1-02";

const listings = (JSON.parse(readFileSync(resolve(REPO_ROOT, KDP_LISTINGS), "utf8")) as {
  listings: Record<string, { kdpStatus?: string; epubPath?: string | null }>;
}).listings;

const books = Object.entries(listings)
  .filter(([, listing]) => listing.kdpStatus === "live")
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([id, listing]) => {
    const epubPath = listing.epubPath ? listing.epubPath.replace(/\\/g, "/") : null;
    const file = epubPath ? resolve(REPO_ROOT, epubPath) : null;
    if (!file || !file.startsWith(resolve(REPO_ROOT, ".local/kindle-books", id)) || !existsSync(file)) {
      return bookQuality({ id, epubPath, epubSha256: null, parsed: null });
    }
    const buffer = readFileSync(file);
    return bookQuality({
      id,
      epubPath,
      epubSha256: createHash("sha256").update(buffer).digest("hex"),
      parsed: parseEpub(buffer),
    });
  });

const report = {
  schemaVersion: 1 as const,
  generatedAt: new Date().toISOString(),
  baselineBookId: BASELINE_BOOK_ID,
  summary: qualitySummary(books, BASELINE_BOOK_ID),
  books,
};

for (const book of books) {
  const counts = book.flags.reduce<Record<string, number>>((acc, flag) => ({ ...acc, [flag.code]: (acc[flag.code] ?? 0) + 1 }), {});
  console.log(
    book.status === "measured"
      ? `${book.id} 文字 ${book.chars} 図 ${book.figures} (1万字 ${book.figuresPer10kChars}) 説明なし ${book.figuresWithoutText} 全県表 ${book.fullTables} 印 ${JSON.stringify(counts)}`
      : `${book.id} EPUB なし (${book.epubPath ?? "epubPath 未登録"})`,
  );
}
console.log(JSON.stringify(report.summary));

if (process.argv.includes("--write")) {
  mkdirSync(dirname(OUT_PATH), { recursive: true });
  writeFileSync(OUT_PATH, `${JSON.stringify(report, null, 2)}\n`);
  console.error(`kindle quality: wrote ${OUT_PATH}`);
}
