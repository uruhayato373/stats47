import assert from "node:assert/strict";
import test from "node:test";
import { findUnverifiedDisclosures } from "../lib/unverified-disclosure.mjs";

// 2026-10-24 までに公開された実際の言い回し (Excel・マイマップ・QGIS・商品パック記事)
const PUBLISHED_DISCLAIMERS = [
  "検証状況（2026年10月24日）: この制作環境にはMicrosoft 365のExcelがなく、以下の操作手順と県別の表示結果は実機で確認できていません。",
  "この制作環境では、Googleマイマップのファイル選択画面が表示されず、取り込み後の地図と県をクリックした表示は確認できていません。",
  "検証範囲 : この記事のQGIS画面操作は公式マニュアルを参照して記述しました。このMacにはQGISがなく、現在のQGIS画面での実機確認は未了です。",
  "Excel：同梱です（使い方・一覧・商業・出典の4シート）。実機での表示・編集・再計算は未確認です。",
  "全CSV指標をスライド化したものではありません。作成側での PowerPoint 実機確認は未了です。",
  "PowerPointとExcelでの動作は、現時点で実機確認が完了していません。",
  "総務省の通信利用動向調査の都道府県別の値は、stats47ではまだ確認できていません。",
];

// 記事の内容として正しく使われている語 (公開記事に実在)
const LEGITIMATE_TEXT = [
  "発言者の役職と発言内容を正確に記録 — 「○○課長: 〜」「△△係長: 〜」の形式",
  "数値・固有名詞は原文を尊重 (誤変換が疑われる場合は [要確認] を付与)",
  "npm install -g @anthropic-ai/claude-code # 動作確認 claude --version",
  "OK 回答 : 「公開事例は確認できていません。一方、デジタル庁が 2025-05 に…」",
  "Claude Code 単体 の自治体導入事例の公表は確認できていません。",
  "設定が動いているか必ず動作確認します。",
  "afb の申請フロー (2026-07-28 実機確認)。",
  "地図に個人の情報が入っていないか : 自宅の住所を確かめる",
  "県内に国際線のある空港がなく、海外旅行の参加率が低い",
];

test("公開された未検証の断り書きをすべて検出する", () => {
  for (const text of PUBLISHED_DISCLAIMERS) {
    assert.ok(findUnverifiedDisclosures(text).length > 0, `検出漏れ: ${text}`);
  }
});

test("記事の内容としての○○・要確認・動作確認・事例の有無には反応しない", () => {
  for (const text of LEGITIMATE_TEXT) {
    assert.deepEqual(findUnverifiedDisclosures(text), [], `誤検出: ${text}`);
  }
});

test("HTML 本文でもタグを越えて検出し、前後の文を返す", () => {
  const hits = findUnverifiedDisclosures("<p>手順です。</p><p>検証状況<br>（2026年10月24日）: 未確認</p>");
  assert.equal(hits[0].code, "verification-status-note");
  assert.match(hits[0].excerpt, /検証状況/);
});
