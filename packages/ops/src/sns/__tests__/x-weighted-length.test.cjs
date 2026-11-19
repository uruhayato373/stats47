"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { MAX_WEIGHTED_LENGTH, weightedLength } = require("../x-weighted-length.cjs");

test("ASCII と改行は 1、日本語と全角記号は 2 で数える", () => {
  assert.equal(weightedLength("abc"), 3);
  assert.equal(weightedLength("a\nb"), 3);
  assert.equal(weightedLength("あいう"), 6);
  assert.equal(weightedLength("「県」"), 6);
  assert.equal(weightedLength("3.7倍"), 5);
});

test("URL は長さに関係なく 23。{{url}} トークンとスキーム無しのドメインも 23", () => {
  assert.equal(weightedLength("https://stats47.jp/ranking/pet-food-consumption-expenditure?utm_source=x&utm_medium=social"), 23);
  assert.equal(weightedLength("{{url}}"), 23);
  assert.equal(weightedLength("stats47.jp"), 23);
  assert.equal(weightedLength("続きは https://stats47.jp/a"), 6 + 1 + 23);
});

test("絵文字は結合列ごとに 2", () => {
  assert.equal(weightedLength("👇"), 2);
  assert.equal(weightedLength("👨‍👩‍👧"), 2);
  assert.equal(weightedLength("📌保存"), 6);
});

test("2026-09-23 に X に弾かれた本文 (URL・空白を除き 144 字) は 280 を超え、短くした版は収まる", () => {
  const rejected =
    "ペットフードにいちばんお金を使う県は福島。\n\n1世帯あたり1万6,285円。2位高知1万5,807円、3位岡山1万5,256円。\n最も少ない沖縄（4,459円）とは3.7倍差。うちの子のごはん代、あなたの家は？\n※家計調査・県庁所在市の2人以上世帯、年間（2024年）\n\n{{url}}\n\n#都道府県 #ペット #家計調査";
  const accepted =
    "ペットフードにいちばんお金を使う県は福島。\n\n1世帯あたり1万6,285円。2位は高知の1万5,807円。\n最も少ない沖縄（4,459円）とは3.7倍差。ペットのごはん代、あなたの家は？\n※家計調査・県庁所在市の2人以上世帯、年間（2024年）\n\n{{url}}\n\n#都道府県 #ペット #家計調査";
  assert.equal(weightedLength(rejected), 284);
  assert.ok(weightedLength(rejected) > MAX_WEIGHTED_LENGTH);
  assert.equal(weightedLength(accepted), 267);
  assert.ok(weightedLength(accepted) <= MAX_WEIGHTED_LENGTH);
});
