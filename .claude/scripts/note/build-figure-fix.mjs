// 1 記事分の「是正後の本文 HTML」を作り /tmp へ置く。不変量を満たさなければ非0で終了する。
import fs from "node:fs";
import path from "node:path";
import { rebuild, misplacedFigures } from "./lib/figure-split.mjs";
const slug = process.argv[2];
if (!slug) { console.error("usage: build-figure-fix.mjs <slug>"); process.exit(2); }
const DOCS = "/Users/minamidaisuke/stats47/docs/31_note記事原稿";
const md = fs.readFileSync(path.join(DOCS, slug, "draft.md"), "utf8");
const fm = (md.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
const url = (fm.match(/^note_url:\s*(?:"(.+?)"|(.+?))\s*$/m) || []).slice(1).find(Boolean) || "";
const key = (url.match(/n[0-9a-f]{8,}/) || [])[0] || "";
if (!key) { console.error(`${slug}: note_url が無い`); process.exit(1); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let note = null;
for (let i = 1; i <= 4; i++) {
  try { const r = await fetch(`https://note.com/api/v3/notes/${key}?ts=${Date.now()}`); if (r.ok) { note = (await r.json()).data; break; } } catch {}
  await sleep(700 * i);
}
if (!note) { console.error(`${slug}: API 取得失敗`); process.exit(1); }
if (Number(note.price || 0) > 0) { console.error(`${slug}: 有料記事は対象外`); process.exit(1); }
const before = misplacedFigures(slug, note.body).length;
if (before === 0) { console.error(`${slug}: 図はすでに draft と同じ位置 (skip)`); process.exit(3); }
const fixed = rebuild(slug, note.body);           // 不変量違反は throw
const after = misplacedFigures(slug, fixed).length;
if (after !== 0) { console.error(`${slug}: 是正後も位置ずれ ${after} 件`); process.exit(1); }
fs.writeFileSync(`/tmp/notefix-${slug}.html`, fixed);
fs.writeFileSync(`/tmp/notefix-${slug}.key`, key + "\n");
fs.writeFileSync(`/tmp/notefix-${slug}.before.json`, JSON.stringify({
  title: note.name, tags: note.hashtag_notes?.length || 0, price: Number(note.price || 0),
  status: note.status, bodyLen: String(note.body).length, figures: (note.body.match(/<figure/g) || []).length,
}));
console.log(`prepared ${slug} key=${key} 図の位置ずれ ${before} -> 0  bytes ${note.body.length} -> ${fixed.length}`);
