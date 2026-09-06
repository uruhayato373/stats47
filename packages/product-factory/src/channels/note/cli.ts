/**
 * note 商品展開ファクトリー CLI (仕様 §12)。
 *
 *   npm run products:note:plan     -- --check
 *   npm run products:note:generate -- --all --draft-only
 *   npm run products:note:generate -- --slug <slug>
 *   npm run products:note:validate -- --all
 *   npm run products:note:promote  -- --slug <slug> --dry-run
 *   npm run products:note:report
 *
 * 生成は .local/note-products への書き出しのみ。promote は既定 dry-run。
 * 公開・note.com 操作・docs/R2 書き込みはこの CLI から行わない (N4+ の人間工程)。
 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { CANONICAL_ARTICLES } from "./article-plan";
import { NOTE_PRODUCT_MAPPINGS } from "./product-note-mapping";
import { validateNoteChannel, scanText } from "./validators";
import { NOTE_OUT_ROOT_DEFAULT } from "./build/build-note";
import { writeNoteReport } from "./build/note-report";
import { promoteNoteArticle, promoteAllNoteArticles } from "./build/promote-note";
import { buildNoteCover, buildAllNoteCovers } from "./build/build-note-covers";
import { buildNoteRevision, validateNoteRevision } from "./build/build-revision";

const argv = process.argv.slice(2);
const sub = argv[0] ?? "";
const flags = new Set(argv.slice(1).filter((a) => a.startsWith("--")));
const slugIdx = argv.indexOf("--slug");
const slugArg = slugIdx >= 0 ? argv[slugIdx + 1] : undefined;

function printPlanSummary(): void {
  const v = validateNoteChannel();
  const byDisp: Record<string, number> = {};
  for (const m of NOTE_PRODUCT_MAPPINGS) byDisp[m.disposition] = (byDisp[m.disposition] ?? 0) + 1;
  const byAccess: Record<string, number> = {};
  for (const a of CANONICAL_ARTICLES) byAccess[a.access] = (byAccess[a.access] ?? 0) + 1;
  console.log(`商品: ${NOTE_PRODUCT_MAPPINGS.length} / canonical 記事: ${CANONICAL_ARTICLES.length}`);
  console.log(`disposition coverage: ${v.coverage.assigned}/${v.coverage.total}`);
  console.log(`  disposition: ${JSON.stringify(byDisp)}`);
  console.log(`  access: ${JSON.stringify(byAccess)}`);
}

function runPlan(): number {
  const v = validateNoteChannel();
  printPlanSummary();
  if (v.ok) {
    console.log(`\n✅ note plan: OK (coverage ${v.coverage.assigned}/${v.coverage.total}, errors 0, warnings ${v.warnings.length})`);
    return 0;
  }
  console.error(`\n❌ note plan: ${v.errors.length} error(s)`);
  for (const e of v.errors.slice(0, 40)) console.error(`  [${e.code}] ${e.ref ?? ""} ${e.message}`);
  return 1;
}

/** 生成済み draft.md を claims スキャン。generate 済みなら本文検査、未生成なら plan のみ。 */
function runValidate(): number {
  const v = validateNoteChannel();
  let draftIssues = 0;
  let scanned = 0;
  for (const a of CANONICAL_ARTICLES) {
    const path = join(NOTE_OUT_ROOT_DEFAULT, a.series, a.slug, "draft.md");
    if (!existsSync(path)) continue;
    scanned += 1;
    const issues = scanText(readFileSync(path, "utf8"), a.slug);
    for (const i of issues) {
      draftIssues += 1;
      console.error(`  [draft:${i.code}] ${i.ref} ${i.message}`);
    }
  }
  printPlanSummary();
  console.log(`draft 本文 claims スキャン: ${scanned} 本 / 問題 ${draftIssues} 件`);
  if (v.ok && draftIssues === 0) {
    console.log(`✅ note validate: OK (warnings ${v.warnings.length})`);
    return 0;
  }
  if (!v.ok) {
    console.error(`❌ note validate: plan ${v.errors.length} error(s)`);
    for (const e of v.errors.slice(0, 40)) console.error(`  [${e.code}] ${e.ref ?? ""} ${e.message}`);
  }
  return v.ok && draftIssues === 0 ? 0 : 1;
}

function runPromote(): number {
  const apply = flags.has("--apply");
  // 既定は dry-run。--apply で docs/31 outbox + note catalog data (product-sales.ts) へ draft 展開。
  // note.com 公開・R2 push はしない (月1-2本・人間承認後の別工程)。
  if (slugArg) {
    const article = CANONICAL_ARTICLES.find((a) => a.slug === slugArg);
    if (!article) {
      console.error(`❌ 記事が見つからない: ${slugArg}`);
      return 1;
    }
    const e = promoteNoteArticle(article, undefined, { dryRun: !apply });
    console.log(
      `${apply ? "✅ promote" : "ℹ️ dry-run"}: ${e.key} (${article.access}) → docs/31_note記事原稿/product-sales/${e.key}/`,
    );
    if (!apply) console.log("   --apply で docs/31 + note catalog data を書き込みます (公開はしません)。");
    else console.log("   ⚠️ --apply では slug 単位で catalog data (product-sales.ts) を再生成しません。全件は `promote --all --apply` を使ってください。");
    return 0;
  }
  if (flags.has("--all")) {
    const res = promoteAllNoteArticles(undefined, undefined, { dryRun: !apply });
    if (apply) {
      console.log(`✅ promote --all: ${res.entries.length} 記事を docs/31_note記事原稿/product-sales/ へ draft 展開`);
      console.log(`   note catalog data 生成: ${res.catalogDataPath}`);
      console.log("   status=draft・published:false。note.com 公開・R2 push はしていません (人間工程)。");
      console.log("   → 次: catalog/index.ts に product-sales を配線 → validate-note-catalog.ts で確認。");
    } else {
      console.log(`ℹ️ dry-run: ${res.entries.length} 記事を docs/31 + note catalog へ draft 展開する予定 (書き込みなし)。`);
      console.log("   実行するには: promote --all --apply");
    }
    return 0;
  }
  console.log("usage: promote --all [--apply] | promote --slug <slug> [--apply]");
  return 1;
}

function runReport(): number {
  const path = writeNoteReport();
  console.log(`✅ note-catalog-status を書き出しました: ${path}`);
  return 0;
}

/** 表紙 (1280×670) + 完成イメージを docs/31 images/ へ生成する。 */
async function runCovers(): Promise<number> {
  if (slugArg) {
    const article = CANONICAL_ARTICLES.find((a) => a.slug === slugArg);
    if (!article) {
      console.error(`❌ 記事が見つからない: ${slugArg}`);
      return 1;
    }
    const r = await buildNoteCover(article);
    console.log(`✅ cover: ${r.slug} → ${r.cover}` + (r.completion ? ` + completion.png` : ""));
    return 0;
  }
  const results = await buildAllNoteCovers(undefined, {
    onProgress: (done, total, r) => {
      if (done % 10 === 0 || done === total || done === 1) {
        console.log(`  [${done}/${total}] ${r.slug}` + (r.completion ? " (+完成図)" : ""));
      }
    },
  });
  const withCompletion = results.filter((r) => r.completion).length;
  console.log(`✅ 全 ${results.length} 記事の表紙を生成 → docs/31_note記事原稿/product-sales/<slug>/images/cover.png`);
  console.log(`   完成イメージ (商品プレビュー再利用): ${withCompletion} 記事`);
  return 0;
}

async function main(): Promise<number> {
  switch (sub) {
    case "generate":
    case "revision": {
      const revisionIndex = argv.indexOf("--revision");
      const revision = revisionIndex >= 0 ? argv[revisionIndex + 1] : undefined;
      if (!revision || !flags.has("--all")) throw new Error('revision requires --revision <new-id> --all; private generation only');
      if (flags.has("--validate")) {
        const errors = await validateNoteRevision(revision);
        console.log(JSON.stringify({ revision, validationErrors: errors, readyToPublish: false }, null, 2));
        return errors.length ? 1 : 0;
      }
      const report = await buildNoteRevision({ revision });
      console.log(JSON.stringify({ outputRoot: report.outputRoot, total: report.items.length,
        inputVerified: report.items.filter(item => item.sourceManifestSha256).length,
        missing: report.items.flatMap(item => item.missingProducts),
        validationErrors: report.items.flatMap(item => item.validationErrors), readyToPublish: false }, null, 2));
      return report.items.some(item => item.validationErrors.length) ? 1 : 0;
    }
    case "plan":
      return runPlan();
    case "validate":
      return runValidate();
    case "promote":
      return runPromote();
    case "covers":
      return runCovers();
    case "report":
      return runReport();
    default:
      console.log("usage: note-cli <plan|generate|validate|promote|covers|report|revision> [--check|--all|--apply|--slug <slug>|--revision <new-id>]");
      return sub === "" ? 0 : 1;
  }
}

main().then((code) => process.exit(code));
