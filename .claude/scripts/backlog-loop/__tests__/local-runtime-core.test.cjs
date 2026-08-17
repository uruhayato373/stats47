'use strict';

/**
 * ローカル端末依存の検出器を両方向で固定する。
 *
 * **検出テストだけでは足りない。** 「全部発火する」検出器は「何も見ていない」検出器と
 * 同じくらい役に立たない (誤検知を出すゲートは運用で無効化される)。ここでは
 * ①既知の 2 インシデントで発火すること ②意図的に却下したシグナル (`.github/` /
 * デプロイ / オーナー承認) では**発火しないこと**の両方を固定する。
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  localRuntimeSignals,
  localRuntimeReason,
} = require('../local-runtime-core.cjs');

/** 実インシデントの本文から要点だけを抜いた検体 (2026-08-17 に loop が燃やしかけた 2 件) */
const INCIDENTS = {
  'ASP-CONTINUITY-01': [
    '- **前提**: 初回のみ人間が headed ブラウザで手動ログインし、',
    '  永続プロファイル `.local/playwright-a8-profile` に保持する。',
  ].join('\n'),
  'PERF-LOCAL-NAV-01': [
    '- **完了条件**: 同一端末で before/after を実測し、体感の改善を確認できること。',
  ].join('\n'),
  'NOTE-MAGAZINE-REORG-01': [
    '- **前提**: 投稿は browser-use + Chrome Profile 5 (note.com ログイン済)。',
    '  実行環境 = オーナーのローカル Mac。',
  ].join('\n'),
};

test('既知インシデントで発火する', () => {
  for (const [id, body] of Object.entries(INCIDENTS)) {
    const signals = localRuntimeSignals(body);
    assert.ok(
      signals.length > 0,
      `${id} が検出されない — この検出器が守るはずの当の事例`,
    );
  }
});

test('シグナル名が理由に出る (次の人が同じ調査をやり直さないため)', () => {
  const signals = localRuntimeSignals(INCIDENTS['ASP-CONTINUITY-01']);
  const reason = localRuntimeReason(signals);
  assert.match(reason, /playwright-profile/);
  assert.match(reason, /blocked-local-runtime/);
});

test('検出なしなら理由は null', () => {
  assert.equal(localRuntimeReason([]), null);
  assert.equal(localRuntimeReason(null), null);
});

/**
 * ★非検出テスト。ここが緩むと「ほぼ全部 needs-owner」になり loop の feedstock が枯れる。
 *
 * 下の 4 つは**実測で却下したシグナル**を含む本文。却下理由は local-runtime-core.cjs の表。
 */
const MUST_NOT_FIRE = {
  'CI ファイルへの言及 (検証コマンドが .github/scripts にあるだけ)':
    '- **検証**: PR の Security Scan job summary (`.github/scripts/dump-codeql-sarif.mjs`) で該当行が消えること',
  'デプロイ後の実測が完了条件に入っているだけ':
    '- **完了条件**: デプロイ後に本番 URL が 410 を返すことを Googlebot UA で実測する',
  'オーナー承認が停止条件に書いてあるだけ':
    '- **停止条件**: 本番反映は outward-facing なのでオーナー承認を経てから',
  '普通の実装エントリ':
    '- **次**: prefCode の書式検証を gis 層の入口 2 箇所に置き、vitest で両方向を固定する',
};

test('却下したシグナルでは発火しない', () => {
  for (const [label, body] of Object.entries(MUST_NOT_FIRE)) {
    const signals = localRuntimeSignals(body);
    assert.equal(
      signals.length,
      0,
      `${label} で誤検知 (${signals.map((s) => s.name).join(',')}) — feedstock を枯らす`,
    );
  }
});

test('空文字・null は検出なし', () => {
  assert.deepEqual(localRuntimeSignals(''), []);
  assert.deepEqual(localRuntimeSignals(null), []);
  assert.deepEqual(localRuntimeSignals(undefined), []);
});
