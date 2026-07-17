/**
 * buzz-map-attribution-core.mjs — SNS → landing → 回遊 の GA4 集計と score 還流入力の純粋コア。
 *
 * 正典: docs/02_実装計画/27_buzz-map集客ゲート統合仕様.md §7.3 (計測) / §7.4 (KPI) / §11 Phase 5。
 *
 * ここには「GA4 rows → per-ideaId 集計」「集計 → score 還流入力」の純粋関数だけ置く。
 * 実 GA4 fetch は buzz-map-attribution.mjs (network)。テストは本モジュールを直接叩く。
 */

/** utm_campaign (buzz-map-<ideaId>) から ideaId を復元。buzz-map- 以外は null。 */
export function ideaIdFromCampaign(campaign) {
  if (typeof campaign !== "string") return null;
  const m = campaign.match(/^buzz-map-(.+)$/);
  return m ? m[1] : null;
}

/**
 * GA4 の session 集計 rows を ideaId 別に畳み込む (§7.3)。
 * rows は { campaign, source, sessions, engagedSessions, pageViews } の配列 (fetch 側で正規化済)。
 * buzz-map-* campaign のみ対象。source (x/instagram) 別も保持する。
 * @param {Array<{campaign:string, source?:string, sessions:number, engagedSessions:number, pageViews:number}>} rows
 * @returns {Record<string, { sessions:number, engagedSessions:number, pageViews:number, bySource:Record<string,{sessions:number}> }>}
 */
export function aggregateSessionsByIdea(rows) {
  const out = {};
  for (const r of rows ?? []) {
    const ideaId = ideaIdFromCampaign(r.campaign);
    if (!ideaId) continue;
    if (!out[ideaId]) out[ideaId] = { sessions: 0, engagedSessions: 0, pageViews: 0, bySource: {} };
    const e = out[ideaId];
    e.sessions += num(r.sessions);
    e.engagedSessions += num(r.engagedSessions);
    e.pageViews += num(r.pageViews);
    const src = r.source || "unknown";
    if (!e.bySource[src]) e.bySource[src] = { sessions: 0 };
    e.bySource[src].sessions += num(r.sessions);
  }
  return out;
}

/**
 * cta_click イベント rows を ideaId 別に畳み込む (§7.3 cta_click content_id=<ideaId>)。
 * rows は { contentId, targetType, eventCount } の配列。
 * @param {Array<{contentId:string, targetType?:string, eventCount:number}>} rows
 * @returns {Record<string, { ctaClicks:number, byTarget:Record<string,number> }>}
 */
export function aggregateCtaByIdea(rows) {
  const out = {};
  for (const r of rows ?? []) {
    const ideaId = typeof r.contentId === "string" ? r.contentId : null;
    if (!ideaId) continue;
    if (!out[ideaId]) out[ideaId] = { ctaClicks: 0, byTarget: {} };
    out[ideaId].ctaClicks += num(r.eventCount);
    const t = r.targetType || "unknown";
    out[ideaId].byTarget[t] = (out[ideaId].byTarget[t] ?? 0) + num(r.eventCount);
  }
  return out;
}

/**
 * §7.4 KPI を ideaId 別に計算する。SNS imp は posts.json のメトリクスから渡す (impByIdea)。
 * attribution=direct の投稿だけ SNS CTR の分母に使える (§7.1)。
 * @param {object} p
 * @param {Record<string, object>} p.sessionsByIdea aggregateSessionsByIdea の出力
 * @param {Record<string, object>} p.ctaByIdea aggregateCtaByIdea の出力
 * @param {Record<string, { impressions:number, attribution:string }>} [p.impByIdea] posts メトリクス
 * @returns {Record<string, { landingSessions:number, landingEngagementRate:number|null,
 *   deepClickRate:number|null, snsCtr:number|null }>}
 */
export function computeKpis({ sessionsByIdea, ctaByIdea, impByIdea = {} }) {
  const out = {};
  const ideas = new Set([...Object.keys(sessionsByIdea ?? {}), ...Object.keys(ctaByIdea ?? {})]);
  for (const ideaId of ideas) {
    const s = sessionsByIdea?.[ideaId];
    const c = ctaByIdea?.[ideaId];
    const imp = impByIdea?.[ideaId];
    const landingSessions = s?.sessions ?? 0;
    const engaged = s?.engagedSessions ?? 0;
    const cta = c?.ctaClicks ?? 0;
    out[ideaId] = {
      landingSessions,
      landingEngagementRate: landingSessions > 0 ? round(engaged / landingSessions) : null,
      deepClickRate: landingSessions > 0 ? round(cta / landingSessions) : null,
      // SNS CTR は attribution=direct の投稿だけ (§7.1)。それ以外は null (過大評価しない)
      snsCtr:
        imp && imp.attribution === "direct" && num(imp.impressions) > 0
          ? round(landingSessions / imp.impressions)
          : null,
    };
  }
  return out;
}

/**
 * §11 Phase 5: 投稿結果を catalog score へ還流する「入力」を作る (§4.4 の gscDemand 補強に相当)。
 * ここでは score を直接書き換えず、build-buzz-map-catalog が読む outcome feedback を返すだけ
 * (実際の score 調整は builder / improvement-triage が判断)。過大評価を避け、実測ベースに保つ。
 * @param {Record<string, object>} kpisByIdea computeKpis の出力
 * @returns {Record<string, { landingSessions:number, deepClickRate:number|null,
 *   outcomeScore:number, note:string }>}
 */
export function buildScoreFeedback(kpisByIdea) {
  const out = {};
  for (const [ideaId, k] of Object.entries(kpisByIdea ?? {})) {
    // outcomeScore: landing session の log スケール + deep click 率で 0-15 (score の gscDemand 相当枠)。
    // 実測が無い (session 0) 候補は 0 (推測で加点しない)。
    const sessionScore = k.landingSessions > 0 ? Math.min(10, Math.log2(k.landingSessions + 1) * 2) : 0;
    const deepScore = k.deepClickRate != null ? Math.min(5, k.deepClickRate * 50) : 0;
    const outcomeScore = round(sessionScore + deepScore);
    out[ideaId] = {
      landingSessions: k.landingSessions,
      deepClickRate: k.deepClickRate,
      outcomeScore,
      note:
        k.landingSessions === 0
          ? "実測 session 0 (計測期間内に流入なし・加点なし)"
          : `landing ${k.landingSessions} sessions / deep-click ${k.deepClickRate ?? "-"}`,
    };
  }
  return out;
}

function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function round(v) {
  return Math.round(v * 1000) / 1000;
}
