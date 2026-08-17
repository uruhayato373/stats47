'use strict';

/**
 * 今回の run で処理する N 件と、その class / model を決める純関数。
 *
 * ## 設計
 *
 * 状態は**毎 run 真実源から再導出**する (build-ai-content-queue.mjs と同じ思想)。
 * ledger は「過去に何回試したか」だけを供給し、キュー自体は保存しない。中断しても
 * 次の run が同じ入力から同じ結論に達するので、途中再開が安全になる。
 *
 * ## 事前分類 (pre-class) をここでやる理由
 *
 * class の最終決定はモデルの意味判断だが、**明らかに機械で決まるものは機械で決める**。
 * blocked-owner-* を毎回モデルに読ませて「これは人間待ちですね」と言わせるのはトークンの無駄で、
 * しかも「モデルが勝手に owner 判断を進める」余地を残す。ここで needs-owner に固定すれば
 * その余地が構造的に消える。
 *
 * I/O を持たない。テスト: `__tests__/queue-core.test.cjs`
 */

/** 人間の判断待ちを表す status (自動処理の対象外) */
const OWNER_BLOCKED = /^blocked-owner/;
/** 外部要因待ち。owner 判断ではないが自動では動かせない */
const EXTERNAL_BLOCKED = /^(blocked-|pending-(source-release|decision|browser-reproduction))/;

/** 進行中は触らない (人 or 別 run が作業中) */
const IN_PROGRESS = 'in-progress';

const { localRuntimeSignals, localRuntimeReason } = require('./local-runtime-core.cjs');

/**
 * status から機械的に決まる class を返す。決まらなければ null (モデルが分類する)。
 */
function preClassify(entry) {
  const status = String(entry?.fields?.status ?? '').trim();
  if (!status) return null;
  if (OWNER_BLOCKED.test(status)) return 'needs-owner';
  if (EXTERNAL_BLOCKED.test(status)) return 'needs-owner';
  if (status === 'deferred') return null; // deferred は trigger 判定が要る → モデルへ
  return null;
}

/**
 * 処理対象になりうるか。理由つきで返す (除外理由を出力に残すため)。
 */
function eligibility(entry, { ledger, quarantined }) {
  const id = entry.id;
  const status = String(entry?.fields?.status ?? '').trim();

  if (status === IN_PROGRESS) {
    return { eligible: false, reason: 'in-progress (人または別 run が作業中)' };
  }
  const pre = preClassify(entry);
  if (pre === 'needs-owner') {
    return { eligible: false, reason: `owner/外部待ち (${status})`, class: 'needs-owner' };
  }
  // status が pending のままでも、本文がローカル端末依存を名指ししていれば CI では閉じられない。
  // 拾わせると 3 回失敗 → quarantine で日次枠を燃やすだけなので、ここで needs-owner へ回す
  // (ASP-CONTINUITY-01 / PERF-LOCAL-NAV-01 で実際に踏んだ。判定の根拠は local-runtime-core.cjs)。
  const localSignals = localRuntimeSignals(entry.body);
  if (localSignals.length > 0) {
    return {
      eligible: false,
      reason: localRuntimeReason(localSignals),
      class: 'needs-owner',
      localRuntimeSignals: localSignals.map((s) => s.name),
    };
  }
  if (quarantined.has(id)) {
    const q = ledger.items?.[id]?.quarantine;
    return { eligible: false, reason: `quarantine (${q?.failCount} 回連続失敗: ${q?.lastReason ?? '理由未記録'})` };
  }
  if (ledger.items?.[id]?.status === 'completed') {
    return { eligible: false, reason: 'ledger で完了済 (バックログ側の削除漏れの可能性)' };
  }
  return { eligible: true, reason: null };
}

/**
 * 優先度スコア。小さいほど先。
 *
 * tier を第一基準にするのは 00_運用ガイド の P0>P1>P2>P3 に従うため。同 tier 内では
 * **試行回数が少ないものを先**にする (何度も失敗しているものが枠を占有し続けるのを防ぐ)。
 */
function priorityOf(entry, ledger) {
  const tier = Number.parseInt(String(entry?.fields?.tier ?? '9'), 10);
  const attempts = ledger.items?.[entry.id]?.attempts?.length ?? 0;
  return { tier: Number.isFinite(tier) ? tier : 9, attempts };
}

/**
 * class から model / effort / 委譲形態を引く。未知 class は既定へ倒す。
 */
function routeFor(policy, className) {
  const cls = policy?.classes?.[className];
  if (cls) return { class: className, ...cls };
  // 未知の class をモデルが名乗った場合、勝手に fable を使わせない (安い側へ倒す)
  const fallback = policy?.classes?.['impl-small'] ?? { model: 'sonnet', effort: 'high', maxAttempts: 1, delegate: 'inline', apply: 'draft-pr' };
  return { class: className, ...fallback, _fallback: true };
}

/**
 * escalation: 前回のモデルで失敗していたら 1 段上へ。
 * ladder の末尾 (needs-owner) に達したら人間へ回す。
 */
function escalate(policy, className, ledger, id) {
  const route = routeFor(policy, className);
  const item = ledger.items?.[id];
  if (!item || item.attempts.length === 0) return route;

  const ladder = Array.isArray(policy?.escalation) ? policy.escalation : ['sonnet', 'fable', 'needs-owner'];
  const lastFailed = [...item.attempts].reverse().find((a) => a.outcome === 'failed' || a.outcome === 'escalated');
  if (!lastFailed || !lastFailed.model) return route;

  const idx = ladder.indexOf(lastFailed.model);
  if (idx === -1) return route;
  const nextModel = ladder[idx + 1];
  if (!nextModel) return route;
  if (nextModel === 'needs-owner') {
    return { ...route, model: 'none', delegate: 'none', apply: 'surface-only', class: 'needs-owner', escalatedFrom: lastFailed.model };
  }
  // 同 class のまま 1 段上のモデルへ。fable は委譲でしか使えない (run 本体は sonnet)
  return {
    ...route,
    model: nextModel,
    delegate: nextModel === 'fable' ? 'agent:backlog-solver-hard' : route.delegate,
    escalatedFrom: lastFailed.model,
  };
}

/**
 * キューを組む。
 *
 * @param {object} params
 * @param {Array} params.entries parse-backlog-core の見出し型エントリ
 * @param {object} params.ledger normalizeLedger 済み
 * @param {Set<string>} params.quarantined
 * @param {object} params.policy backlog-routing-policy.json
 * @param {number} [params.limit] 省略時 policy.limits.itemsPerRun
 * @returns {{picked: Array, skipped: Array, needsOwner: Array}}
 */
function buildQueue({ entries, ledger, quarantined, policy, limit }) {
  const max = Number.isFinite(limit) ? limit : (policy?.limits?.itemsPerRun ?? 2);
  const hardMax = policy?.limits?.maxItemsPerRun ?? 6;
  const effectiveMax = Math.min(max, hardMax);

  const candidates = [];
  const skipped = [];
  const needsOwner = [];

  for (const entry of entries) {
    const verdict = eligibility(entry, { ledger, quarantined });
    if (!verdict.eligible) {
      const row = { id: entry.id, title: entry.title, reason: verdict.reason, sourceFile: entry.sourceFile };
      if (verdict.localRuntimeSignals) row.localRuntimeSignals = verdict.localRuntimeSignals;
      if (verdict.class === 'needs-owner') needsOwner.push(row);
      else skipped.push(row);
      continue;
    }
    candidates.push(entry);
  }

  candidates.sort((a, b) => {
    const pa = priorityOf(a, ledger);
    const pb = priorityOf(b, ledger);
    if (pa.tier !== pb.tier) return pa.tier - pb.tier;
    if (pa.attempts !== pb.attempts) return pa.attempts - pb.attempts;
    return a.id.localeCompare(b.id);
  });

  const picked = candidates.slice(0, effectiveMax).map((entry) => {
    const known = ledger.items?.[entry.id]?.class ?? null;
    // 既知 class があれば escalation を効かせる。無ければモデルが分類する (route は暫定)
    const route = known
      ? escalate(policy, known, ledger, entry.id)
      : { ...routeFor(policy, 'impl-small'), class: null, _pendingClassification: true };
    return {
      id: entry.id,
      title: entry.title,
      section: entry.section,
      sourceFile: entry.sourceFile,
      startLine: entry.startLine,
      endLine: entry.endLine,
      status: entry.fields.status ?? null,
      tier: entry.fields.tier ?? null,
      knownClass: known,
      attempts: ledger.items?.[entry.id]?.attempts?.length ?? 0,
      route,
      body: entry.body,
    };
  });

  return { picked, skipped, needsOwner };
}

module.exports = {
  preClassify,
  eligibility,
  priorityOf,
  routeFor,
  escalate,
  buildQueue,
};
