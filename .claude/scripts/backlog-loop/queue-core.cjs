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

/**
 * 自動処理の対象外を表す executor (v3-unified タグ語彙。正典 `.claude/rules/todo-standards.md`)。
 * `対話`=方針判断がユーザーと要る / `ユーザー`=手作業・ログイン・実測 /
 * `windows`・`別環境`=CI に無いローカル環境が要る。
 */
const NEEDS_OWNER_EXECUTORS = new Set(['対話', 'ユーザー', 'windows', '別環境']);

/**
 * 自動処理が単独で完了まで持てる executor (todo-standards.md §3)。**この宣言があるカードだけ**を拾う。
 * 未宣言 (分類待ち) まで拾っていた頃、優先順位と無関係なカードが上から無人で処理され、
 * 2026-09-27 にオーナーが日次実行を止めた。宣言は人間が「無人で回してよい」と決めた印。
 */
const AUTO_EXECUTORS = new Set(['sweep', '機械']);

/**
 * `[待ち:X]` のうち人の手が要るもの (needsOwner へ surface する)。それ以外 (時期・観測) は
 * 置き場違い (annual.md / improvements.md) なので除外だけする。語彙の正典は backlog-lib の WAITS。
 */
const OWNER_WAITS = new Set(['承認', '判断', 'ログイン']);

/** tier の実行優先順 (backlog-lib の TIER_ORDER と同義。🟣 hold は eligibility で弾く) */
const TIER_RANK = { high: 0, mid: 1, low: 2, hold: 9 };
const TIER_LABEL = { high: '🔴', mid: '🟡', low: '🟢', hold: '🟣' };

/** 選定の第 1 キー (todo-standards.md §4「不具合が第 1 キー」) */
const DEFECT_KIND = '不具合';
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const { localRuntimeSignals, localRuntimeReason } = require('./local-runtime-core.cjs');

/**
 * タグ宣言から機械的に決まる class を返す。決まらなければ null (モデルが分類する)。
 *
 * 旧形式は status 文字列 (blocked-owner-* 等) をヒューリスティックに読んでいたが、
 * v3-unified では [実行:X] と 🟣 tier が**宣言**なので判定が単純になる。
 * 毎回モデルに「これは人間待ちですね」と言わせない理由は従来どおり
 * (トークンの無駄 + モデルが勝手に owner 判断を進める余地を残さない)。
 */
function preClassify(entry) {
  if (entry?.tier === 'hold') return 'needs-owner'; // 🟣 = 意思決定が未了
  if (entry?.executor && NEEDS_OWNER_EXECUTORS.has(entry.executor)) return 'needs-owner';
  return null;
}

/**
 * 処理対象になりうるか。理由つきで返す (除外理由を出力に残すため)。
 *
 * 対象 = `[実行:sweep|機械]` を宣言し、`[待ち:X]` が無く、`[進行中]` でも 🟣 でもないカード。
 * 判定順は「触ってはいけないもの → 人の待ち → 機械の都合」。
 */
function eligibility(entry, { ledger, quarantined }) {
  const id = entry.id;

  if (entry.wip) {
    return { eligible: false, reason: '[進行中] (人または別 run が作業中)' };
  }
  const pre = preClassify(entry);
  if (pre === 'needs-owner') {
    const why =
      entry.tier === 'hold'
        ? '🟣 判断待ち (意思決定が未了)'
        : `実行:${entry.executor} (自動処理の対象外)`;
    return { eligible: false, reason: why, class: 'needs-owner' };
  }
  const waits = Array.isArray(entry.waits) ? entry.waits : [];
  if (waits.length > 0) {
    const label = waits.map((w) => `待ち:${w}`).join(' ');
    return waits.some((w) => OWNER_WAITS.has(w))
      ? { eligible: false, reason: `[${label}] (人の判断・操作を待っている)`, class: 'needs-owner' }
      : { eligible: false, reason: `[${label}] (時期・観測待ちは annual.md / improvements.md の置き場)` };
  }
  if (!id) {
    // ledger は ID で結び付けるので、ID の無いカードは処理できない (分類待ちとして surface)
    return { eligible: false, reason: 'ID なし (todo-curator が採番するまで処理対象外)' };
  }
  if (!entry.executor || !AUTO_EXECUTORS.has(entry.executor)) {
    // executor 未宣言のカードは、本文がローカル端末依存を名指ししていれば needs-owner へ回して人に見せる
    // (ASP-CONTINUITY-01 / PERF-LOCAL-NAV-01 で実際に踏んだ。判定の根拠は local-runtime-core.cjs)。
    // **[実行:sweep|機械] の明示宣言があれば backstop を通さない** — 宣言は人間の判断で、
    // 本文に「Playwright」等の語が引用されているだけのカードを恒久に弾かない override になる。
    if (!entry.executor) {
      const localSignals = localRuntimeSignals(entry.body);
      if (localSignals.length > 0) {
        return {
          eligible: false,
          reason: localRuntimeReason(localSignals),
          class: 'needs-owner',
          localRuntimeSignals: localSignals.map((s) => s.name),
        };
      }
    }
    const declared = entry.executor ? `実行:${entry.executor}` : '分類待ち';
    return {
      eligible: false,
      reason: `[実行:sweep|機械] の宣言なし (${declared})。無人処理は宣言したカードだけ`,
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
 * 選定キー。並び順の正典は todo-standards.md §4 (不具合が第 1 キー・tier が第 2 キー) に、
 * 今月の重点領域 (monthly.md の focus_domains) を tier の前に挟んだもの (2026-11-14 オーナー承認)。
 *
 * 失敗を繰り返すカードが枠を占有し続ける問題は、並び順ではなく quarantine
 * (連続失敗 `quarantineThreshold` 回で除外) が受け持つ。
 *
 * @param {object} entry
 * @param {Set<string>} focusSet 今月の重点領域 (表示名。カードの [領域:X] と同じ語彙)
 */
function selectionKeys(entry, focusSet) {
  const filed = typeof entry?.filed === 'string' && ISO_DATE.test(entry.filed) ? entry.filed : null;
  return {
    defect: entry?.kind === DEFECT_KIND,
    focus: Boolean(entry?.lane && focusSet.has(entry.lane)),
    lane: entry?.lane ?? null,
    tier: entry?.tier ?? null,
    filed,
  };
}

/**
 * 小さいほど先。第 1 不具合 → 第 2 重点領域 → 第 3 tier → 第 4 起票日の古い順 (無しは最後) → ID 昇順。
 * @param {{id: string, keys: ReturnType<typeof selectionKeys>}} a
 * @param {{id: string, keys: ReturnType<typeof selectionKeys>}} b
 */
function compareSelection(a, b) {
  const ka = a.keys;
  const kb = b.keys;
  if (ka.defect !== kb.defect) return ka.defect ? -1 : 1;
  if (ka.focus !== kb.focus) return ka.focus ? -1 : 1;
  const ta = TIER_RANK[ka.tier ?? ''] ?? 9;
  const tb = TIER_RANK[kb.tier ?? ''] ?? 9;
  if (ta !== tb) return ta - tb;
  if (ka.filed !== kb.filed) {
    if (ka.filed === null) return 1;
    if (kb.filed === null) return -1;
    return ka.filed < kb.filed ? -1 : 1;
  }
  // localeCompare は環境の照合順に依存するので、決定的な符号単位の比較にする
  if (a.id === b.id) return 0;
  return a.id < b.id ? -1 : 1;
}

/**
 * 人が読む 1 行。どのキーで上に来たかを 4 キーぶん並べる (run のログと ledger の evidence に貼る)。
 * @param {ReturnType<typeof selectionKeys>} keys
 * @param {string|null|undefined} kind
 */
function selectionReason(keys, kind) {
  const k1 = keys.defect ? '[1]不具合' : `[1]${kind ?? '種類なし'}`;
  const k2 = keys.focus ? `[2]重点(${keys.lane})` : `[2]重点外(${keys.lane ?? '領域なし'})`;
  const k3 = `[3]${TIER_LABEL[keys.tier ?? ''] ?? '?'}`;
  const k4 = keys.filed ? `[4]起票${keys.filed}` : '[4]起票なし';
  return `${k1} ${k2} ${k3} ${k4}`;
}

/**
 * class から model / effort / 委譲形態を引く。未知 class は既定へ倒す。
 */
function routeFor(policy, className) {
  const cls = policy?.classes?.[className];
  if (cls) return { class: className, ...cls };
  // 未知の class をモデルが名乗った場合、勝手に fable を使わせない (安い側へ倒す)
  const fallback = policy?.classes?.['impl-small'] ?? { model: 'sonnet', effort: 'high', maxAttempts: 1, delegate: 'inline', apply: 'draft-pr' };
  // impl-small 自体は実測で fable へ昇格しうるため、その可変 route をそのまま使わない。
  // 安い側は escalation ladder の先頭で決め、policy 学習が未知 class の予算を広げないようにする。
  const cheapestModel = policy?.escalation?.[0] ?? 'sonnet';
  return {
    class: className,
    ...fallback,
    model: cheapestModel,
    delegate: cheapestModel === 'sonnet' ? 'inline' : fallback.delegate,
    _fallback: true,
  };
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
 * @param {Array} params.entries parse-backlog-core のカード (backlog-lib v3-unified)
 * @param {object} params.ledger normalizeLedger 済み
 * @param {Set<string>} params.quarantined
 * @param {object} params.policy backlog-routing-policy.json
 * @param {number} [params.limit] 省略時 policy.limits.itemsPerRun
 * @param {string[]|null} [params.focusDomains] 今月の重点領域。null・空は「読めなかった」として warnings に出す
 * @returns {{picked: Array, ranked: Array, skipped: Array, needsOwner: Array, warnings: string[], focusDomains: string[]|null}}
 *   ranked は対象になった全カードの並び (picked はその先頭 limit 件)
 */
function buildQueue({ entries, ledger, quarantined, policy, limit, focusDomains = null }) {
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

  const hasFocus = Array.isArray(focusDomains) && focusDomains.length > 0;
  const focusSet = new Set(hasFocus ? focusDomains : []);
  const warnings = [];
  if (!hasFocus) {
    warnings.push(
      '今月の重点領域 (monthly.md の focus_domains) を読めなかったので、全カードを重点外として並べた (第 2 キーが効いていない)',
    );
  }

  const ordered = candidates
    .map((entry) => ({ entry, id: entry.id, keys: selectionKeys(entry, focusSet) }))
    .sort(compareSelection)
    .map(({ entry, keys }) => ({ entry, selection: { keys, reason: selectionReason(keys, entry.kind) } }));

  const ranked = ordered.map(({ entry, selection }) => ({
    id: entry.id,
    title: entry.title,
    kind: entry.kind ?? null,
    tier: entry.tier ?? null,
    lane: entry.lane ?? null,
    filed: selection.keys.filed,
    executor: entry.executor ?? null,
    reason: selection.reason,
  }));

  const picked = ordered.slice(0, effectiveMax).map(({ entry, selection }) => {
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
      tier: entry.tier ?? null,
      kind: entry.kind ?? null,
      lane: entry.lane ?? null,
      executor: entry.executor ?? null,
      verify: entry.verify ?? null,
      knownClass: known,
      attempts: ledger.items?.[entry.id]?.attempts?.length ?? 0,
      route,
      selection,
      body: entry.body,
    };
  });

  return {
    picked,
    ranked,
    skipped,
    needsOwner,
    warnings,
    focusDomains: Array.isArray(focusDomains) ? [...focusDomains] : null,
  };
}

module.exports = {
  AUTO_EXECUTORS,
  OWNER_WAITS,
  preClassify,
  eligibility,
  selectionKeys,
  compareSelection,
  selectionReason,
  routeFor,
  escalate,
  buildQueue,
};
