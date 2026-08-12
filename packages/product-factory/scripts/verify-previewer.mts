#!/usr/bin/env -S npx tsx
/**
 * Kindle Previewer 3 の CLI で全書籍を実変換し、KDP が出す指摘を機械検証する。
 *
 * ★なぜ epubcheck と verify-epub の他に要るか (2026-08-12)
 *   Previewer は **KDP 本番と同じ変換器**なので、こちらだけが見つける問題がある。
 *   実際に「W14016: Cover not specified」を出して、`verify-publishable.mts` が
 *   `skipCover` で回していたせいで**出荷用 EPUB が表紙なしに上書きされていた**ことが判明した。
 *   epubcheck も verify-epub も EPUB 単体としては妥当なので素通りしていた。
 *
 * 3 層の分担:
 *   ① epubcheck        EPUB 仕様に適合するか
 *   ② verify-epub      レイアウトの不変量 (表紙 SVG ラップ / landmarks / 改ページ CSS)
 *   ③ **これ**         KDP の変換器が受理し、指摘を出さないか
 *
 * 判定は Previewer の出力をそのまま使う (ここに独自の閾値を作らない):
 *   - Conversion Status = Success
 *   - Error Count = 0        … 出版をブロックする指摘
 *   - Quality Issue Count = 0
 *   - ログの Notice も出す   … ブロックはしないが、表紙未指定のような重要な取りこぼしが出る
 *
 * Usage:
 *   npx tsx packages/product-factory/scripts/verify-previewer.mts
 *   npx tsx packages/product-factory/scripts/verify-previewer.mts --book K-S2-02
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDLE_BOOKS } from "../src/channels/kindle/book-catalog";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const PREVIEWER = "/Applications/Kindle Previewer 3.app/Contents/MacOS/Kindle Previewer 3";

const KNOWN_FLAGS = new Set(["--book", "--keep"]);
function assertKnownFlags(): void {
  const unknown = process.argv.slice(2).filter((a) => a.startsWith("--") && !KNOWN_FLAGS.has(a));
  if (unknown.length > 0) {
    console.error(`未知のフラグ: ${unknown.join(", ")}\n使えるのは ${[...KNOWN_FLAGS].join(" / ")} です。`);
    process.exit(2);
  }
}
function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

/** CSV の 1 行を素朴に分解する (Previewer のログは値に改行を含まない)。 */
function splitCsv(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i += 1; } else inQuote = !inQuote;
    } else if (c === "," && !inQuote) { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur);
  return out.map((s) => s.replace(/^﻿/, "").trim());
}

interface Result {
  readonly id: string;
  readonly ok: boolean;
  readonly status: string;
  readonly errors: number;
  readonly quality: number;
  readonly typesetting: string;
  readonly notices: string[];
  readonly failure?: string;
}

function convert(id: string, epub: string): Result {
  const out = mkdtempSync(join(tmpdir(), `kpv-${id}-`));
  try {
    execFileSync(PREVIEWER, [epub, "-convert", "-output", out, "-locale", "en"], {
      stdio: "pipe",
      maxBuffer: 32 * 1024 * 1024,
    });
    const summaryPath = join(out, "Summary_Log.csv");
    if (!existsSync(summaryPath)) {
      return { id, ok: false, status: "-", errors: -1, quality: -1, typesetting: "-", notices: [], failure: "Summary_Log.csv が出力されなかった" };
    }
    const rows = readFileSync(summaryPath, "utf8").trim().split("\n").map(splitCsv);
    const head = rows[0];
    const row = rows[1] ?? [];
    const col = (name: string): string => row[head.indexOf(name)] ?? "";
    const errors = Number(col("Error Count") || 0);
    const quality = Number(col("Quality Issue Count") || 0);
    const status = col("Conversion Status");

    // ログの Notice も拾う。ブロックはしないが、表紙未指定のような重要な取りこぼしが出る。
    const notices: string[] = [];
    const logPath = col("Log File Path");
    if (logPath && existsSync(logPath)) {
      for (const line of readFileSync(logPath, "utf8").split("\n").slice(1)) {
        const c = splitCsv(line);
        if (c[0] === "Notice" || c[0] === "Warning") notices.push(`${c[0]}: ${c[1]}`);
      }
    }
    return { id, ok: status === "Success" && errors === 0 && quality === 0, status, errors, quality, typesetting: col("Enhanced Typesetting Status"), notices };
  } catch (e: unknown) {
    return { id, ok: false, status: "-", errors: -1, quality: -1, typesetting: "-", notices: [], failure: e instanceof Error ? e.message.split("\n")[0] : String(e) };
  } finally {
    if (!process.argv.includes("--keep")) rmSync(out, { recursive: true, force: true });
  }
}

function main(): void {
  assertKnownFlags();
  if (!existsSync(PREVIEWER)) {
    console.error(`Kindle Previewer 3 が見つからない: ${PREVIEWER}\nmacOS に Kindle Previewer 3 を入れてから実行する。`);
    process.exit(2);
  }
  const only = arg("book");
  const books = KINDLE_BOOKS.filter((b) => (only ? b.id === only : true));

  let bad = 0;
  let noticed = 0;
  for (const b of books) {
    const epub = join(REPO_ROOT, `.local/kindle-books/${b.id}/v1/book.epub`);
    if (!existsSync(epub)) {
      console.log(`NG  ${b.id.padEnd(9)} EPUB が無い (先に products:kindle:generate)`);
      bad += 1;
      continue;
    }
    const r = convert(b.id, epub);
    if (!r.ok) bad += 1;
    if (r.notices.length > 0) noticed += 1;
    const mark = r.ok ? (r.notices.length > 0 ? "WARN" : "OK  ") : "NG  ";
    console.log(
      `${mark}${r.id.padEnd(9)} ${r.status} / error ${r.errors} / quality ${r.quality} / Enhanced Typesetting: ${r.typesetting}`,
    );
    if (r.failure) console.log(`      変換失敗: ${r.failure}`);
    for (const n of r.notices) console.log(`      ${n}`);
  }

  console.log(`\n合計: ${books.length} 冊 / 不合格 ${bad} 件 / Notice のある本 ${noticed} 冊`);
  process.exit(bad > 0 ? 1 : 0);
}

main();
