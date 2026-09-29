#!/usr/bin/env -S npx tsx
/**
 * imagegen の出力・採用前の候補を Drive (非公開) へ置く。R2 には載せない。
 *
 *   npx tsx packages/product-factory/scripts/stash-cover-candidate.mts --book K-S1-02 --input /abs/generated.png
 *
 * 置いた後、採用するものだけを `ingest-cover-background.mts --input drive:<bookId>/<ファイル名>` で
 * 正規化して R2 (承認後) へ進める。
 */
import { copyFileSync, existsSync } from "node:fs";
import { basename, resolve } from "node:path";
import { BOOK_BY_ID } from "../src/channels/kindle/book-catalog";
import { coverCandidatesDir } from "./cover-drive";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main(): Promise<void> {
  const bookId = arg("book");
  const input = arg("input");
  if (!bookId || !input) throw new Error("--book と --input は必須");
  if (!BOOK_BY_ID.has(bookId)) throw new Error(`未知の bookId: ${bookId}`);
  const source = resolve(input);
  if (!existsSync(source)) throw new Error(`入力画像が無い: ${source}`);
  const dir = await coverCandidatesDir(bookId, { create: true });
  const stamp = new Date().toISOString().slice(0, 10);
  const target = resolve(dir, `${stamp}-${basename(source)}`);
  if (existsSync(target)) throw new Error(`同名の候補が既にある (上書きしない): ${target}`);
  copyFileSync(source, target);
  console.log(JSON.stringify({ status: "stashed-private", bookId, path: target, drivePath: `drive:${bookId}/${basename(target)}` }, null, 2));
}

main().catch((e: unknown) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});
