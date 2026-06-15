// note 記事の Phase 0 準備スクリプト（publish-note --update 用・実機検証済 2026-06-16）
// 使い方: node .claude/scripts/note/prepare-article.cjs <slug>
//   docs/31_note記事原稿/ から draft.md(優先)/note.md を解決し、frontmatter と本文を解析、
//   /tmp/note-data-<slug>.json に { title, isPaid, priceJpy, segments, segmentsPaid,
//   imgRefs(afterHeading付), urlCount, paidHead } を出力する。
//   本文画像参照 ![..](./images/x.png) は除去し、imgRefs に「直前見出し」とともに控える（挿入位置決め用）。
const fs = require("fs"), path = require("path");
const slug = process.argv[2];
const projectRoot = "/Users/minamidaisuke/stats47";
const baseDirs = [];
for (const root of ["docs/31_note記事原稿"]) {
  const rootAbs = path.join(projectRoot, root);
  baseDirs.push(path.join(rootAbs, slug));
  if (fs.existsSync(rootAbs)) {
    for (const v of fs.readdirSync(rootAbs)) {
      const vDir = path.join(rootAbs, v, slug);
      if (fs.existsSync(vDir)) baseDirs.push(vDir);
    }
  }
}
let articleDir = null, articleFile = null;
outer: for (const d of baseDirs) {
  for (const f of ["draft.md", "note.md"]) {
    if (fs.existsSync(path.join(d, f))) { articleDir = d; articleFile = f; break outer; }
  }
}
if (!articleDir) { console.error("ERROR: not found " + slug); process.exit(1); }
const raw = fs.readFileSync(path.join(articleDir, articleFile), "utf8");
const fm = (raw.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
const fmF = (k) => {
  const m = fm.match(new RegExp("^" + k + ":\\s*(?:\"(.+?)\"|'(.+?)'|(.+?))\\s*$", "m"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
};
const title = fmF("title");
const isPaid = fmF("is_paid") === "true";
const priceJpy = parseInt(fmF("price_jpy") || "0", 10);
let body = raw.replace(/^---\n[\s\S]*?\n---\n*/, "");
// 画像参照の位置（直前見出し）を控える
const imgRefs = []; let lastH = "";
for (const l of raw.split("\n")) {
  const h = l.match(/^#{1,3}\s+(.+)/); if (h) lastH = h[1].trim();
  const im = l.match(/!\[.*?\]\(\.\/images\/([^)]+)\)/); if (im) imgRefs.push({ file: im[1], afterHeading: lastH });
}
body = body.replace(/<!--[\s\S]*?-->\n?/g, "").replace(/!\[.*?\]\(.*?\)\n?/g, "").replace(/^---$/gm, "");
body = body.replace(/\n*^##\s*公開時にコピーするハッシュタグ[\s\S]*$/m, "").replace(/^#\s+.*\n+/, "").trim();
let bodyPaid = "";
if (isPaid) {
  const sm = body.match(/^ここから先は有料部分[:：][^\n]*$/m);
  if (sm) { const idx = body.indexOf(sm[0]); bodyPaid = body.substring(idx + sm[0].length).trim(); }
}
body = body.replace(/^ここから先は有料部分[:：][^\n]*$\n?/m, "").trim();
function seg(t) {
  const ls = t.split("\n"); const s = []; let b = [];
  for (const l of ls) {
    if (/^https?:\/\/\S+$/.test(l.trim())) { if (b.length) { s.push({ type: "text", content: b.join("\n") }); b = []; } s.push({ type: "url", content: l.trim() }); }
    else b.push(l);
  }
  if (b.length) s.push({ type: "text", content: b.join("\n") }); return s;
}
const segments = seg(body);
const segmentsPaid = isPaid ? seg(bodyPaid) : [];
const out = {
  slug, articleDir, articleFile, title, isPaid, priceJpy, segments, segmentsPaid, imgRefs,
  urlCount: segments.filter((s) => s.type === "url").length,
  paidHead: isPaid && segmentsPaid[0] ? segmentsPaid[0].content.slice(0, 24) : "",
};
fs.writeFileSync("/tmp/note-data-" + slug + ".json", JSON.stringify(out, null, 2));
console.log(JSON.stringify({ title: title.slice(0, 40), isPaid, priceJpy, segs: segments.length, urls: out.urlCount, imgs: imgRefs.map((r) => r.file), paidHead: out.paidHead, pipeTable: /\n\|.*\|.*\n\|[-: ]+\|/.test(body) }));
