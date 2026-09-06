import test from "node:test";
import assert from "node:assert/strict";
import { splitCount, publishedBlocks, plain } from "../lib/figure-split.mjs";

const p = (t) => `<p name="x" id="x">${t}</p>`;
const h = (t) => `<h2 name="x" id="x">${t}</h2>`;
const fig = '<figure name="f" id="f"><img src="https://example.com/a.png"></figure>';

test("文の途中で図が挿さっている状態を検出する", () => {
  // 実際の障害と同じ形: 1 段落が視覚行頭で 2 つに割れ、その間に図が入っている
  assert.equal(splitCount(p("47市平均を1.00と") + fig + p("した比率で見ると、教育費は2.00倍です。")), 1);
});

test("段落が文末で終わっていれば分断とみなさない", () => {
  assert.equal(splitCount(p("唯一平均を下回る費目です。") + fig + p("グラフを見ると、")), 0);
});

test("見出し直後・本文先頭の図は分断ではない", () => {
  assert.equal(splitCount(h("通学定期代が支出を押し上げる") + fig + p("47市平均より")), 0);
  assert.equal(splitCount(fig + p("47市平均より")), 0);
});

test("閉じ括弧・感嘆符・疑問符も文末として扱う", () => {
  for (const tail of ["です。", "でしょうか？", "そうです！", "「引用」", "（注記）"])
    assert.equal(splitCount(p("本文" + tail) + fig + p("次")), 0, tail);
});

test("figure が複数あればそれぞれ独立に判定する", () => {
  const html = p("途中で切れた") + fig + p("続きです。") + fig + p("次の段落。");
  assert.equal(splitCount(html), 1);
});

test("publishedBlocks は figure と段落を順序どおり取り出す", () => {
  const bs = publishedBlocks(h("見出し") + p("本文。") + fig);
  assert.deepEqual(bs.map((b) => b.tag), ["h2", "p", "figure"]);
});

test("plain は空白とエンティティを畳んでテキストだけを返す", () => {
  assert.equal(plain('<p>a&amp;b <a href="/x">c</a>\nd</p>'), "a&bcd");
});

// --- 末尾文字ヒューリスティックの誤判定 (2026-09-06 に a-kakei-kagawa で実測) ---
// 「…清掃代（2.24倍）」+ 図 +「やベッド…」は文中で切れているのに、末尾が `）` なので
// 文末判定を通ってしまう。draft と突き合わせる misplacedFigures はこれを捉える。
test("末尾が閉じ括弧でも文中なら splitCount は見逃す (既知の限界)", () => {
  assert.equal(splitCount(p("上位は清掃代（2.24倍）") + fig + p("やベッド（2.12倍）も高めです。")), 0);
});

// --- misplacedFigures: draft と突き合わせる厳密判定 ---
import { misplacedFiguresFrom } from "../lib/figure-split.mjs";
const D = { para: (t) => ({ kind: "para", text: t }), head: (t) => ({ kind: "heading", level: 2, text: t }), img: () => ({ kind: "image" }) };

test("図が draft と同じ位置にあれば misplaced 0", () => {
  const draft = [D.head("見出し"), D.img(), D.para("本文です。")];
  assert.equal(misplacedFiguresFrom(draft, h("見出し") + fig + p("本文です。")).length, 0);
});

test("段落が分断されて図が文中に入っていれば検出する", () => {
  const draft = [D.head("見出し"), D.img(), D.para("上位は清掃代（2.24倍）やベッド（2.12倍）も高めです。")];
  // 末尾が `）` なので splitCount は見逃すが、こちらは断片と全文の差で捉える
  const html = h("見出し") + p("上位は清掃代（2.24倍）") + fig + p("やベッド（2.12倍）も高めです。");
  const bad = misplacedFiguresFrom(draft, html);
  assert.equal(bad.length, 1);
  // draft では図は見出しの直後にある。実際は段落の断片が前に来ているので不一致になる。
  assert.equal(bad[0].want, "見出し");
  assert.equal(bad[0].got, "上位は清掃代（2.24倍）");
});

test("先頭の図は直前テキスト無しとして扱う", () => {
  assert.equal(misplacedFiguresFrom([D.img(), D.para("本文です。")], fig + p("本文です。")).length, 0);
  assert.equal(misplacedFiguresFrom([D.img(), D.para("本文です。")], p("先に段落。") + fig + p("本文です。")).length, 1);
});

test("figure が足りなければ検出する", () => {
  assert.equal(misplacedFiguresFrom([D.para("本文です。"), D.img()], p("本文です。")).length, 1);
});
