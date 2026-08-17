'use strict';

/**
 * `data/workflow-dispatch-requests.json` を commit する前に、
 * **dispatch 先が main を checkout する workflow なのに develop の変更が main に載っていない**
 * 状態を検出する。
 *
 * ## なぜ要るか (2026-08-17 に実際に踏んだ)
 *
 * `sync-snapshots.yml` の `sync` job は **`ref: main` を checkout する**。したがって
 * develop で config を直しただけの状態で dispatch すると、**main の古い config で再生成される**。
 * regenerate 自体は成功し、R2 の `generatedAt` も更新されるので、**失敗にも見えない**。
 *
 * 実害: 婚姻率・離婚率の `seoTitle` を develop で是正した状態で `--only ranking-items` を投げ、
 * 本番の `<title>` が「離婚率 2024年・東京5.7」のまま変わらなかった。SKILL には
 * 「exporter を変更した場合は先に main へ」と書いてあったが、**config は exporter ではない**と
 * 読めてしまい 2026-07-14 と同じ事故を繰り返した。
 *
 * 文章で「気をつける」と書くだけでは同じことが起きるので、commit の時点で機械が止める。
 *
 * ## 判定
 *
 * 1. request の `workflow` が **main pinned** か (`.github/workflows/<name>` に `ref: main` があるか)
 * 2. `origin/main...origin/develop` の差分に**生成の入力になりうるパス**が含まれるか
 * 3. 両方成立したら error。`acknowledgedMainLag` で明示的に上書きできる
 *
 * ## 入力パスを広めに取る理由
 *
 * task ごとに「その generator が読むファイル」を厳密に列挙すると、transitive import を
 * 追い切れず**取りこぼす** (取りこぼしは「安全だ」と嘘をつく方向の誤りで最も危険)。
 * そこで**生成に関わりうるソース木**を広く取り、明らかに無関係な木 (docs / state / tests) だけを
 * 除外する。実測では現在の `origin/main...origin/develop` 5 ファイルはすべて除外側に入り、
 * 通常運用では黙っている。
 *
 * I/O を持つのは CLI 部分だけ。判定は純関数。テスト: `__tests__/check-dispatch-freshness.test.cjs`
 * 正典: `.claude/skills/db/sync-snapshots/SKILL.md` / `.claude/rules/branch-workflow.md`
 */

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

/** 生成の入力になりうるソース木 */
const RELEVANT_PREFIXES = [
  'packages/',
  'apps/web/scripts/',
  'apps/remotion/scripts/',
  '.claude/skills/db/sync-snapshots/',
];

/** 生成結果に影響しないもの (ここを広げすぎると検出が死ぬので最小限に) */
const IRRELEVANT_PATTERNS = [
  /(^|\/)__tests__\//,
  /\.test\.[cm]?[jt]sx?$/,
  /(^|\/)README\.md$/,
  /\.md$/,
];

/** 生成の入力になりうるか */
function isRelevantPath(file) {
  const f = String(file ?? '');
  if (!RELEVANT_PREFIXES.some((p) => f.startsWith(p))) return false;
  if (IRRELEVANT_PATTERNS.some((re) => re.test(f))) return false;
  return true;
}

/**
 * request 1 件を判定する。
 *
 * @param {object} params
 * @param {object} params.request  request JSON
 * @param {boolean} params.mainPinned  dispatch 先が main を checkout するか
 * @param {string[]} params.divergedPaths  origin/main...origin/develop の差分パス
 * @returns {{ok: boolean, code?: string, workflow: string, blockingPaths: string[], message?: string}}
 */
function evaluateRequest({ request, mainPinned, divergedPaths }) {
  const workflow = String(request?.workflow ?? '(unknown)');
  const blockingPaths = (divergedPaths ?? []).filter(isRelevantPath);

  if (!mainPinned) {
    return { ok: true, workflow, blockingPaths: [] };
  }
  if (blockingPaths.length === 0) {
    return { ok: true, workflow, blockingPaths: [] };
  }

  // 明示的な上書き。理由を request に残させる (口頭の合意を artifact に固定するため)
  const ack = request?.acknowledgedMainLag;
  if (typeof ack === 'string' && ack.trim().length >= 10) {
    return { ok: true, workflow, blockingPaths, acknowledged: ack.trim() };
  }

  return {
    ok: false,
    code: 'MAIN_LAG',
    workflow,
    blockingPaths,
    message:
      `${workflow} は main を checkout するのに、develop の以下の変更が main に載っていない。` +
      `このまま dispatch すると **main の古いコードで再生成され、失敗にも見えない**。` +
      `先に develop→main をデプロイするか、この task が読まないと確信できるなら ` +
      `request に "acknowledgedMainLag": "<理由>" を書く`,
  };
}

/**
 * request ファイル全体を判定する。request は単体オブジェクトか配列。
 */
function checkDispatchFreshness({ requests, mainPinnedWorkflows, divergedPaths }) {
  const list = Array.isArray(requests) ? requests : [requests];
  const pinned = new Set(mainPinnedWorkflows ?? []);
  const results = list
    .filter((r) => r && typeof r === 'object')
    .map((request) =>
      evaluateRequest({
        request,
        mainPinned: pinned.has(String(request.workflow ?? '')),
        divergedPaths,
      }),
    );
  return { ok: results.every((r) => r.ok), results };
}

/** `.github/workflows/<file>` が main を checkout するか (読むだけ・書かない) */
function isMainPinnedWorkflow(root, workflowFile) {
  const p = path.join(root, '.github/workflows', String(workflowFile ?? ''));
  if (!fs.existsSync(p)) return false;
  return /^\s*ref:\s*main\s*$/m.test(fs.readFileSync(p, 'utf8'));
}

module.exports = {
  RELEVANT_PREFIXES,
  isRelevantPath,
  evaluateRequest,
  checkDispatchFreshness,
  isMainPinnedWorkflow,
};

if (require.main === module) {
  const root = path.resolve(__dirname, '../../..');
  const requestPath = path.join(root, 'data/workflow-dispatch-requests.json');

  if (!fs.existsSync(requestPath)) {
    console.log('✓ dispatch request なし');
    process.exit(0);
  }

  let requests;
  try {
    requests = JSON.parse(fs.readFileSync(requestPath, 'utf8'));
  } catch (err) {
    console.error(`✗ dispatch request の JSON が壊れている: ${err.message}`);
    process.exit(1);
  }

  let divergedPaths = [];
  try {
    divergedPaths = execFileSync(
      'git',
      ['diff', '--name-only', 'origin/main...origin/develop'],
      { cwd: root, encoding: 'utf8' },
    )
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  } catch (err) {
    // origin/main が無い環境 (浅い clone 等) では判定できない。
    // **黙って通さない** — 判定不能と分かるように出す
    console.error(`⚠ origin/main...origin/develop を比較できず判定不能: ${err.message}`);
    console.error('  git fetch origin main develop してから再実行する');
    process.exit(0);
  }

  const list = Array.isArray(requests) ? requests : [requests];
  const mainPinnedWorkflows = list
    .map((r) => String(r?.workflow ?? ''))
    .filter((w) => w && isMainPinnedWorkflow(root, w));

  const { ok, results } = checkDispatchFreshness({
    requests,
    mainPinnedWorkflows,
    divergedPaths,
  });

  if (ok) {
    const acked = results.filter((r) => r.acknowledged);
    for (const r of acked) {
      console.log(`⚠ ${r.workflow}: main 未反映 ${r.blockingPaths.length} 件を明示的に許容 — ${r.acknowledged}`);
    }
    console.log('✓ dispatch request の main 反映順は問題なし');
    process.exit(0);
  }

  for (const r of results.filter((x) => !x.ok)) {
    console.error(`✗ [${r.code}] ${r.message}`);
    for (const p of r.blockingPaths.slice(0, 20)) console.error(`    ${p}`);
    if (r.blockingPaths.length > 20) {
      console.error(`    ... 他 ${r.blockingPaths.length - 20} 件`);
    }
  }
  process.exit(1);
}
