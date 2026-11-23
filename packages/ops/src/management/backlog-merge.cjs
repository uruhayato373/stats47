'use strict';

/**
 * backlog.md の 3 方向マージをカード単位で行う純関数。
 *
 * 週次レビューの無人実行は、develop へ push する前の rebase で、CI が同じ時間に backlog.md へ
 * カードを足した commit とぶつかる (2026-11-21 の W46。両側が 🟡 の先頭にカードを足しただけだった)。
 * git の行単位のマージは「同じ場所への別々の追加」を衝突にするが、カード単位で見れば両方を残せば済む。
 *
 * 規則 (カードの ID ごと・章の頭ごと・前置きごと):
 * - 片側だけが変えた (足した・消した・書き換えた・別の章へ移した) → 変えた側を採る
 * - 両側が同じに変えた → それを採る
 * - 両側が別々に変えた → 解けない (conflicts に理由を返し、結果は返さない)
 * 並びは自分 (ours) の並びを基準にし、相手 (theirs) だけにあるカードは、相手の並びで直前にあるカードの後ろへ入れる。
 * 行は元の文書のまま組み立てる (空行の数も変えない)。比較だけは末尾の空行を無視する。
 *
 * 章 (`## `) の並びが 3 つで違うときは、構造の変更なので解かない。
 */

const { fenceTracker, splitHeadingId } = require('./backlog-lib.cjs');

const trimmed = (lines) => {
  let end = lines.length;
  while (end > 0 && lines[end - 1].trim() === '') end -= 1;
  return lines.slice(0, end).join('\n');
};

/**
 * 文書を「前置き」と「章」に分け、章を「章の頭 (見出し + 最初のカードまでの行)」とカードに分ける。
 * どの部分も元の行 (末尾の空行を含む) を lines に持ち、比較用に末尾の空行を落とした text を持つ。
 */
function splitDocument(text) {
  const lines = String(text ?? '').replace(/\r\n/g, '\n').split('\n');
  const fence = fenceTracker();
  const preamble = [];
  const sections = [];
  let sec = null;
  let card = null;
  lines.forEach((ln) => {
    const inFence = fence(ln);
    if (!inFence && /^##\s+/.test(ln) && !/^###/.test(ln)) {
      card = null;
      sec = { header: ln, intro: [ln], cards: [] };
      sections.push(sec);
      return;
    }
    if (!inFence && sec && /^###\s+/.test(ln)) {
      const { id } = splitHeadingId(ln.replace(/^###\s+/, '').trim());
      card = { key: id || `heading:${ln.trim()}`, lines: [ln] };
      sec.cards.push(card);
      return;
    }
    if (card) card.lines.push(ln);
    else if (sec) sec.intro.push(ln);
    else preamble.push(ln);
  });
  for (const s of sections) for (const c of s.cards) c.text = trimmed(c.lines);
  return { preamble, sections };
}

function cardMap(doc) {
  const map = new Map();
  for (const sec of doc.sections) {
    for (const c of sec.cards) {
      if (map.has(c.key)) throw new Error(`同じカードが 2 枚ある: ${c.key}`);
      map.set(c.key, { section: sec.header, text: c.text, lines: c.lines });
    }
  }
  return map;
}

const sameCard = (a, b) => (a === undefined && b === undefined)
  || (a !== undefined && b !== undefined && a.section === b.section && a.text === b.text);
const sameLines = (a, b) => trimmed(a) === trimmed(b);

/** 1 つの値の 3 方向マージ。解けなければ { conflict: true }。 */
function pick(base, ours, theirs, eq) {
  if (eq(ours, theirs)) return { value: ours };
  if (eq(ours, base)) return { value: theirs };
  if (eq(theirs, base)) return { value: ours };
  return { conflict: true };
}

/**
 * @param {string} baseText 共通の祖先 (git の stage 1)
 * @param {string} oursText 自分 (stage 2)
 * @param {string} theirsText 相手 (stage 3)
 * @returns {{ok:true, text:string, stats:{cards:number, fromTheirs:number, removed:number}} | {ok:false, conflicts:string[]}}
 */
function mergeBacklog(baseText, oursText, theirsText) {
  const base = splitDocument(baseText);
  const ours = splitDocument(oursText);
  const theirs = splitDocument(theirsText);
  const conflicts = [];

  const headers = (d) => d.sections.map((s) => s.header).join('\n');
  if (headers(base) !== headers(ours) || headers(base) !== headers(theirs)) {
    return { ok: false, conflicts: ['章 (## の見出し) の並びが 3 つで違う'] };
  }

  const preamble = pick(base.preamble, ours.preamble, theirs.preamble, sameLines);
  if (preamble.conflict) conflicts.push('前置き (frontmatter と最初の章より前) を両側が別々に変えた');
  const intros = ours.sections.map((s, i) => {
    const r = pick(base.sections[i].intro, s.intro, theirs.sections[i].intro, sameLines);
    if (r.conflict) conflicts.push(`章の頭を両側が別々に変えた: ${s.header}`);
    return r.value;
  });

  let B; let O; let T;
  try { B = cardMap(base); O = cardMap(ours); T = cardMap(theirs); } catch (e) { return { ok: false, conflicts: [e.message] }; }
  const result = new Map();
  for (const k of new Set([...B.keys(), ...O.keys(), ...T.keys()])) {
    const r = pick(B.get(k), O.get(k), T.get(k), sameCard);
    if (r.conflict) { conflicts.push(`同じカードを両側が別々に変えた: ${k}`); continue; }
    if (r.value !== undefined) result.set(k, r.value);
  }
  if (conflicts.length) return { ok: false, conflicts };

  // 並び: 自分の並びを基準に、結果に残るカードを章ごとに置く
  const order = new Map(ours.sections.map((s) => [s.header, []]));
  for (const s of ours.sections) {
    for (const c of s.cards) if (result.get(c.key)?.section === s.header) order.get(s.header).push(c.key);
  }
  const placed = new Set([...order.values()].flat());
  // 相手の並びで、まだ置いていないカードを直前のカードの後ろへ入れる
  let fromTheirs = 0;
  for (const s of theirs.sections) {
    const list = order.get(s.header);
    let prev = null;
    for (const c of s.cards) {
      if (result.get(c.key)?.section === s.header && !placed.has(c.key)) {
        list.splice(prev ? list.indexOf(prev) + 1 : 0, 0, c.key);
        placed.add(c.key);
        fromTheirs += 1;
      }
      if (list.includes(c.key)) prev = c.key;
    }
  }
  if (placed.size !== result.size) return { ok: false, conflicts: ['置き場の決まらないカードがある (内部の不整合)'] };

  // 組み立て: 各部分の元の行をそのままつなぐ。相手から差し込んだカードの前後だけ、末尾が空行でなければ空行を 1 行足す
  const oursPlace = new Map();
  ours.sections.forEach((s) => s.cards.forEach((c) => oursPlace.set(c.key, s.header)));
  const parts = [{ lines: preamble.value, inserted: false }];
  ours.sections.forEach((s, i) => {
    parts.push({ lines: intros[i], inserted: false });
    for (const k of order.get(s.header)) {
      const v = result.get(k);
      parts.push({ lines: v.lines, inserted: oursPlace.get(k) !== s.header || v !== O.get(k) });
    }
  });
  const out = [];
  parts.forEach(({ lines, inserted }, i) => {
    out.push(...lines);
    const next = parts[i + 1];
    if (next && (inserted || next.inserted) && lines.length && lines[lines.length - 1].trim() !== '') out.push('');
  });
  const removed = [...O.keys()].filter((k) => !result.has(k)).length;
  return { ok: true, text: out.join('\n'), stats: { cards: result.size, fromTheirs, removed } };
}

module.exports = { mergeBacklog, splitDocument };
