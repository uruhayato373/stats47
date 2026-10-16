/**
 * 記事台帳 (data/note/articles.json) → 派生インデックス 2 つを生成する。手編集しない。
 *   - data/note/note-published-urls.json  公開済み記事の URL と本文の所在
 *   - data/note/note-draft-index.json     下書きの一覧と本文の所在
 *
 * 内容は台帳だけで決まる (日付を入れない) ので、--check で手編集や再生成漏れを検出できる。
 *
 * Usage:
 *   npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts            # scratchpad へ (非破壊)
 *   npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts --apply    # data/note へ書き込む
 *   npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts --check    # data/note と一致しなければ exit 1
 */
import { mkdirSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { execFileSync } from 'node:child_process';
import { NOTE_ARTICLES } from "./index";
import { datasetPath } from "../../../../config/datasets.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../../..");
const APPLY = process.argv.includes("--apply");
const CHECK = process.argv.includes("--check");

// New draft/published articles receive stable cover IDs and the current category policy.
if (APPLY && !CHECK) execFileSync(process.execPath, ['--import', 'tsx', '.claude/scripts/note/cover-production.ts', 'seed'], { cwd: ROOT, stdio: 'inherit' });

const access = { "r2-public": "public", "r2-private": "private", "note-only": "none" } as const;

const published: Record<string, unknown> = {};
for (const a of NOTE_ARTICLES.filter((x) => x.status === "published" && x.noteUrl).sort((x, y) => x.key.localeCompare(y.key))) {
  const entry: Record<string, unknown> = {
    vertical: a.vertical,
    title: a.title,
    url: a.noteUrl,
    is_paid: a.isPaid,
    published_at: a.publishedAt || "",
    r2_path: a.r2Path,
    r2_body: a.r2Body,
    r2_access: a.r2Body ? access[a.body.store] : "none",
    status: a.r2Body ? "r2_ready" : "note_only",
  };
  if (a.priceJpy && a.priceJpy > 0) entry.price_jpy = a.priceJpy;
  published[a.key] = entry;
}

const drafts: Record<string, unknown> = {};
for (const a of NOTE_ARTICLES.filter((x) => x.status === "draft").sort((x, y) => x.key.localeCompare(y.key))) {
  drafts[a.key] = { vertical: a.vertical, r2_path: a.r2Body ? a.r2Path : null, status: "draft" };
}

const outputs = [
  {
    id: "note.published-urls",
    body: {
      _meta: {
        generated_by: "generate-note-catalog.ts",
        source: datasetPath("note.articles"),
        note: "派生インデックス。正本は記事台帳 (source)。手編集しない (--check が検出する)。",
      },
      articles: published,
    },
  },
  {
    id: "note.draft-index",
    body: {
      _meta: { generated_by: "generate-note-catalog.ts", source: datasetPath("note.articles"), note: "派生インデックス。手編集しない。" },
      drafts,
    },
  },
];

let drift = 0;
const scratchpad = process.env.SCRATCHPAD || "/tmp";
for (const { id, body } of outputs) {
  const text = `${JSON.stringify(body, null, 2)}\n`;
  const target = join(ROOT, datasetPath(id));
  if (CHECK) {
    let current = "";
    try {
      current = readFileSync(target, "utf8");
    } catch {
      /* missing counts as drift */
    }
    if (current !== text) {
      drift++;
      console.error(`✗ ${datasetPath(id)} が台帳から生成した内容と違う。npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts --apply で作り直す`);
    }
    continue;
  }
  const outPath = APPLY ? target : join(scratchpad, `${id}.generated.json`);
  if (!APPLY) mkdirSync(scratchpad, { recursive: true });
  writeFileSync(outPath, text, "utf8");
  console.log(`${APPLY ? "apply" : "dry"}: ${id} → ${outPath}`);
}
console.log(`公開 ${Object.keys(published).length} 件 / 下書き ${Object.keys(drafts).length} 件`);
if (drift) process.exit(1);
