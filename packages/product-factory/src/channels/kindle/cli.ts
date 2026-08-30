/**
 * Kindle 出版ファクトリー CLI。
 *
 *   npm run products:kindle:plan
 *   npm run products:kindle:validate
 *   npm run products:kindle:generate -- --id K-S1-01
 *   npm run products:kindle:generate -- --all-manuscript      # status>=manuscript を一括生成
 *   npm run products:kindle:report
 *
 * 生成は .local/kindle-books への書き出しのみ。KDP アップロードはこの CLI から行わない (人間工程)。
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { KINDLE_BOOKS, BOOK_BY_ID } from "./book-catalog";
import { validateKindleCatalog } from "./validator";
import { buildBook } from "./build-book";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../../../..");
const STATUS_PATH = resolve(REPO_ROOT, ".claude/state/products/kindle-status.json");

const argv = process.argv.slice(2);
const sub = argv[0] ?? "";
const flags = new Set(argv.slice(1).filter((a) => a.startsWith("--")));
const idIdx = argv.indexOf("--id");
const idArg = idIdx >= 0 ? argv[idIdx + 1] : undefined;

function runPlan(): number {
  const v = validateKindleCatalog();
  console.log(`書籍: ${v.counts.total} 冊`);
  console.log(`  series: ${JSON.stringify(v.counts.bySeries)}`);
  console.log(`  status: ${JSON.stringify(v.counts.byStatus)}`);
  console.log("");
  for (const b of KINDLE_BOOKS) {
    const mark = b.status === "manuscript" || b.status === "generated" || b.status === "published" ? "●" : "○";
    console.log(`  ${mark} ${b.id} [${b.status}] ¥${b.priceYen} ${b.title}`);
  }
  if (v.ok) {
    console.log(`\n✅ kindle plan: OK (errors 0, warnings ${v.warnings.length})`);
    return 0;
  }
  console.error(`\n❌ kindle plan: ${v.errors.length} error(s)`);
  for (const e of v.errors.slice(0, 40)) console.error(`  [${e.code}] ${e.ref} ${e.message}`);
  return 1;
}

function runValidate(): number {
  const v = validateKindleCatalog();
  for (const w of v.warnings) console.log(`  ⚠ [${w.code}] ${w.ref} ${w.message}`);
  if (v.ok) {
    console.log(`✅ kindle validate: OK (warnings ${v.warnings.length})`);
    return 0;
  }
  console.error(`❌ kindle validate: ${v.errors.length} error(s)`);
  for (const e of v.errors) console.error(`  [${e.code}] ${e.ref} ${e.message}`);
  return 1;
}

async function runGenerate(): Promise<number> {
  const v = validateKindleCatalog();
  if (!v.ok) {
    console.error("❌ カタログに error があるため生成しません。まず `validate` を通してください。");
    return 1;
  }
  let targets = KINDLE_BOOKS.filter((b) => b.status === "manuscript" || b.status === "generated");
  if (idArg) {
    const b = BOOK_BY_ID.get(idArg);
    if (!b) {
      console.error(`❌ 書籍が見つからない: ${idArg}`);
      return 1;
    }
    targets = [b];
  } else if (!flags.has("--all-manuscript")) {
    console.log("usage: generate --id <K-S1-01> | generate --all-manuscript");
    return 1;
  }
  if (targets.length === 0) {
    console.log("生成対象 (status>=manuscript) がありません。");
    return 0;
  }
  for (const b of targets) {
    console.log(`\n▶ ${b.id} ${b.title} を生成中…`);
    const r = await buildBook(b, { skipCover: flags.has("--no-cover") });
    console.log(`  ✅ ${r.epubPath}`);
    console.log(`     章 ${r.chapterCount} / 図版 ${r.imageCount}` + (r.missingSlugs.length ? ` / ⚠ 未取得 ${r.missingSlugs.join(",")}` : ""));
    const pct = (r.freshRatio * 100).toFixed(2);
    if (r.freshRatioOk) {
      console.log(`     書き下ろし比率 ${pct}% (fresh ${r.freshChars} / blog ${r.blogChars}) ✅ 30% 以上`);
    } else {
      console.log(`     ⚠️ 書き下ろし比率 ${pct}% (< 30%) — KDP 出品前に書き下ろし章を増やしてください (fresh ${r.freshChars} / blog ${r.blogChars})`);
    }
    // ★比率とは別に絶対量を出す。比率は分母が小さいほど満たしやすいので、
    //   「1 章 150 字 × 30 章」でも 30% を超えてしまう (2026-08-12 に 20 冊が該当)。
    if (r.volumeOk) {
      console.log(`     本文量 ${r.totalChars.toLocaleString()} 字 / 1章 ${r.charsPerChapter} 字 ✅`);
    } else {
      console.log(
        `     ⛔ 本文量 ${r.totalChars.toLocaleString()} 字 / 1章 ${r.charsPerChapter} 字 — 書籍として薄すぎます` +
          ` (床: 総 20,000 字・1章 800 字)。定型 1 文 + 図の羅列は KDP の品質規定に触れるため出品しないでください`,
      );
    }
  }
  return 0;
}

function runReport(): number {
  const v = validateKindleCatalog();
  mkdirSync(dirname(STATUS_PATH), { recursive: true });
  const payload = {
    generatedAt: new Date().toISOString(),
    total: v.counts.total,
    bySeries: v.counts.bySeries,
    byStatus: v.counts.byStatus,
    books: KINDLE_BOOKS.map((b) => ({
      id: b.id,
      series: b.series,
      title: b.title,
      status: b.status,
      priceYen: b.priceYen,
      chapters: b.chapters.length,
    })),
  };
  writeFileSync(STATUS_PATH, JSON.stringify(payload, null, 2) + "\n");
  console.log(`✅ kindle-status を書き出しました: ${STATUS_PATH}`);
  return 0;
}

async function main(): Promise<number> {
  switch (sub) {
    case "plan":
      return runPlan();
    case "validate":
      return runValidate();
    case "generate":
      return runGenerate();
    case "report":
      return runReport();
    default:
      console.log("usage: kindle-cli <plan|validate|generate|report> [--id <K-S1-01>|--all-manuscript|--no-cover]");
      return sub === "" ? 0 : 1;
  }
}

main().then((code) => process.exit(code));
