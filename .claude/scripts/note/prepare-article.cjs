// note 記事の Phase 0 準備スクリプト（publish-note --update 用・実機検証済 2026-06-16）
// 使い方: node .claude/scripts/note/prepare-article.cjs <slug>
//   docs/31_note記事原稿/ から draft.md(優先)/note.md を解決し、frontmatter と本文を解析、
//   /tmp/note-data-<slug>.json に { title, isPaid, priceJpy, segments, segmentsPaid,
//   imgRefs(afterHeading付), affiliateBanners, urlCount, paidHead } を出力する。
//   本文画像参照 ![..](./images/x.png) は除去し、imgRefs に「直前見出し」とともに控える（挿入位置決め用）。
//   アフィリエイトバナープレースホルダー {{AFFILIATE_BANNER:X}} は affiliateBanners に控えて本文から除去。
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
if (!articleDir) {
  console.error("ERROR: not found " + slug);
  console.error("  docs/31_note記事原稿 に記事がありません。先に復元してください:");
  console.error("  bash .claude/scripts/note/restore-from-r2.sh " + slug);
  process.exit(1);
}
const raw = fs.readFileSync(path.join(articleDir, articleFile), "utf8");
const fm = (raw.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
const fmF = (k) => {
  const m = fm.match(new RegExp("^" + k + ":\\s*(?:\"(.+?)\"|'(.+?)'|(.+?))\\s*$", "m"));
  return m ? (m[1] ?? m[2] ?? m[3] ?? "") : "";
};
const title = fmF("title");
const isPaid = fmF("is_paid") === "true";
const priceJpy = parseInt(fmF("price_jpy") || "0", 10);
const productArchiveField = fmF("product_archive");
const productAttachmentAfter = fmF("product_attachment_after");
let productAttachment = null;
if (productArchiveField) {
  const archivePath = path.resolve(projectRoot, productArchiveField);
  const productRoot = path.join(projectRoot, ".local/geo-products") + path.sep;
  if (!archivePath.startsWith(productRoot) || path.extname(archivePath).toLowerCase() !== ".zip") {
    console.error("ERROR: product_archive must be a ZIP under .local/geo-products");
    process.exit(1);
  }
  if (!fs.existsSync(archivePath)) {
    console.error("ERROR: product_archive not found: " + productArchiveField);
    process.exit(1);
  }
  if (fs.statSync(archivePath).size > 50 * 1024 * 1024) {
    console.error("ERROR: product_archive exceeds note 50MB limit: " + productArchiveField);
    process.exit(1);
  }
  if (!isPaid || !productAttachmentAfter) {
    console.error("ERROR: product_archive requires is_paid=true and product_attachment_after");
    process.exit(1);
  }
  productAttachment = {
    path: archivePath,
    name: path.basename(archivePath),
    afterHeading: productAttachmentAfter,
    bytes: fs.statSync(archivePath).size,
  };
}
let body = raw.replace(/^---\n[\s\S]*?\n---\n*/, "");
// 画像参照の位置（直前見出し）を控える
const imgRefs = []; let lastH = "";
for (const l of raw.split("\n")) {
  const h = l.match(/^#{1,3}\s+(.+)/); if (h) lastH = h[1].trim();
  const im = l.match(/!\[.*?\]\((?:\.\/)?images\/([^)]+)\)/); if (im) imgRefs.push({ file: im[1], afterHeading: lastH });
}
// アフィリエイトバナープレースホルダー {{AFFILIATE_BANNER:X}} を抽出して除去
const affiliateBanners = [];
{
  const bodyLines = body.split('\n');
  const kept = [];
  for (let i = 0; i < bodyLines.length; i++) {
    const m = bodyLines[i].match(/^\{\{AFFILIATE_BANNER:([^}]+)\}\}$/);
    if (m) {
      const prevNonEmpty = kept.filter(l => l.trim()).slice(-1)[0] || '';
      affiliateBanners.push({ id: m[1].trim(), anchor: prevNonEmpty.trim() });
    } else {
      kept.push(bodyLines[i]);
    }
  }
  body = kept.join('\n');
}
body = body.replace(/<!--[\s\S]*?-->\n?/g, "").replace(/!\[.*?\]\(.*?\)\n?/g, "").replace(/^---$/gm, "");
body = body.replace(/\n*^##\s*公開時にコピーするハッシュタグ[\s\S]*$/m, "").replace(/^#\s+.*\n+/, "").trim();
let bodyPaid = "";
// マーカーは「ここから先は有料部分:」と「ここから先は有料部分です:」の 2 種が混在するため
// 行全体を許容する（[:：] を必須にすると「です:」表記を取りこぼし paidHead が空になる）。
const PAID_MARK = /^ここから先は有料部分[^\n]*$/m;
if (isPaid) {
  const sm = body.match(PAID_MARK);
  if (sm) { const idx = body.indexOf(sm[0]); bodyPaid = body.substring(idx + sm[0].length).trim(); }
}
body = body.replace(/^ここから先は有料部分[^\n]*$\n?/m, "").trim();
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
  affiliateBanners, productAttachment,
  urlCount: segments.filter((s) => s.type === "url").length,
  paidHead: isPaid && segmentsPaid[0] ? segmentsPaid[0].content.slice(0, 24) : "",
};
fs.writeFileSync("/tmp/note-data-" + slug + ".json", JSON.stringify(out, null, 2));
console.log(JSON.stringify({ title: title.slice(0, 40), isPaid, priceJpy, segs: segments.length, urls: out.urlCount, imgs: imgRefs.map((r) => r.file), affiliates: affiliateBanners.map((a) => a.id), attachment: productAttachment?.name ?? null, paidHead: out.paidHead, pipeTable: /\n\|.*\|.*\n\|[-: ]+\|/.test(body) }));
