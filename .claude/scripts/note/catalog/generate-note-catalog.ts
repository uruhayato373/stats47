/**
 * note-catalog → 派生インデックス生成
 *
 * カタログ (git TS SSOT) から .claude/state/note-published-urls.json を再生成する。
 * これで「カタログが真実源、note-published-urls.json は派生物」が成立する
 * (従来 build-note-published-index.mjs が R2 frontmatter を fetch していたのを置換)。
 *
 * Usage:
 *   npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts            # scratchpad へ (非破壊)
 *   npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts --apply    # 本番 state を上書き
 */
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname, join } from "path";
import { fileURLToPath } from "url";
import { NOTE_ARTICLES } from "./index";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../../../..");
const APPLY = process.argv.includes("--apply");

const published = NOTE_ARTICLES.filter(
  (a) => a.status === "published" && a.noteUrl,
).sort((a, b) => a.key.localeCompare(b.key));

const articles: Record<string, unknown> = {};
for (const a of published) {
  // 本体が R2 に無い回収スタブ (r2Body===false) は "note_only"。
  // R2 に本体が実在するものだけ "r2_ready" と正直に記録する
  // (旧実装は全件無条件 "r2_ready" で 404 の r2_path を「保存済み」と偽っていた)。
  const hasBody = a.r2Body !== false;
  const entry: Record<string, unknown> = {
    vertical: a.vertical,
    title: a.title,
    url: a.noteUrl,
    is_paid: a.isPaid,
    published_at: a.publishedAt || "",
    r2_path: a.r2Path,
    r2_body: hasBody,
    r2_access: hasBody ? (a.isPaid ? "private" : "public") : "none",
    status: hasBody ? "r2_ready" : "note_only",
  };
  if (a.priceJpy && a.priceJpy > 0) entry.price_jpy = a.priceJpy;
  articles[a.key] = entry;
}

const output = {
  _meta: {
    generated_by: "generate-note-catalog.ts",
    generated_at: new Date().toISOString().slice(0, 10),
    source: "note-catalog git TS SSOT (.claude/scripts/note/catalog/)",
    note: "このファイルは派生インデックス。真実源は note-catalog の data/*.ts。手編集しない。",
  },
  articles,
};

const scratchpad = process.env.SCRATCHPAD || "/tmp";
if (!APPLY) mkdirSync(scratchpad, { recursive: true });
const outPath = APPLY
  ? join(ROOT, ".claude/state/note-published-urls.json")
  : join(scratchpad, "note-published-urls.generated.json");

writeFileSync(outPath, JSON.stringify(output, null, 2) + "\n", "utf8");
console.log(`=== generate-note-catalog ${APPLY ? "(apply)" : "(dry)"} ===`);
console.log(`公開済み ${published.length} 件 → ${outPath}`);
if (!APPLY) console.log("本番反映: --apply");
