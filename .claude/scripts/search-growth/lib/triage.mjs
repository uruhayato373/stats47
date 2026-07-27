/**
 * triage — 週次トリアージ (最大3件) と人間承認・WIP guard の決定的実装。
 *
 * 正典: docs/02_実装計画/39 §18.3〜18.4。
 * - 週次レビューへ載せる候補は最大 3 件 (原則 technical/blocker 1・acquisition/content 1・measurement 1)。
 * - 承認 (pending→approved) は人間が CLI で行う。1 週の承認は最大 2 件、
 *   全 active 施策 (approved + in-progress) の WIP は 5 以下を機械強制する。
 * - freshness=missing の候補は insufficient-data として昇格候補に載せない。
 * - analyze の週次再構築で承認状態が消えないよう carryOverStatuses が id で引き継ぐ。
 *
 * この module は純粋 (I/O なし)。書き込みは cli.mjs が state.mjs 経由で行う。
 * MCP には mutation を公開しない (§6.3 — read-only 維持)。
 */

/** candidate type → トリアージ区分。§18.4 の 3 区分。 */
export const CANDIDATE_CATEGORY = Object.freeze({
  "server-risk": "technical",
  "soft-404-risk": "technical",
  "indexability-conflict": "technical",
  "crawled-not-indexed": "technical",
  "canonical-drift": "technical",
  "cwv-opportunity": "technical",
  "lab-regression": "technical",
  "ctr-opportunity": "content",
  "striking-distance": "content",
  "query-gap": "content",
  "intent-mismatch": "content",
  "mobile-gap": "content",
  "measurement-gap": "measurement",
});

export const TRIAGE_MAX = 3;
export const WEEKLY_APPROVAL_MAX = 2;
export const WIP_LIMIT = 5;
/** WIP として数える status (全 active 施策)。 */
export const WIP_STATUSES = Object.freeze(["approved", "in-progress"]);

const CATEGORY_ORDER = ["technical", "content", "measurement"];

/** ISO 週 (承認週の記録用)。 */
export function isoWeekOfDate(iso) {
  const d = new Date(Date.parse(iso));
  const u = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const dow = u.getUTCDay() || 7;
  u.setUTCDate(u.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(u.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((u - yearStart) / 86400000 + 1) / 7);
  return `${u.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
}

/** 全 active 施策 (approved + in-progress) の数。 */
export function wipCount(candidates) {
  return candidates.filter((c) => WIP_STATUSES.includes(c.status)).length;
}

/** 指定週に承認済みの数。 */
export function approvedInWeek(candidates, weekId) {
  return candidates.filter((c) => c.status !== "pending" && c.approvedWeek === weekId).length;
}

/**
 * 週次レビュー用の最大 3 件を選ぶ (決定的)。
 * - pending のみ。freshness=missing は insufficient-data として除外する。
 * - 区分ごとに score 降順 → id 昇順で 1 件 (区分を跨いだ穴埋めはしない — 原則 各 1 件)。
 * @param {object[]} candidates
 * @returns {{shortlist:object[], excluded:{insufficient:number}, wip:number, wipLimit:number,
 *            wipBlocked:boolean, byCategoryPending:Record<string,number>}}
 */
export function selectTriage(candidates) {
  const pending = candidates.filter((c) => c.status === "pending");
  const eligible = pending.filter((c) => c.freshness !== "missing");
  const byCategoryPending = {};
  const best = {};
  for (const c of eligible) {
    const cat = CANDIDATE_CATEGORY[c.type] ?? "content";
    byCategoryPending[cat] = (byCategoryPending[cat] ?? 0) + 1;
    const cur = best[cat];
    if (!cur || c.score > cur.score || (c.score === cur.score && c.id < cur.id)) {
      best[cat] = c;
    }
  }
  const shortlist = CATEGORY_ORDER.filter((cat) => best[cat]).map((cat) => ({
    category: cat,
    ...best[cat],
  })).slice(0, TRIAGE_MAX);
  const wip = wipCount(candidates);
  return {
    shortlist,
    excluded: { insufficient: pending.length - eligible.length },
    wip,
    wipLimit: WIP_LIMIT,
    wipBlocked: wip >= WIP_LIMIT,
    byCategoryPending,
  };
}

/**
 * 人間承認 (pending→approved) を適用する。guard を満たさなければ throw。
 * @param {object[]} candidates candidates.json の candidates 配列
 * @param {string} candidateId
 * @param {{now?:string}} [opts]
 * @returns {{candidates:object[], approved:object}} 新しい配列 (immutable) と承認された candidate
 */
export function applyApproval(candidates, candidateId, { now = new Date().toISOString() } = {}) {
  const idx = candidates.findIndex((c) => c.id === candidateId);
  if (idx < 0) throw new Error(`candidate not found: ${candidateId}`);
  const c = candidates[idx];
  if (c.status !== "pending") {
    throw new Error(`candidate is not pending (status=${c.status}): ${candidateId}`);
  }
  if (c.freshness === "missing") {
    throw new Error(`insufficient-data (freshness=missing) — 証拠不足の候補は昇格しない: ${candidateId}`);
  }
  const wip = wipCount(candidates);
  if (wip >= WIP_LIMIT) {
    throw new Error(`WIP limit: 全 active 施策が ${wip} 件 (上限 ${WIP_LIMIT})。既存施策を measured/dismissed にしてから承認する`);
  }
  const weekId = isoWeekOfDate(now);
  const thisWeek = approvedInWeek(candidates, weekId);
  if (thisWeek >= WEEKLY_APPROVAL_MAX) {
    throw new Error(`weekly approval limit: 今週 (${weekId}) の承認は既に ${thisWeek} 件 (上限 ${WEEKLY_APPROVAL_MAX}/週)`);
  }
  const approved = { ...c, status: "approved", approvedAt: now, approvedWeek: weekId };
  const next = candidates.slice();
  next[idx] = approved;
  return { candidates: next, approved };
}

/**
 * 却下 (pending→dismissed) を適用する。
 */
export function applyDismiss(candidates, candidateId, { reason = null, now = new Date().toISOString() } = {}) {
  const idx = candidates.findIndex((c) => c.id === candidateId);
  if (idx < 0) throw new Error(`candidate not found: ${candidateId}`);
  const c = candidates[idx];
  if (c.status !== "pending") {
    throw new Error(`candidate is not pending (status=${c.status}): ${candidateId}`);
  }
  const dismissed = { ...c, status: "dismissed", dismissedAt: now, dismissReason: reason };
  const next = candidates.slice();
  next[idx] = dismissed;
  return { candidates: next, dismissed };
}

/**
 * analyze の週次再構築で lifecycle status が消えないよう、旧 candidates から引き継ぐ。
 * - id 一致: 旧 status が pending 以外なら status/approvedAt/approvedWeek/dismissedAt/dismissReason を引き継ぐ
 * - 旧 approved/in-progress が新リストに再検出されない場合: WIP 追跡が消えないよう
 *   carriedForward=true を付けて残す (dismissed/measured の非再検出は落とす)
 * @param {object[]} newCandidates 再構築された candidates (全て pending)
 * @param {object[]} prevCandidates 旧 candidates.json の candidates
 */
export function carryOverStatuses(newCandidates, prevCandidates = []) {
  const prevById = new Map(prevCandidates.map((c) => [c.id, c]));
  const out = newCandidates.map((c) => {
    const prev = prevById.get(c.id);
    if (!prev || prev.status === "pending" || !prev.status) return c;
    return {
      ...c,
      status: prev.status,
      ...(prev.approvedAt ? { approvedAt: prev.approvedAt } : {}),
      ...(prev.approvedWeek ? { approvedWeek: prev.approvedWeek } : {}),
      ...(prev.dismissedAt ? { dismissedAt: prev.dismissedAt } : {}),
      ...(prev.dismissReason ? { dismissReason: prev.dismissReason } : {}),
    };
  });
  const newIds = new Set(newCandidates.map((c) => c.id));
  for (const prev of prevCandidates) {
    if (newIds.has(prev.id)) continue;
    if (!WIP_STATUSES.includes(prev.status)) continue;
    out.push({
      ...prev,
      carriedForward: true,
      limitations: [
        ...(prev.limitations ?? []),
        "今週の観測では再検出されず (evidence 更新なし) — WIP 追跡のため carry forward",
      ],
    });
  }
  return out;
}
