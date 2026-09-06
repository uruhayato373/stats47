// 家計シリーズ 56 本の公開状態を note API で実測する (read-only)。
// draft.md frontmatter / note API / catalog を突き合わせ、done_when を機械判定する。
import fs from "node:fs";
import path from "node:path";
const ROOT = "/Users/minamidaisuke/stats47";
const DOCS = path.join(ROOT, "docs/31_note記事原稿");
const CAT = path.join(ROOT, ".claude/scripts/note/catalog/data/stats47-note.ts");
const catalog = fs.readFileSync(CAT, "utf8");
const slugs = fs.readdirSync(DOCS).filter((d) => /^[abd]-kakei-/.test(d)).sort();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
for (const slug of slugs) {
  const md = fs.readFileSync(path.join(DOCS, slug, "draft.md"), "utf8");
  const fm = (md.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  const g = (k) => { const m = fm.match(new RegExp("^" + k + ':\\s*(?:"(.+?)"|(.+?))\\s*$', "m")); return m ? (m[1] ?? m[2] ?? "") : ""; };
  const url = g("note_url"), title = g("title"), status = g("status");
  const key = (url.match(/n[0-9a-f]{8,}/) || [])[0] || "";
  const row = { slug, status, url, inCatalog: catalog.includes(`key: "${slug}"`) };
  if (!key) { row.verdict = "NOT_PUBLISHED"; rows.push(row); continue; }
  let n = null;
  for (let i = 1; i <= 3; i++) {
    try { const r = await fetch(`https://note.com/api/v3/notes/${key}?ts=${Date.now()}`); if (r.ok) { n = (await r.json()).data; break; } } catch {}
    await sleep(600 * i);
  }
  let http = 0;
  try { const r = await fetch(url); http = r.status; } catch {}
  const body = String(n?.body || "");
  row.http = http;
  row.apiStatus = n?.status; row.user = n?.user?.urlname; row.tags = n?.hashtag_notes?.length || 0;
  row.price = Number(n?.price || 0); row.figures = (body.match(/<figure\b/g) || []).length;
  row.titleMatch = n?.name === title;
  const ok = http === 200 && n?.status === "published" && n?.user?.urlname === "stats47"
    && row.tags >= 95 && row.titleMatch && status === "published" && row.inCatalog;
  row.verdict = ok ? "OK" : "CHECK";
  rows.push(row);
  await sleep(120);
}
const ok = rows.filter((r) => r.verdict === "OK");
const bad = rows.filter((r) => r.verdict !== "OK");
for (const r of bad) console.log(`${r.verdict.padEnd(14)} ${r.slug.padEnd(32)} st=${r.status} http=${r.http ?? "-"} api=${r.apiStatus ?? "-"} tags=${r.tags ?? "-"} title=${r.titleMatch ?? "-"} catalog=${r.inCatalog}`);
console.log(`\n=== ${ok.length}/${rows.length} fully verified (published + 200 + title + tags>=95 + catalog) ===`);
