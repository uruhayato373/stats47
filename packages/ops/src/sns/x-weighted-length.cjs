"use strict";

/**
 * X (Twitter) の重み付き文字数。X 公式 twitter-text の設定 config/v3.json に合わせる
 * (https://github.com/twitter/twitter-text/blob/master/config/v3.json ・取得 2026-09-23):
 *   maxWeightedTweetLength 280 / scale 100 / defaultWeight 200 / transformedURLLength 23 /
 *   emojiParsingEnabled true / weight 100 の範囲 U+0000-U+10FF, U+2000-U+200D, U+2010-U+201F, U+2032-U+2037
 *
 * つまり日本語など範囲外の文字は 1 字 2、URL は長さに関係なく 23、絵文字は結合列ごとに 2。
 * 2026-09-23 に「URL・空白を除いた字数 ≤ 150」を満たすのに重み 284 の投稿が X に弾かれ、
 * 予約後も作成画面が閉じなかったことを受けて追加した。
 *
 * URL は http(s):// 付きと、本文の {{url}} トークン (register 時に URL に置換される) を 23 と数える。
 * twitter-text は「stats47.jp」のようなスキーム無しのドメインも URL として 23 と数えるため、
 * 主要 TLD のドメイン表記も 23 として数える (literal より長く数えるので安全側)。
 */

const MAX_WEIGHTED_LENGTH = 280;
const URL_WEIGHT = 23;
const LIGHT_RANGES = [
  [0x0000, 0x10ff],
  [0x2000, 0x200d],
  [0x2010, 0x201f],
  [0x2032, 0x2037],
];
const URL_PATTERN = /\{\{url\}\}|https?:\/\/\S+|\b[a-z0-9][a-z0-9-]*(?:\.[a-z0-9-]+)*\.(?:jp|com|net|org|io|co)\b(?:\/\S*)?/gi;
const EMOJI = /\p{Extended_Pictographic}/u;

function codePointWeight(cp) {
  return LIGHT_RANGES.some(([a, b]) => cp >= a && cp <= b) ? 1 : 2;
}

/** 本文の重み付き文字数 (NFC 正規化後)。 */
function weightedLength(text) {
  let total = 0;
  const rest = String(text)
    .normalize("NFC")
    .replace(URL_PATTERN, () => {
      total += URL_WEIGHT;
      return "";
    });
  const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
  for (const { segment } of segmenter.segment(rest)) {
    if (EMOJI.test(segment)) {
      total += 2;
      continue;
    }
    for (const ch of segment) total += codePointWeight(ch.codePointAt(0));
  }
  return total;
}

module.exports = { MAX_WEIGHTED_LENGTH, weightedLength };
