// 公開済み note 記事の「図が文章を分断している」状態を判定・是正する純関数群。
//
// 原因 (2026-09-06): 画像挿入時に `Home` キーで行頭へ移動していたため、`Home` が
// 「視覚上の行頭 (折り返し行の先頭)」へ飛び、長い段落では文の途中に改行が入って
// 図がその位置に挿さっていた。公開 56 本中 46 本で発生。
//
// 是正方針: 文章・数値・画像は一切変えず、block の区切りだけを draft.md (SSOT) に
// 合わせ直す。分断された <p> の innerHTML を連結し、<figure> は verbatim で再配置する。
// draft.md に無い末尾ブロック (公開後に足したナビゲーションフッタ等) は原文のまま残す。
// 公開本文の block 分割を draft.md の段落境界に合わせて組み直す。
// 文字は一切変えない: 分断された <p> の innerHTML を連結し、<figure> は verbatim で再配置する。
import fs from "node:fs";
import path from "node:path";
const DOCS = "/Users/minamidaisuke/stats47/docs/31_note記事原稿";

export const plain = (h) => h.replace(/<br\s*\/?>/g, "").replace(/<[^>]+>/g, "")
  .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, "").trim();

// draft.md の本文を block 列にする
export function draftBlocks(slug) {
  const md = fs.readFileSync(path.join(DOCS, slug, "draft.md"), "utf8");
  const body = md.replace(/^---\n[\s\S]*?\n---\n/, "");
  const out = [];
  for (const raw of body.split(/\n{2,}/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(line)) { out.push({ kind: "image" }); continue; }
    const h = line.match(/^(#{2,6})\s+(.*)$/);
    if (h) { out.push({ kind: "heading", level: h[1].length, text: strip(h[2]) }); continue; }
    out.push({ kind: "para", text: strip(line) });
  }
  return out;
}
const strip = (s) => s.replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/`([^`]*)`/g, "$1").replace(/\s+/g, "").trim();

// 公開本文を block トークンにする
export function publishedBlocks(html) {
  const re = /<(p|h[1-6]|figure|ul|ol|blockquote)\b([^>]*)>([\s\S]*?)<\/\1>/g;
  const out = []; let m;
  while ((m = re.exec(html))) out.push({ tag: m[1], attrs: m[2], inner: m[3], full: m[0], text: plain(m[3]) });
  return out;
}

export function rebuild(slug, html) {
  const dblocks = draftBlocks(slug);
  const pblocks = publishedBlocks(html).map((b, i) => ({ ...b, i }));
  const flow = pblocks.filter((b) => b.tag !== "figure");
  const dTextBlocks = dblocks.filter((d) => d.kind !== "image");

  // 1) draft の見出し/段落を flow に突き合わせ、draft 本文が終わる原文 index を決める
  let pi = 0, lastUsed = -1;
  const merged = [];
  for (const d of dTextBlocks) {
    let acc = "", inner = "", open = null;
    while (acc.length < d.text.length) {
      if (pi >= flow.length) throw new Error(`${slug}: block 不足 (期待 "${d.text.slice(0, 20)}...")`);
      const b = flow[pi++];
      if (!open) open = b;
      acc += b.text; inner += b.inner; lastUsed = b.i;
    }
    if (acc !== d.text) throw new Error(`${slug}: text 不一致\n  draft: ${d.text.slice(0, 60)}\n  live : ${acc.slice(0, 60)}`);
    const tag = d.kind === "heading" ? `h${d.level}` : "p";
    if (open.tag !== tag) throw new Error(`${slug}: tag 不一致 ${open.tag} != ${tag}`);
    merged.push(`<${tag}${open.attrs}>${inner}</${tag}>`);
  }

  // 2) draft 本文範囲内の figure だけを draft の画像位置へ配る。範囲外 (公開後に足した
  //    ナビゲーションフッタ等) は tail として原文の順序のまま残す。
  const bodyFigs = pblocks.filter((b) => b.tag === "figure" && b.i < lastUsed);
  const wantImgs = dblocks.filter((d) => d.kind === "image").length;
  if (bodyFigs.length !== wantImgs) throw new Error(`${slug}: figure 数不一致 body=${bodyFigs.length} draft=${wantImgs}`);
  const tail = pblocks.filter((b) => b.i > lastUsed).map((b) => b.full).join("");

  let mi = 0, fi = 0;
  const pieces = [];
  for (const d of dblocks) pieces.push(d.kind === "image" ? bodyFigs[fi++].full : merged[mi++]);
  const out = pieces.join("") + tail;

  // 不変量: テキスト・リンク・画像・figure 数がすべて保存されている
  if (plain(out) !== plain(html)) throw new Error(`${slug}: 全文テキストが変化した`);
  const sorted = (s, re) => (s.match(re) || []).sort().join("|");
  if (sorted(out, /href="[^"]*"/g) !== sorted(html, /href="[^"]*"/g)) throw new Error(`${slug}: リンクが変化した`);
  if (sorted(out, /src="[^"]*"/g) !== sorted(html, /src="[^"]*"/g)) throw new Error(`${slug}: 画像が変化した`);
  if ((out.match(/<figure/g) || []).length !== (html.match(/<figure/g) || []).length) throw new Error(`${slug}: figure 数が変化した`);
  return out;
}

// figure 直前段落が文末で終わるか (detect.mjs と同じ判定)
export function splitCount(html) {
  const ENDERS = /[。！？」）\)\]】…：:’"']$/;
  const bs = publishedBlocks(html);
  const t = (b) => b.text;
  let bad = 0;
  bs.forEach((b, i) => {
    if (b.tag !== "figure") return;
    let j = i - 1; while (j >= 0 && t(bs[j]) === "") j--;
    if (j < 0) return;
    if (["figure", "ul", "ol", "blockquote"].includes(bs[j].tag) || /^h[1-6]$/.test(bs[j].tag)) return;
    if (!ENDERS.test(t(bs[j]))) bad++;
  });
  return bad;
}

// 末尾文字による判定は「…清掃代（2.24倍）」+「やベッド…」のような文中の閉じ括弧を
// 文末と誤認する (2026-09-06 に a-kakei-kagawa で実測)。ヒューリスティックではなく
// draft.md (SSOT) の block 列と突き合わせて厳密に判定する。
// 戻り値 0 = 公開本文の block 構成が draft と完全一致 (図が段落の切れ目にある)。
export function structureMismatch(slug, html) {
  const dblocks = draftBlocks(slug);
  const pblocks = publishedBlocks(html);
  const want = dblocks.map((d) => (d.kind === "image" ? "figure" : d.kind === "heading" ? `h${d.level}` : "p"));
  const got = pblocks.slice(0, want.length).map((b) => b.tag);
  if (got.length !== want.length) return want.length;   // block が足りない
  let diff = 0;
  for (let i = 0; i < want.length; i++) if (want[i] !== got[i]) diff++;
  if (diff > 0) return diff;
  // 先頭が一致していても、draft 分を超えて本文 block が続いていれば分断されている。
  // (公開後に足したナビゲーションフッタは figure/p の塊なので、テキスト総量で見る)
  const wantText = dblocks.filter((d) => d.kind !== "image").map((d) => d.text).join("");
  const gotText = pblocks.slice(0, want.length).filter((b) => b.tag !== "figure").map((b) => b.text).join("");
  return wantText === gotText ? 0 : 1;
}

// 図が段落の切れ目に入っているかを draft.md と突き合わせて厳密に判定する。
// 「図の直前にあるテキスト」が draft の対応する直前 block の全文と一致すれば正しい位置。
// 段落が分断されていれば直前は断片になるので一致しない (末尾文字の推測をしない)。
// 戻り値: 位置が draft と違う figure の一覧。
export function misplacedFigures(slug, html) {
  return misplacedFiguresFrom(draftBlocks(slug), html);
}

// 上の純粋版 (draft block 列を直接渡す)。テストと再利用のために分けてある。
export function misplacedFiguresFrom(dblocks, html) {
  const pblocks = publishedBlocks(html);
  const wantBefore = [];
  dblocks.forEach((d, i) => {
    if (d.kind !== "image") return;
    let j = i - 1;
    while (j >= 0 && dblocks[j].kind === "image") j--;
    wantBefore.push(j < 0 ? "" : dblocks[j].text);
  });
  const out = [];
  let fi = 0;
  for (let i = 0; i < pblocks.length && fi < wantBefore.length; i++) {
    if (pblocks[i].tag !== "figure") continue;
    let j = i - 1;
    while (j >= 0 && pblocks[j].text === "") j--;
    const got = j < 0 ? "" : pblocks[j].text;
    if (got !== wantBefore[fi]) out.push({ index: fi, want: wantBefore[fi].slice(-30), got: got.slice(-30) });
    fi++;
  }
  if (fi < wantBefore.length) out.push({ index: fi, want: wantBefore[fi].slice(-30), got: "(figure が足りない)" });
  return out;
}
