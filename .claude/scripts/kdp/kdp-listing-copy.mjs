#!/usr/bin/env node
/**
 * KDP の紹介文とキーワードの原稿を組み立てて検査し、承認済みの原稿を出品台帳へ写す。
 *
 *   node .claude/scripts/kdp/kdp-listing-copy.mjs check             # 販売中の全冊を監査する (失敗で exit 1)
 *   node .claude/scripts/kdp/kdp-listing-copy.mjs render --id K-S1-02  # 組み上がった紹介文を表示する
 *   node .claude/scripts/kdp/kdp-listing-copy.mjs apply --id K-S1-02   # 承認済みの原稿を台帳へ写す (KDP には触らない)
 *
 * 台帳の description と keywords はこの原稿から作る。手で台帳を直さない。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import JSZip from "jszip";
import { datasetPath } from "../../../config/datasets.mjs";
import { KDP_LISTINGS, KDP_LISTING_COPY } from "../../../config/paths.mjs";
import { auditListingCopy, hasCurrentReview, previousEditionDisclaimer, renderListingDescription } from "./lib/kdp-listing-copy.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const readJson = (path) => JSON.parse(readFileSync(resolve(ROOT, path), "utf8"));
const [command, ...rest] = process.argv.slice(2);
const targetId = rest[rest.indexOf("--id") + 1];

const ledger = readJson(KDP_LISTINGS);
const copies = readJson(KDP_LISTING_COPY).books;
const factsById = new Map(readJson(datasetPath("kindle.quality")).books.map((book) => [book.id, book]));

function bookEntry(id) {
  const listing = ledger.listings[id];
  const copy = copies[id];
  const facts = factsById.get(id);
  const description = copy && facts ? renderListingDescription(copy, facts, previousEditionDisclaimer(listing)) : "";
  return { id, listing, copy, facts, description };
}

async function epubText(listing) {
  const file = resolve(ROOT, listing.epubPath);
  if (!existsSync(file)) return undefined;
  const zip = await JSZip.loadAsync(readFileSync(file));
  const pages = Object.values(zip.files).filter((entry) => /\.x?html$/.test(entry.name));
  const texts = await Promise.all(pages.map((page) => page.async("string")));
  return texts.join("\n").replace(/<[^>]+>/g, " ");
}

const liveIds = Object.entries(ledger.listings)
  .filter(([, listing]) => listing.status === "listed" && ["live", "in_review"].includes(listing.kdpStatus))
  .map(([id]) => id);

if (command === "check") {
  const books = liveIds.map(bookEntry);
  let failed = 0;
  for (const { id, listing } of books) {
    const { errors, skipped } = auditListingCopy(id, books, await epubText(listing));
    if (errors.length) failed += 1;
    console.log(`${errors.length ? "NG" : "OK"} ${id}${skipped.length ? ` (未検査: ${skipped.join("・")})` : ""}`);
    for (const error of errors) console.log(`   - ${error}`);
  }
  console.log(`${liveIds.length} 冊中 ${liveIds.length - failed} 冊が合格`);
  process.exit(failed ? 1 : 0);
}

if (command === "render") {
  const entry = bookEntry(targetId);
  if (!entry.copy) throw new Error(`${targetId}: 原稿が無い`);
  console.log(entry.description);
  console.log(`\nキーワード: ${entry.copy.keywords.join(" / ")}`);
  process.exit(0);
}

if (command === "apply") {
  const entry = bookEntry(targetId);
  if (entry.copy?.status !== "approved") throw new Error(`${targetId}: 承認済みの原稿だけを台帳へ写す`);
  if (!hasCurrentReview(entry.copy, entry.facts)) throw new Error(`${targetId}: 今の EPUB と照合した別エージェントのレビューが無い`);
  // 新刊 (まだ販売していない本) も写せるよう、写す本を冊間の重複の比較に含める
  const books = [...new Set([...liveIds, targetId])].map(bookEntry);
  const { errors } = auditListingCopy(targetId, books, await epubText(entry.listing));
  if (errors.length) throw new Error(`${targetId}: 監査に通らない: ${errors.join(" / ")}`);
  entry.listing.description = entry.description;
  entry.listing.keywords = [...entry.copy.keywords];
  writeFileSync(resolve(ROOT, KDP_LISTINGS), `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(`${targetId}: 台帳へ写した。KDP への反映は別工程`);
  process.exit(0);
}

console.error("usage: check | render --id <K-..> | apply --id <K-..>");
process.exit(2);
