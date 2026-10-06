'use strict';

/**
 * commit-back する workflow が「確実にループし続ける」ための契約を機械検査する純粋関数。
 *
 * 2026-08-16 に 2 つの停止事故を同時に踏んだのが発端:
 *
 *   1. `ogp-image-audit-weekly` が pull せずに push していたため、develop が 1 コミットでも
 *      進んでいると `! [rejected] (fetch first)` で毎回落ちた (2 週連続で inventory が commit されず)。
 *      同じ穴が **11 workflow** にあった。
 *   2. `blog-remediation-daily` が 3 つのラチェットを commit step より前に置き、全 queue を
 *      一括 add していたため、**provenance ラチェット 1 つが赤いだけで是正キューと outbox prune まで
 *      17 日間 commit されなかった** (日次ループが実質停止し、ブログ是正が 2 週連続 0 本になった)。
 *
 * どちらも「検査が正しく赤を出しているのに、その副作用で無関係な成果物が失われる」形。
 * ラチェットを commit の前に置く設計自体は正しい (欠陥が増えた queue を commit すると
 * それが次回の基準になり、ラチェットが自分で自分を無効化する) ので、**検査を弱める方向では直さない**。
 *
 * すべて文字列/オブジェクト入力の純粋関数にしてあるので、テストは合成検体で発火を実測できる。
 */

/** `git push` を含む run ブロックから、直前に pull が無いものを拾う。 */
function findPushWithoutPull(runScript) {
  if (typeof runScript !== 'string' || !runScript.includes('git push')) {
    return [];
  }
  const lines = runScript.split('\n');
  const violations = [];
  let sawPull = false;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const stripped = line.replace(/^\s*#.*$/, '');
    if (/\bgit\s+(pull|fetch)\b/.test(stripped)) sawPull = true;
    // `git push origin <ref>` のみを対象にする。`--dry-run` は実際には書き込まない。
    const push = stripped.match(/\bgit\s+push\s+origin\s+(\S+)/);
    if (push && !/--dry-run/.test(stripped) && !sawPull) {
      violations.push({ line: i + 1, ref: push[1], text: line.trim() });
    }
  }
  return violations;
}

/**
 * workflow が `git push origin main` していないかを見る。
 *
 * 2026-08-16 是正: SNS 系 cron 4 本 (migration-flow ×3 + post-instagram-scheduled) が
 * `ref: main` を checkout して投稿台帳を main へ直接 push しており、post-instagram は
 * 1 日 3 回走るため**投稿のたびに main/develop が分岐**していた。手動同期が要る運用は続かない。
 *
 * branch-workflow.md の規約は「main に入るものは必ず develop を先に通す」で、main へ乗る
 * 唯一の経路は develop→main の PR。cron の commit-back は develop 宛にする。
 */
function findPushToMain(runScript) {
  if (typeof runScript !== "string" || !runScript.includes("git push")) {
    return [];
  }
  const violations = [];
  runScript.split("\n").forEach((line, index) => {
    const stripped = line.replace(/^\s*#.*$/, "");
    const push = stripped.match(/\bgit\s+push\s+origin\s+(\S+)/);
    if (!push || /--dry-run/.test(stripped)) return;
    if (push[1] === "main") {
      violations.push({ line: index + 1, ref: push[1], text: line.trim() });
    }
  });
  return violations;
}

/** workflow 全体 (parse 済み) を走査して push-without-pull を集める。 */
function auditWorkflowPushes(workflow) {
  const out = [];
  const jobs = (workflow && workflow.jobs) || {};
  for (const [jobName, job] of Object.entries(jobs)) {
    for (const step of (job && job.steps) || []) {
      if (!step || typeof step.run !== 'string') continue;
      for (const v of findPushWithoutPull(step.run)) {
        out.push({ job: jobName, step: step.name || '(unnamed)', ...v });
      }
    }
  }
  return out;
}

/**
 * ラチェットを持つ workflow の契約:
 *   (a) ラチェット step は id を持ち continue-on-error: true — でないと後段の commit が走らない
 *   (b) commit step は if: always() — ラチェットが赤でも成果物を反映する
 *   (c) 全ラチェットの outcome を見て job を赤くする verdict step がある
 *       — これが無いと (a) は「commit を通すために検査を無効化した」だけになる
 */
function auditRatchetCommitContract(workflow) {
  const problems = [];
  const jobs = (workflow && workflow.jobs) || {};

  for (const [jobName, job] of Object.entries(jobs)) {
    const steps = (job && job.steps) || [];
    const ratchets = steps.filter(
      (s) => s && typeof s.id === 'string' && /ratchet/i.test(s.id)
    );
    if (ratchets.length === 0) continue;

    for (const r of ratchets) {
      if (r['continue-on-error'] !== true) {
        problems.push({
          job: jobName,
          kind: 'ratchet-blocks-commit',
          detail: `${r.id}: continue-on-error が無いので後続の commit step が走らない`,
        });
      }
    }

    const commitSteps = steps.filter(
      (s) => s && typeof s.run === 'string' && /\bgit\s+commit\b/.test(s.run)
    );
    for (const c of commitSteps) {
      if (String(c.if || '').trim() !== 'always()') {
        problems.push({
          job: jobName,
          kind: 'commit-not-always',
          detail: `${c.name || '(unnamed)'}: if: always() が無いのでラチェット失敗時に成果物が失われる`,
        });
      }
    }

    // verdict: 全ラチェットの outcome を参照して exit する step
    const verdict = steps.find(
      (s) =>
        s &&
        typeof s.run === 'string' &&
        /exit\s+1/.test(s.run) &&
        ratchets.every((r) =>
          JSON.stringify(s.env || {}).includes(`steps.${r.id}.outcome`)
        )
    );
    if (!verdict) {
      problems.push({
        job: jobName,
        kind: 'missing-verdict',
        detail:
          '全ラチェットの outcome を見て job を赤くする step が無い (検査を無効化しただけになる)',
      });
    }
  }
  return problems;
}

/** workflow 全体を走査して main への直接 push を集める。 */
function auditWorkflowMainPushes(workflow) {
  const out = [];
  const jobs = (workflow && workflow.jobs) || {};
  for (const [jobName, job] of Object.entries(jobs)) {
    for (const step of (job && job.steps) || []) {
      if (!step || typeof step.run !== "string") continue;
      for (const v of findPushToMain(step.run)) {
        out.push({ job: jobName, step: step.name || "(unnamed)", ...v });
      }
    }
  }
  return out;
}

/**
 * PR の存在判定に `gh pr view <branch>` を使っている箇所を検出する。
 *
 * `gh pr view` は CLOSED / MERGED の PR も拾って exit 0 を返すため、
 * 「既存 PR が無ければ作る」の分岐に使うと、一度 PR を閉じた時点で恒久的に
 * 「既存あり」と誤判定し、PR が二度と作られなくなる。workflow は success の
 * ままなので気づけない (silent green)。
 *
 * 実在した退行: sync-snapshots が CLOSED な #544 を拾い続け、
 * chore/ranking-keys-sync が force-push されるだけで本番へ一度も届かなかった
 * (2026-08-18 検知)。正しい形は
 * `gh pr list --head "$B" --state open --json number --jq 'length'`。
 *
 * 読み取り目的の `gh pr view` (変数への代入など) は対象外で、
 * 条件分岐に使っている行だけを違反とする。
 */
function findStalePrExistenceGuard(runScript) {
  if (typeof runScript !== "string" || !runScript.includes("gh pr view")) {
    return [];
  }
  const violations = [];
  runScript.split("\n").forEach((line, index) => {
    if (/^\s*#/.test(line)) return;
    if (!/\bgh\s+pr\s+view\b/.test(line)) return;
    const conditional =
      /(^|\s)(if|elif)\s/.test(line) ||
      /!\s*gh\s+pr\s+view/.test(line) ||
      /&&|\|\|/.test(line);
    if (!conditional) return;
    violations.push({ line: index + 1, text: line.trim() });
  });
  return violations;
}

function auditWorkflowPrGuards(workflow) {
  const out = [];
  const jobs = (workflow && workflow.jobs) || {};
  for (const [jobName, job] of Object.entries(jobs)) {
    for (const step of (job && job.steps) || []) {
      if (!step || typeof step.run !== "string") continue;
      for (const v of findStalePrExistenceGuard(step.run)) {
        out.push({ job: jobName, step: step.name || "(unnamed)", ...v });
      }
    }
  }
  return out;
}

/**
 * develop へ切り替えた後に、一時ディレクトリへ退避したファイルをリポジトリへコピーする形を検出する。
 *
 * 2026-10-04 実害 (e45f5a0ee): fetch-metrics-weekly が main を checkout して計測し、`.claude/state/metrics/`
 * 全体を /tmp へ退避 → develop へ切り替えて丸ごと上書きコピーしていた。main に未マージの他 workflow の
 * state (page-quality 週次監査・KSJ 月次記録・psi/cloudflare 日次など 15 ファイル) が main の古い版へ戻った。
 * 同じ形の psi-audit-daily / cloudflare-usage-daily は、main が遅れている間は前日までの history 行を毎日失い、
 * psi の history は 4 月以降 55 日分が欠けていた。どの run も success で、コピーは何も警告しない。
 *
 * 退避元の作業ツリーは develop ではないので、このコピーは「別 ref の版で develop を上書きする」ことになる。
 * develop を checkout してその上で生成するか、develop へ切り替えてから生成し直す。
 * 作業ツリーを持ったまま `git checkout develop` する形 (sns-metrics-weekly) は、衝突すると git が止めるので対象外。
 *
 * 入力は 1 job の run script を step 順に並べた配列。切り替えと復元が別 step に分かれていても拾う。
 */
const SWITCH_TO_DEVELOP = /\bgit\s+(?:checkout|switch)\s+(?:-[bBcC]\s+)?develop\b(?!\s+--)/;
const TEMP_PATH = /^["']?(?:\/tmp\/|\$\{?RUNNER_TEMP\b|\$\{\{\s*runner\.temp\s*\}\})/;

/** `cp` / `rsync` / `mv` の最初の非オプション引数 (= コピー元) を返す。 */
function copySource(line) {
  const m = line.match(/(?:^|[;&|]\s*|\s)(?:cp|rsync|mv)\s+(.*)$/);
  if (!m) return null;
  return m[1].split(/\s+/).find((token) => token && !token.startsWith('-')) ?? null;
}

function findForeignTreeRestore(runScripts) {
  const violations = [];
  let switched = false;
  (runScripts || []).forEach((script, stepIndex) => {
    if (typeof script !== 'string') return;
    script.split('\n').forEach((line, index) => {
      if (/^\s*#/.test(line)) return;
      if (SWITCH_TO_DEVELOP.test(line)) {
        switched = true;
        return;
      }
      const source = switched ? copySource(line.trim()) : null;
      if (source && TEMP_PATH.test(source)) {
        violations.push({ stepIndex, line: index + 1, text: line.trim() });
      }
    });
  });
  return violations;
}

/** workflow 全体を走査して、develop へ切り替えた後の一時ディレクトリからの復元を集める。 */
function auditWorkflowForeignTreeRestores(workflow) {
  const out = [];
  const jobs = (workflow && workflow.jobs) || {};
  for (const [jobName, job] of Object.entries(jobs)) {
    const steps = ((job && job.steps) || []).filter((s) => s && typeof s.run === 'string');
    for (const v of findForeignTreeRestore(steps.map((s) => s.run))) {
      out.push({ job: jobName, step: steps[v.stepIndex].name || '(unnamed)', line: v.line, text: v.text });
    }
  }
  return out;
}

module.exports = {
  findPushWithoutPull,
  findPushToMain,
  auditWorkflowPushes,
  auditWorkflowMainPushes,
  auditRatchetCommitContract,
  findStalePrExistenceGuard,
  auditWorkflowPrGuards,
  findForeignTreeRestore,
  auditWorkflowForeignTreeRestores,
};
