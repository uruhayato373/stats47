'use strict';

/**
 * backlog-loop の台帳 (ledger) を upsert する純関数。
 *
 * ## なぜ ledger が要るか
 *
 * 完了したエントリは docs/todo から**行ごと削除**する (docs-vs-issues.md の TODO 作成契約)。
 * つまりバックログ自身は「何を・どのモデルで・何回目で・どんな証拠で閉じたか」を残せない。
 * ledger はその証拠を残す側で、次の 2 つの役割を持つ:
 *
 * 1. **完了の裏付け** — verify が「行削除 diff ⇔ gate.pass=true」を突合する相手。
 *    ledger に gate 証拠が無い削除は hard fail になり、宣言だけの完了が構造的に不能になる
 * 2. **学習の原資** — class×model の成功率・コスト実測。routing policy はここからしか動かない
 *
 * ## 状態遷移の非対称ルール (build-remediation-queue.mjs と同じ思想)
 *
 * - `completed` は巻き戻さない。ただしバックログに同じ ID が再出現したら reopened として
 *   新しい attempt を積む (同じ問題が再発したという事実自体が学習の材料)
 * - `needs-owner` は自動で解除しない (人間の判断待ちを機械が勝手に進めない)
 * - quarantine は連続失敗でのみ増え、**1 度でも成功したら消える**
 *
 * I/O を持たない。テスト: `__tests__/ledger-core.test.cjs`
 */

const LEDGER_VERSION = 1;

/** 1 attempt が取りうる結果 */
const OUTCOMES = new Set(['completed', 'failed', 'escalated', 'deferred', 'skipped']);

/** 台帳の item が取りうる状態 */
const STATUSES = new Set(['open', 'completed', 'quarantined', 'needs-owner']);

function emptyLedger() {
  return { version: LEDGER_VERSION, updatedAt: null, items: {} };
}

/**
 * ledger を正規化する (欠損・旧 version を安全側へ倒す)。
 * 壊れた JSON を読んだときに例外で止めるのではなく空台帳から作り直す —
 * 台帳が読めないことを理由にループ全体を止めない。ただし呼び出し側が警告を出せるよう
 * `recovered` を返す。
 */
function normalizeLedger(raw) {
  if (!raw || typeof raw !== 'object' || typeof raw.items !== 'object' || raw.items === null) {
    return { ledger: emptyLedger(), recovered: true };
  }
  const items = {};
  for (const [id, item] of Object.entries(raw.items)) {
    if (!item || typeof item !== 'object') continue;
    items[id] = {
      class: typeof item.class === 'string' ? item.class : null,
      status: STATUSES.has(item.status) ? item.status : 'open',
      sourceFile: typeof item.sourceFile === 'string' ? item.sourceFile : null,
      title: typeof item.title === 'string' ? item.title : null,
      attempts: Array.isArray(item.attempts) ? item.attempts : [],
      quarantine:
        item.quarantine && typeof item.quarantine === 'object'
          ? item.quarantine
          : { failCount: 0, lastReason: null, since: null },
      reclassifiedFrom: Array.isArray(item.reclassifiedFrom) ? item.reclassifiedFrom : [],
      completedAt: typeof item.completedAt === 'string' ? item.completedAt : null,
    };
  }
  return { ledger: { version: LEDGER_VERSION, updatedAt: raw.updatedAt ?? null, items }, recovered: false };
}

/**
 * 1 件分の結果を台帳へ反映する。
 *
 * @param {object} ledger normalizeLedger 済み
 * @param {object} attempt
 * @param {string} attempt.id バックログ ID
 * @param {string} attempt.class 今回の分類
 * @param {string} attempt.outcome OUTCOMES のいずれか
 * @param {string} attempt.at ISO timestamp (呼び出し側が渡す — 純関数に時計を持たせない)
 * @param {string} [attempt.model]
 * @param {string} [attempt.runId]
 * @param {number} [attempt.turns]
 * @param {number} [attempt.costUsd]
 * @param {{commands: string[], pass: boolean}} [attempt.gate]
 * @param {string} [attempt.evidence] ≤280 字の要約
 * @param {string} [attempt.failReason]
 * @param {number} quarantineThreshold policy の limits.quarantineThreshold
 * @returns {{ledger: object, item: object, quarantined: boolean}}
 */
function recordAttempt(ledger, attempt, quarantineThreshold) {
  if (!attempt || typeof attempt.id !== 'string' || attempt.id === '') {
    throw new Error('recordAttempt: id が要る');
  }
  if (!OUTCOMES.has(attempt.outcome)) {
    throw new Error(`recordAttempt: 未知の outcome: ${attempt.outcome}`);
  }
  if (typeof attempt.at !== 'string' || attempt.at === '') {
    throw new Error('recordAttempt: at (ISO timestamp) が要る');
  }

  const next = { ...ledger, items: { ...ledger.items } };
  const prev = next.items[attempt.id] ?? {
    class: null,
    status: 'open',
    sourceFile: null,
    title: null,
    attempts: [],
    quarantine: { failCount: 0, lastReason: null, since: null },
    reclassifiedFrom: [],
    completedAt: null,
  };

  // 分類が変わったら履歴に残す (誤分類の学習材料。上書きして消さない)
  const reclassifiedFrom = [...prev.reclassifiedFrom];
  if (prev.class && attempt.class && prev.class !== attempt.class) {
    reclassifiedFrom.push({ from: prev.class, to: attempt.class, at: attempt.at });
  }

  const record = {
    at: attempt.at,
    runId: attempt.runId ?? null,
    model: attempt.model ?? null,
    effort: attempt.effort ?? null,
    outcome: attempt.outcome,
    turns: Number.isFinite(attempt.turns) ? attempt.turns : null,
    costUsd: Number.isFinite(attempt.costUsd) ? attempt.costUsd : null,
    gate: attempt.gate ?? null,
    evidence: typeof attempt.evidence === 'string' ? attempt.evidence.slice(0, 280) : null,
    failReason: attempt.failReason ?? null,
  };

  // quarantine: 連続失敗でのみ増え、成功で消える
  let quarantine = { ...prev.quarantine };
  if (attempt.outcome === 'completed') {
    quarantine = { failCount: 0, lastReason: null, since: null };
  } else if (attempt.outcome === 'failed' || attempt.outcome === 'deferred') {
    const failCount = (quarantine.failCount ?? 0) + 1;
    quarantine = {
      failCount,
      lastReason: attempt.failReason ?? null,
      since: quarantine.since ?? attempt.at,
    };
  }

  const threshold = Number.isFinite(quarantineThreshold) ? quarantineThreshold : 3;
  const quarantined = quarantine.failCount >= threshold;

  let status = prev.status;
  if (attempt.outcome === 'completed') status = 'completed';
  else if (attempt.outcome === 'escalated') status = 'open';
  else if (quarantined) status = 'quarantined';
  else if (prev.status === 'completed') status = 'open'; // 再発 (reopened)
  else status = prev.status === 'needs-owner' ? 'needs-owner' : 'open';

  next.items[attempt.id] = {
    ...prev,
    class: attempt.class ?? prev.class,
    sourceFile: attempt.sourceFile ?? prev.sourceFile,
    title: attempt.title ?? prev.title,
    status,
    attempts: [...prev.attempts, record],
    quarantine,
    reclassifiedFrom,
    completedAt: attempt.outcome === 'completed' ? attempt.at : prev.completedAt,
  };
  next.updatedAt = attempt.at;

  return { ledger: next, item: next.items[attempt.id], quarantined };
}

/** quarantine 中で queue から外すべき ID の集合 */
function quarantinedIds(ledger, quarantineThreshold) {
  const threshold = Number.isFinite(quarantineThreshold) ? quarantineThreshold : 3;
  const out = new Set();
  for (const [id, item] of Object.entries(ledger.items ?? {})) {
    if ((item.quarantine?.failCount ?? 0) >= threshold) out.add(id);
  }
  return out;
}

/**
 * 「この ID の削除は許してよいか」— verify の中核。
 * gate.pass=true の completed attempt が 1 つでもあることを要求する。
 */
function hasPassingGate(ledger, id) {
  const item = ledger.items?.[id];
  if (!item) return false;
  return item.attempts.some((a) => a.outcome === 'completed' && a.gate && a.gate.pass === true);
}

/** class×model の実測を集計する (学習の入力) */
function summarizeByClassModel(ledger, { since = null } = {}) {
  const acc = new Map();
  for (const item of Object.values(ledger.items ?? {})) {
    for (const a of item.attempts) {
      if (since && a.at < since) continue;
      if (!a.model || a.model === 'none') continue;
      const key = `${item.class ?? 'unknown'}::${a.model}`;
      const cur = acc.get(key) ?? { class: item.class ?? 'unknown', model: a.model, total: 0, completed: 0, costUsd: 0, turns: 0 };
      cur.total += 1;
      if (a.outcome === 'completed') cur.completed += 1;
      if (Number.isFinite(a.costUsd)) cur.costUsd += a.costUsd;
      if (Number.isFinite(a.turns)) cur.turns += a.turns;
      acc.set(key, cur);
    }
  }
  return [...acc.values()].map((v) => ({
    ...v,
    successRate: v.total > 0 ? v.completed / v.total : null,
  }));
}

module.exports = {
  LEDGER_VERSION,
  OUTCOMES,
  STATUSES,
  emptyLedger,
  normalizeLedger,
  recordAttempt,
  quarantinedIds,
  hasPassingGate,
  summarizeByClassModel,
};
