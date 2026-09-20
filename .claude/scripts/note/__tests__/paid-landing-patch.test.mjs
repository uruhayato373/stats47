import assert from "node:assert/strict";
import test from "node:test";
import { composeFreeBody, splitPublishedBody, pngSize, findUnsupportedNumbers } from "../patch-note-paid-landing.mjs";

function ids() { let n = 0; return () => `00000000-0000-4000-8000-${String(++n).padStart(12, "0")}`; }

const FREE = '<p name="a" id="a">リード</p><p name="b" id="b">配布します。</p><h2 name="c" id="c">本文見出し</h2><p name="d" id="d">本文</p><p name="sep" id="sep">最後の無料段落</p>';
const PAY = '<h2 name="e" id="e">再現手順</h2><p name="f" id="f">有料本文</p><figure name="g" id="g" embedded-service="attachment">x.csv 4KB</figure>';

const spec = {
  key: "x",
  audienceHeading: "こんな人のためのデータです",
  audience: [{ strong: "担当者", text: "一枚の表で押さえたい" }],
  learnHeading: "このデータでわかること",
  learn: [{ strong: "偏り", text: "並べ替えるだけ" }],
  sampleHeading: "データのサンプル",
  sampleLead: "先頭部分です。",
  samples: [{ file: "x.png", caption: "1枚目", uploadedUrl: "https://assets.st-note.com/img/x.png", width: 1240, height: 620 }],
  sourceHeading: "データの出典",
  source: "出典：総務省統計局「家計調査」を加工して作成。",
  siteLink: { url: "https://stats47.jp/ranking/x", lead: "無料で見られます。", title: "X ランキング", description: "説明" },
  siteLinkTail: "ここから先は有料部分です。",
};

test("published body splits at the end of the separator element (free = public preview, pay = rest with attachments)", () => {
  const { free, pay } = splitPublishedBody(FREE + PAY, "sep");
  assert.equal(free, FREE);
  assert.equal(pay, PAY);
  assert.equal((pay.match(/embedded-service="attachment"/g) || []).length, 1);
  assert.throws(() => splitPublishedBody(FREE + PAY, "missing"), /separator 要素が本文に無い/);
});

test("intro block lands before the first h2 and the source block closes the free part with a new separator", () => {
  const out = composeFreeBody(FREE, spec, { idFactory: ids() });
  assert.deepEqual(out.changes, ["intro", "source"]);
  const introAt = out.html.indexOf("こんな人のためのデータです");
  const firstH2 = out.html.indexOf("本文見出し");
  assert.ok(introAt > 0 && introAt < firstH2, "導入は最初の h2 の前");
  assert.ok(out.html.indexOf("<h2 name=\"00000000-0000-4000-8000-000000000001\"") < firstH2);
  assert.match(out.html, /<ul name="[^"]+" id="[^"]+"><li><p name="[^"]+" id="[^"]+"><strong>担当者<\/strong> — 一枚の表で押さえたい<\/p><\/li><\/ul>/);
  assert.match(out.html, /<figure name="[^"]+" id="[^"]+"><img src="https:\/\/assets\.st-note\.com\/img\/x\.png" alt="" width="620" height="310"><figcaption>1枚目<\/figcaption><\/figure>/);
  assert.ok(out.html.endsWith(`<p name="${out.separatorId}" id="${out.separatorId}">ここから先は有料部分です。</p>`), "separator は末尾段落");
  assert.ok(out.html.includes("出典：総務省統計局「家計調査」を加工して作成。"));
  assert.match(out.html, /embedded-service="external-article"/);
  assert.ok(out.html.startsWith(FREE.slice(0, FREE.indexOf("<h2"))), "先頭のリードは保持");
});

test("composeFreeBody is idempotent once the headings and source text are present", () => {
  const first = composeFreeBody(FREE, spec, { idFactory: ids() });
  const second = composeFreeBody(first.html, spec, { idFactory: ids() });
  assert.deepEqual(second.changes, []);
  assert.equal(second.html, first.html);
  assert.equal(second.separatorId, null);
});

test("composeFreeBody refuses samples that were not uploaded (no broken <img> in a paid preview)", () => {
  const broken = { ...spec, samples: [{ file: "y.png", caption: "c", uploadedUrl: null, width: null, height: null }] };
  assert.throws(() => composeFreeBody(FREE, broken, { idFactory: ids() }), /未アップロード/);
});

test("pngSize reads IHDR", () => {
  const buf = Buffer.alloc(24);
  buf.write("\x89PNG\r\n\x1a\n", 0, "binary");
  buf.writeUInt32BE(13, 8); buf.write("IHDR", 12, "ascii");
  buf.writeUInt32BE(2720, 16); buf.writeUInt32BE(2192, 20);
  assert.deepEqual(pngSize(buf), { width: 2720, height: 2192 });
});

test("numbers in the intro must exist in the article body (LLM-authored specs cannot invent figures)", () => {
  const body = "1位の東京都は76%、最下位の高知県は24.1%で3.15倍。2011〜2022年度のCSV。全国平均 43.41%";
  const ok = { audience: [{ strong: "自治体職員", text: "2011〜2022年度の推移を使う" }], learn: [{ strong: "3.15倍の格差", text: "東京都76%と高知県24.1%" }] };
  assert.deepEqual(findUnsupportedNumbers(ok, body), []);
  const bad = { learn: [{ strong: "格差", text: "東京都 76% と沖縄県 29.5%、全国平均 43,41%" }] };
  // 本文に無い 29.5 と、桁区切りを誤った 43,41 (→ 4341) の両方を弾く
  assert.deepEqual(findUnsupportedNumbers(bad, body).sort(), ["29.5", "4341"]);
  // 桁区切りの有無は同一視する
  assert.deepEqual(findUnsupportedNumbers({ learn: [{ strong: "x", text: "1,400万人" }] }, "人口1400万人"), []);
});
