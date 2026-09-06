// 公開済み note 記事で「図が文章を分断していないか」を実測する (read-only)。
// 判定: 図の直前にあるテキストが draft.md の対応する直前 block の全文と一致するか。
// 段落が分断されていれば直前は断片になるので一致しない (末尾文字の推測はしない)。
// 使い方: node audit-note-figure-split.mjs [slug-prefix]   (既定: a-/b-/d-kakei)
import fs from "node:fs";
import path from "node:path";
import { misplacedFigures, publishedBlocks } from "./lib/figure-split.mjs";
const DOCS = "/Users/minamidaisuke/stats47/docs/31_note記事原稿";
const prefix = process.argv[2] || "^[abd]-kakei-";
const re = new RegExp(prefix);
const slugs = fs.readdirSync(DOCS).filter((d) => re.test(d)).sort();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rows = [];
for (const slug of slugs) {
  const md = fs.readFileSync(path.join(DOCS, slug, "draft.md"), "utf8");
  const fm = (md.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  const url = (fm.match(/^note_url:\s*(?:"(.+?)"|(.+?))\s*$/m) || []).slice(1).find(Boolean) || "";
  const key = (url.match(/n[0-9a-f]{8,}/) || [])[0] || "";
  if (!key) { rows.push({ slug, verdict: "NO_URL" }); continue; }
  let n = null;
  for (let i = 1; i <= 4; i++) {
    try { const r = await fetch(`https://note.com/api/v3/notes/${key}?ts=${Date.now()}`); if (r.ok) { n = (await r.json()).data; break; } } catch {}
    await sleep(700 * i);
  }
  if (!n) { rows.push({ slug, key, verdict: "FETCH_FAIL" }); continue; }
  let http = 0; try { http = (await fetch(url)).status; } catch {}
  const mis = misplacedFigures(slug, n.body);
  const split = mis.length;
  rows.push({ slug, key, http, split,
    figures: publishedBlocks(n.body).filter((b) => b.tag === "figure").length,
    tags: n.hashtag_notes?.length || 0, price: Number(n.price || 0),
    status: n.status, title: n.name,
    verdict: split === 0 && http === 200 && n.status === "published" && (n.hashtag_notes?.length || 0) >= 95 ? "OK" : "NG" });
  await sleep(130);
}
fs.writeFileSync("/tmp/note-figure-split-audit.json", JSON.stringify(rows, null, 1));
for (const r of rows.filter((x) => x.verdict !== "OK"))
  console.log(`NG ${r.slug.padEnd(32)} misplaced=${r.split ?? "-"} http=${r.http ?? "-"} tags=${r.tags ?? "-"} ${r.verdict}`);
const ok = rows.filter((r) => r.verdict === "OK").length;
console.log(`\n${ok}/${rows.length} OK (図が draft と同じ位置 / http 200 / published / tags>=95)`);
process.exit(ok === rows.length ? 0 : 1);
