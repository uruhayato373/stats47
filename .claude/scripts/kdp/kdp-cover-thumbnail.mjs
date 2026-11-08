#!/usr/bin/env node
/**
 * KDP の表紙を検索結果の大きさに縮めて目で確かめ、表紙の SHA ごとに記録する。
 *
 *   node .claude/scripts/kdp/kdp-cover-thumbnail.mjs render --id K-S1-02
 *     # 台帳の coverPath の表紙を 120px / 220px の高さに縮めた PNG を一時領域へ書き、パスと SHA を出す
 *   node .claude/scripts/kdp/kdp-cover-thumbnail.mjs record --id K-S1-02 --verdict readable --by owner [--note "…"]
 *     # 縮小画像を見た判定を data/products/kdp-cover-thumbnail-checks.json へ書く (今の表紙の SHA で)
 *
 * kdp-publish --commit は、今の表紙に readable の記録が無いと止まる。
 * 正典: .claude/rules/kindle-publishing-standards.md「表紙の縮小確認」
 */
import { createHash } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import sharp from "sharp";
import { KDP_COVER_THUMBNAIL_CHECKS } from "../../../config/paths.mjs";
import { ROOT, readListings } from "./lib/kdp-session.mjs";
import { COVER_THUMBNAIL_HEIGHTS_PX } from "./lib/kdp-cover-thumbnail.mjs";

const argv = process.argv.slice(2);
const command = argv[0];
const arg = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const id = arg("--id");
if (!["render", "record"].includes(command) || !id) {
  console.error("usage: render --id <K-..> | record --id <K-..> --verdict readable|unreadable --by <名前> [--note <メモ>]");
  process.exit(2);
}

const listing = readListings()[id];
if (!listing) throw new Error(`${id}: KDP の出品台帳に無い`);
const coverAbs = resolve(ROOT, listing.coverPath ?? "");
if (!listing.coverPath || !existsSync(coverAbs)) throw new Error(`${id}: 表紙が無い (${listing.coverPath})。R2 の archive から復元してから行う`);
const coverSha256 = createHash("sha256").update(readFileSync(coverAbs)).digest("hex");

if (command === "render") {
  const dir = mkdtempSync(join(tmpdir(), `kdp-cover-thumb-${id}-`));
  for (const height of COVER_THUMBNAIL_HEIGHTS_PX) {
    const out = join(dir, `${id}-h${height}.png`);
    await sharp(coverAbs).resize({ height }).png().toFile(out);
    console.log(out);
  }
  console.log(`coverSha256: ${coverSha256}`);
  console.log("目で見て題名が読めるかを判定し、record で記録する。確認が済んだらこの一時ディレクトリを消す。");
  process.exit(0);
}

const verdict = arg("--verdict");
const by = arg("--by");
if (!["readable", "unreadable"].includes(verdict) || !by) {
  console.error("record には --verdict readable|unreadable と --by <名前> が要る");
  process.exit(2);
}
const ledgerPath = resolve(ROOT, KDP_COVER_THUMBNAIL_CHECKS);
const ledger = JSON.parse(readFileSync(ledgerPath, "utf8"));
const note = arg("--note");
ledger.books = {
  ...ledger.books,
  [id]: {
    coverSha256,
    coverPath: listing.coverPath,
    heightsPx: [...COVER_THUMBNAIL_HEIGHTS_PX],
    verdict,
    ...(note ? { note } : {}),
    checkedAt: new Date().toISOString().slice(0, 10),
    checkedBy: by,
  },
};
writeFileSync(ledgerPath, `${JSON.stringify(ledger, null, 2)}\n`);
console.log(`${id}: ${verdict} を記録した (${coverSha256.slice(0, 12)}…)`);
