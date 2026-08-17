'use strict';

/**
 * 「行削除 ⇔ gate 証拠」の突合。backlog-loop の安全装置の中核。
 *
 * ## 何を守るか
 *
 * モデルが「直しました」と言ってバックログの行を消すだけ、を構造的に不能にする。
 * バックログから消えた ID それぞれについて、ledger に **gate.pass=true の completed attempt**
 * が無ければ run を fail させる。逆に「gate は通ったのに行が残っている」も検出する
 * (完了したのに削除し忘れると、次の run が同じものをまた処理して枠を食う)。
 *
 * ## なぜ diff ではなく「解析結果の差集合」で見るか
 *
 * git diff の行を数えると、書式変更やセクション移動を「削除」と誤認する。パーサで
 * before/after の ID 集合を取れば、**消えた ID** だけが確実に分かる。
 *
 * I/O を持たない。テスト: `__tests__/verify-core.test.cjs`
 */

const { parseHeadingEntries } = require('./parse-backlog-core.cjs');
const { hasPassingGate, declaredFollowUps } = require('./ledger-core.cjs');

/** ループが触ってよいパス。ここに無いものを触ったら commit させない */
const ALLOWED_PATH_PATTERNS = [
  /^docs\/todo\/05_/,
  /^docs\/todo\/06_/,
  /^docs\/todo\/01_/,
  /^\.claude\/state\/backlog-loop\//,
  /^\.claude\/scripts\//,
  /^\.claude\/rules\//,
  /^\.claude\/skills\//,
  /^\.claude\/agents\//,
  /^\.claude\/config\//,
  /^packages\//,
  /^apps\//,
];

/**
 * 絶対に触らせないパス (許可パターンに一致しても弾く)。
 *
 * ★`.github/` と routing policy を禁止に置くのは「ループが自分の権限と予算を広げられない」
 * ようにするため。workflow を書き換えられると allowedTools・許可パス・timeout・モデルを
 * 自分で緩められてしまい、ここでの全ての制約が意味を失う。policy も同じで、model と
 * maxAttempts の SSOT なので自己昇格の口になる。どちらも人間の PR でだけ変える。
 * workflow を直す種類のバックログ (式インジェクション是正など) はこの制約で failed になるが、
 * それが正しい — 配信経路の workflow を無人で書き換えない。
 */
const FORBIDDEN_PATH_PATTERNS = [
  /^docs\/todo\/04_/, // improvement-triage の排他 write
  /^\.claude\/memory\//, // knowledge-curator の排他 write
  /^\.claude\/skills\/learned\//, // 同上
  /^\.github\//, // ループが自分の権限を広げられないようにする
  /^\.claude\/config\/backlog-routing-policy\.json$/, // 自分の model / 試行上限を上げさせない
  /^\.env/,
  /(^|\/)\.env/,
];

/**
 * before/after のバックログ本文から、削除された ID と追加された ID を出す。
 */
function diffEntryIds(beforeText, afterText, sourceFile) {
  const before = new Set(parseHeadingEntries(beforeText, sourceFile).entries.map((e) => e.id));
  const after = new Set(parseHeadingEntries(afterText, sourceFile).entries.map((e) => e.id));
  const removed = [...before].filter((id) => !after.has(id));
  const added = [...after].filter((id) => !before.has(id));
  return { removed, added };
}

/**
 * 削除の裏付けを検査する。
 *
 * @param {object} params
 * @param {Array<{sourceFile:string, before:string, after:string}>} params.files
 * @param {object} params.ledger normalizeLedger 済み
 * @param {string[]} [params.queuedIds] 今回の run で処理対象だった ID (範囲外の削除を検出する)
 * @returns {{ok: boolean, findings: Array}}
 */
function verifyRemovals({ files, ledger, queuedIds = null }) {
  const findings = [];
  const queued = queuedIds ? new Set(queuedIds) : null;
  // 「1 件閉じたら小さい残件が 1 件出る」は正常な流れなので、閉じたエントリが台帳で
  // 名指しした follow-up だけ追加を許す。無条件に許すとモデルが仕事を捏造できるし、
  // 一切許さないと今度は残件を闇に葬るか巨大エントリのまま残すことになる。
  const allowedAdditions = declaredFollowUps(ledger, queuedIds);

  for (const f of files) {
    const { removed, added } = diffEntryIds(f.before, f.after, f.sourceFile);

    for (const id of removed) {
      if (!hasPassingGate(ledger, id)) {
        findings.push({
          kind: 'removal-without-gate',
          id,
          sourceFile: f.sourceFile,
          detail: `${id} を削除したが ledger に gate.pass=true の completed attempt が無い`,
        });
        continue;
      }
      if (queued && !queued.has(id)) {
        findings.push({
          kind: 'removal-out-of-queue',
          id,
          sourceFile: f.sourceFile,
          detail: `${id} は今回の処理対象ではないのに削除された`,
        });
      }
    }

    for (const id of added) {
      if (allowedAdditions.has(id)) continue; // 閉じたエントリが --follow-ups で名指しした残件
      findings.push({
        kind: 'unexpected-addition',
        id,
        sourceFile: f.sourceFile,
        detail: `${id} が追加された (残件として切り出すなら閉じたエントリの --follow-ups で名指しする)`,
      });
    }

    // gate は通ったのに行が残っている = 削除し忘れ (次の run が同じものを再処理してしまう)
    const afterIds = new Set(parseHeadingEntries(f.after, f.sourceFile).entries.map((e) => e.id));
    for (const id of queued ?? []) {
      if (afterIds.has(id) && hasPassingGate(ledger, id)) {
        findings.push({
          kind: 'gate-passed-but-not-removed',
          id,
          sourceFile: f.sourceFile,
          detail: `${id} は gate を通ったのにバックログに残っている (削除し忘れ)`,
        });
      }
    }
  }

  return { ok: findings.length === 0, findings };
}

/**
 * git status --porcelain の行から、触ってよいパスだけかを検査する。
 *
 * @param {string[]} paths 変更されたパス (リポジトリルート相対)
 * @returns {{ok: boolean, violations: Array<{path:string, reason:string}>}}
 */
function verifyChangedPaths(paths) {
  const violations = [];
  for (const p of paths) {
    if (FORBIDDEN_PATH_PATTERNS.some((re) => re.test(p))) {
      violations.push({ path: p, reason: '禁止パス (排他 writer 契約または秘密)' });
      continue;
    }
    if (!ALLOWED_PATH_PATTERNS.some((re) => re.test(p))) {
      violations.push({ path: p, reason: '許可パス外' });
    }
  }
  return { ok: violations.length === 0, violations };
}

module.exports = {
  ALLOWED_PATH_PATTERNS,
  FORBIDDEN_PATH_PATTERNS,
  diffEntryIds,
  verifyRemovals,
  verifyChangedPaths,
};
