// 家計シリーズの catalog エントリを draft.md frontmatter + 公開ログから決定的に生成し、
// stats47-note.ts へ追記する。タイトルは draft.md を唯一の真実源にする (validator が一致を要求)。
import fs from "node:fs";
import path from "node:path";
const ROOT = "/Users/minamidaisuke/stats47";
const DOCS = path.join(ROOT, "docs/31_note記事原稿");
const CAT = path.join(ROOT, ".claude/scripts/note/catalog/data/stats47-note.ts");

const slugs = fs.readdirSync(DOCS).filter((d) => /^(a-kakei-|b-kakei-|d-kakei-)/.test(d)).sort();
const src = fs.readFileSync(CAT, "utf8");

const fmField = (s, k) => {
  const m = s.match(new RegExp("^" + k + ':\\s*(?:"(.+?)"|\'(.+?)\'|(.+?))\\s*$', "m"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
};

const out = [];
const missing = [];
for (const slug of slugs) {
  const f = path.join(DOCS, slug, "draft.md");
  if (!fs.existsSync(f)) { missing.push(slug + " (no draft.md)"); continue; }
  const md = fs.readFileSync(f, "utf8");
  const fm = (md.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  const title = fmField(fm, "title");
  const noteUrl = fmField(fm, "note_url");
  const publishedAt = fmField(fm, "published_at");
  const isPaid = fmField(fm, "is_paid") === "true";
  const price = parseInt(fmField(fm, "price_jpy") || "0", 10);
  if (!title) { missing.push(slug + " (no title)"); continue; }
  if (!noteUrl) { missing.push(slug + " (not published)"); continue; }
  if (src.includes(`key: "${slug}"`)) { missing.push(slug + " (already in catalog)"); continue; }
  // 家計シリーズ (a-kakei-*/b-kakei-*/d-kakei-*) は全て "s47-kakei-reading" マガジン所属。
  // ★2026-09-15 修正: 以前は b-kakei-* 以外 (a-/d-kakei-*) が "s47-economy" 誤既定になっていたが、
  // 実際の live catalog (公開済み47件の a-kakei-*) は全件 "s47-kakei-reading" だった。
  const magazine = "s47-kakei-reading";
  const series = slug.startsWith("b-kakei-") ? "B" : slug.startsWith("d-kakei-") ? "D" : "A";
  const lines = [
    "  {",
    `    key: ${JSON.stringify(slug)},`,
    `    vertical: "stats47-note",`,
    `    series: "${series}",`,
    `    title: ${JSON.stringify(title)},`,
    `    magazine: ${JSON.stringify(magazine)},`,
    `    isPaid: ${isPaid},`,
    ...(isPaid ? [`    priceJpy: ${price},`] : []),
    `    status: "published",`,
    `    noteUrl: ${JSON.stringify(noteUrl)},`,
    `    publishedAt: ${JSON.stringify(publishedAt)},`,
    `    r2Path: ${JSON.stringify("note/stats47-note/" + slug)},`,
    `    r2Body: false,`,
    "  },",
  ];
  out.push(lines.join("\n"));
}
if (!out.length) { console.log("nothing to add. skipped:\n  " + missing.join("\n  ")); process.exit(0); }
const marker = "];\n";
const idx = src.lastIndexOf(marker);
const next = src.slice(0, idx) + out.join("\n") + "\n" + src.slice(idx);
fs.writeFileSync(CAT, next);
console.log(`added ${out.length} entries`);
if (missing.length) console.log("skipped:\n  " + missing.join("\n  "));
