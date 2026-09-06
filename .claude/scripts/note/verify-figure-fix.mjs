// 公開ページを実測し、図が段落の切れ目に入ったことと、他が変わっていないことを確認する。
import fs from "node:fs";
import { misplacedFigures, plain } from "./lib/figure-split.mjs";
const slug = process.argv[2];
const key = fs.readFileSync(`/tmp/notefix-${slug}.key`, "utf8").trim();
const before = JSON.parse(fs.readFileSync(`/tmp/notefix-${slug}.before.json`, "utf8"));
const expect = fs.readFileSync(`/tmp/notefix-${slug}.html`, "utf8");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = null;
for (let i = 1; i <= 6; i++) {
  try { const r = await fetch(`https://note.com/api/v3/notes/${key}?ts=${Date.now()}`); if (r.ok) n = (await r.json()).data; } catch {}
  if (n && misplacedFigures(slug, n.body).length === 0) break;
  await sleep(i * 900);
}
if (!n) { console.log("VERIFY_FAIL fetch"); process.exit(1); }
const url = `https://note.com/stats47/n/${key}`;
let http = 0; try { http = (await fetch(url)).status; } catch {}
const problems = [];
const split = misplacedFigures(slug, n.body).length;
if (split !== 0) problems.push(`misplaced=${split}`);
if (http !== 200) problems.push(`http=${http}`);
if (n.status !== "published") problems.push(`status=${n.status}`);
if (n.user?.urlname !== "stats47") problems.push(`account=${n.user?.urlname}`);
if (n.name !== before.title) problems.push("title changed");
if ((n.hashtag_notes?.length || 0) < 95) problems.push(`tags=${n.hashtag_notes?.length || 0}`);
if (Number(n.price || 0) !== before.price) problems.push(`price=${n.price}`);
if ((n.body.match(/<figure/g) || []).length !== before.figures) problems.push("figure count changed");
if (plain(n.body) !== plain(expect)) problems.push("body text differs from intended");
console.log(problems.length ? `VERIFY_FAIL ${problems.join(" ")}`
  : `VERIFY_OK misplaced=0 http=200 tags=${n.hashtag_notes.length} figures=${before.figures} price=${n.price || 0}`);
process.exit(problems.length ? 1 : 0);
