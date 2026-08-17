'use strict';

/**
 * 「CI では原理的に閉じられない = ローカル端末が要る」エントリを本文から検出する純関数。
 *
 * ## なぜ要るか (2026-08-17 に 2 回踏んだ)
 *
 * `status` は人が手で書く。書き忘れると **loop がそのエントリを拾い、3 回失敗して
 * quarantine するだけ**で終わる。1 件あたり CI 3 run と日次枠 3 日分を捨てる。
 *
 * 実際に起きたのは 2 件:
 * - `ASP-CONTINUITY-01` — A8 の永続 Playwright プロファイル (`.local/playwright-a8-profile`) が要る
 * - `PERF-LOCAL-NAV-01` — 同一端末での before/after 実測が要る
 *
 * どちらも「本文には要件が書いてあるのに status が pending のまま」だった。人が気づいて
 * 手で `blocked-*` に直したが、**気づかなければ loop が黙って燃やす**。
 *
 * ## 何を検出し、何を検出しないか (実測で決めた)
 *
 * 現行 56 エントリで候補シグナルを総当たりし、**誤検知が出るものを落とした**。
 *
 * | シグナル | 採否 | 実測 |
 * |---|---|---|
 * | Playwright 永続プロファイル / 手動ログイン / browser-use / launchd / 同一端末 | **採用** | 既知 2 件に発火・非 blocked 集団の誤検知 0 |
 * | `.github/` への言及 | **却下** | 非 blocked 6 件に発火。大半は「検証コマンドが .github/scripts にある」等の文脈で、作業自体は packages 内 |
 * | 「デプロイ」「本番反映」 | **却下** | 完了条件に「デプロイ後に実測」と書いてあるだけのエントリを巻き込む |
 * | 「オーナー判断/承認」 | **却下** | blocked 集団への recall が 15 件中 2 件しかなく、非 blocked にも発火する |
 *
 * **owner 承認待ち・`.github/` 禁止パスはここでは見ない。** 文面から機械的に判別できないと
 * 実測で分かったものを「一応入れておく」と、誤検知を出すゲートになって運用で無効化される
 * (`unit-semantics-standards.md` §5)。この検出器は**ローカル端末依存だけ**を担当する。
 *
 * ## 除外ではなく再ルーティング
 *
 * 発火したエントリは needs-owner へ回す (握り潰さない)。人が見て
 * ①status を `blocked-local-runtime` に直す ②ローカル部分を切り出して残りを loop に残す
 * のどちらかを選ぶ。**捨てるより保留のほうが安い** — 取りこぼしても人が再ラベルするだけだが、
 * 拾わせると CI 3 run と quarantine を失う。
 *
 * I/O を持たない。テスト: `__tests__/local-runtime-core.test.cjs`
 * 正典: `.claude/rules/backlog-loop.md`
 */

/**
 * ローカル端末 (対話ブラウザ / 永続プロファイル / 同一端末実測 / launchd) が要ることを
 * 名指ししている表現。**具体物を名指ししているものだけ**を入れる。
 */
const LOCAL_RUNTIME_SIGNALS = [
  {
    name: 'playwright-profile',
    pattern: /\.local\/playwright|playwright-[a-z0-9-]+-profile|永続プロファイル/,
    why: 'Playwright の永続プロファイルはローカルにしか無い',
  },
  {
    name: 'browser-profile',
    pattern: /browser-use|Chrome Profile/,
    why: '実 Chrome を占有する対話操作は CI で再現できない',
  },
  {
    name: 'manual-login',
    pattern: /手動ログイン|対話ログイン|2FA/,
    why: '人手の認証が要る (認証情報を CI に置かない規約)',
  },
  {
    name: 'local-machine',
    pattern: /ローカル端末|同一端末|オーナーのローカル|実行環境 = オーナー|launchd/,
    why: '同一端末での実行・実測が要る',
  },
];

/**
 * 本文に含まれるローカル端末依存シグナルを返す。
 *
 * @param {string} body エントリ本文
 * @returns {Array<{name: string, why: string}>} 発火したシグナル (空配列 = 検出なし)
 */
function localRuntimeSignals(body) {
  const text = String(body ?? '');
  if (!text) return [];
  return LOCAL_RUNTIME_SIGNALS.filter(({ pattern }) => pattern.test(text)).map(
    ({ name, why }) => ({ name, why }),
  );
}

/**
 * 人が読む 1 行の理由。何が引っかかったか・次に何をするかまで書く
 * (「ローカル依存です」だけだと次の人が同じ調査をやり直す)。
 */
function localRuntimeReason(signals) {
  if (!signals || signals.length === 0) return null;
  const names = signals.map((s) => s.name).join(', ');
  const why = signals[0].why;
  return `ローカル端末依存を検出 (${names}: ${why})。status を blocked-local-runtime にするか、CI で閉じられる部分を切り出す`;
}

module.exports = {
  LOCAL_RUNTIME_SIGNALS,
  localRuntimeSignals,
  localRuntimeReason,
};
