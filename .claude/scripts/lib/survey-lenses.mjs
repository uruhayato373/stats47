// 統計調査の切り口台帳 (data/surveys/lenses/<surveyId>.json) の検査と、切り口 × チャネルの展開状況の集計 (純粋関数)。
// 規約: .claude/rules/survey-content-standards.md「調査の切り口台帳」。CLI: .claude/scripts/surveys/survey-lenses.ts
//
// なぜ要るか (2026-11-02): 家計調査の切り口 (数量と単価に分ける・年収階級で比べる など) が、本の分析台帳・ブログ用の論点カタログ・
// サイトの分析単位の台帳・調査の参照文書に散らばり、「調査にどんな切り口があり、どこまで展開したか」を一か所で見られなかった。
// 参考文献の規約の「資料ごとに分類を作らない」を「切り口の台帳を作らない」と読み違え、切り口を本の企画の札に格下げしかけた。
// 切り口は資料ではなく調査の持ち物なので、調査ごとの台帳に置き、問い・分析単位はそこを参照する。

/**
 * @typedef {{ id: string, name: string, channels: Record<string, string>, dataTables: string[], readiness?: { state: "ready" | "blocked", blockers?: string[] } }} SurveyLens
 * @typedef {{ surveyId: string, relatedSurveyIds?: string[], statCode: string, lenses: SurveyLens[] }} LensLedger
 * @typedef {{ id: string, surveyIds: string[], lensIds?: string[], resolution: string }} LensAnalysis  資料 (本) の問い
 * @typedef {{ id: string, lensId: string }} LensUnit  分析単位 (例: kakei-analysis-catalog.ts の行)
 * @typedef {{ level: "error" | "warn", code: string, message: string }} LensFinding
 */

/** 制作単位にしない資料の解決 (reference-expansion.mjs の ADOPTED の外)。切り口への結び付けは任意 */
const NON_PRODUCTION = new Set(["context-only", "primary-source-unavailable", "rights-hold", "not-applicable"]);

/**
 * @param {object} p
 * @param {LensLedger[]} p.ledgers
 * @param {Set<string>} p.knownSurveyIds  調査マスタ (packages/ranking/src/data/surveys.json) の id
 * @param {Map<string, Set<string>>} [p.tablesBySurvey]  調査ごとに実在を確かめられる表の集合 (例: 家計調査の台帳の表)。無い調査は照合しない
 * @param {LensAnalysis[]} p.analyses
 * @param {LensUnit[]} p.units
 * @returns {LensFinding[]}
 */
export function checkLensLedgers({ ledgers, knownSurveyIds, tablesBySurvey = new Map(), analyses, units }) {
  /** @type {LensFinding[]} */
  const findings = [];
  const lensById = new Map();
  const surveysWithLedger = new Map(); // 調査 id (関連 id を含む) → その台帳の切り口 id の集合
  for (const ledger of ledgers) {
    for (const id of [ledger.surveyId, ...(ledger.relatedSurveyIds ?? [])]) {
      if (!knownSurveyIds.has(id)) findings.push({ level: "error", code: "UNKNOWN_SURVEY", message: `${ledger.surveyId}: 調査 ${id} が調査マスタに無い` });
    }
    const ids = new Set();
    const tables = tablesBySurvey.get(ledger.surveyId);
    for (const lens of ledger.lenses) {
      if (lensById.has(lens.id)) findings.push({ level: "error", code: "DUPLICATE_LENS", message: `切り口 ${lens.id} が重複` });
      lensById.set(lens.id, { lens, surveyId: ledger.surveyId });
      ids.add(lens.id);
      for (const table of lens.dataTables) {
        if (tables && !tables.has(table)) findings.push({ level: "error", code: "UNKNOWN_TABLE", message: `${lens.id}: 表 ${table} が ${ledger.surveyId} の台帳に無い` });
      }
      if (lens.readiness?.state === "blocked" && !(lens.readiness.blockers ?? []).length) {
        findings.push({ level: "error", code: "BLOCKED_WITHOUT_REASON", message: `${lens.id}: blocked なのに理由 (blockers) が無い` });
      }
    }
    for (const id of [ledger.surveyId, ...(ledger.relatedSurveyIds ?? [])]) surveysWithLedger.set(id, ids);
  }

  for (const a of analyses) {
    for (const lensId of a.lensIds ?? []) {
      if (!lensById.has(lensId)) findings.push({ level: "error", code: "UNKNOWN_LENS", message: `${a.id}: 切り口 ${lensId} が台帳に無い` });
    }
    const covered = a.surveyIds.filter((s) => surveysWithLedger.has(s));
    if (covered.length && !NON_PRODUCTION.has(a.resolution) && !(a.lensIds ?? []).some((l) => covered.some((s) => surveysWithLedger.get(s)?.has(l)))) {
      findings.push({ level: "error", code: "UNLINKED_QUESTION", message: `${a.id}: 調査 ${covered.join(",")} の問いなのに、その調査の切り口 (lensIds) に結ばれていない` });
    }
  }
  for (const u of units) {
    if (!lensById.has(u.lensId)) findings.push({ level: "error", code: "UNKNOWN_LENS", message: `${u.id}: 切り口 ${u.lensId} が台帳に無い` });
  }

  const usedLenses = new Set([...analyses.flatMap((a) => a.lensIds ?? []), ...units.map((u) => u.lensId)]);
  for (const id of lensById.keys()) {
    if (!usedLenses.has(id)) findings.push({ level: "warn", code: "LENS_WITHOUT_QUESTIONS", message: `${id}: 問いも分析単位もまだ無い` });
  }
  return findings;
}

/**
 * 切り口 × チャネルの展開状況。状態は展開記録の集計 (reference-expansion.mjs の expansionStatus の行) から数え、台帳には持たない。
 * @param {object} p
 * @param {LensLedger[]} p.ledgers
 * @param {LensAnalysis[]} p.analyses
 * @param {LensUnit[]} p.units
 * @param {{ analysis: { id: string, lensIds?: string[] }, channel: string, state: string }[]} p.rows  expansionStatus の結果
 */
export function lensStatus({ ledgers, analyses, units, rows }) {
  return ledgers.flatMap((ledger) =>
    ledger.lenses.map((lens) => {
      const questions = analyses.filter((a) => (a.lensIds ?? []).includes(lens.id));
      const channels = Object.keys(lens.channels).map((channel) => {
        const counts = { done: 0, derived: 0, planned: 0, declined: 0, pending: 0 };
        for (const r of rows) {
          if (r.channel === channel && (r.analysis.lensIds ?? []).includes(lens.id)) counts[r.state] = (counts[r.state] ?? 0) + 1;
        }
        return { channel, role: lens.channels[channel], counts };
      });
      return {
        surveyId: ledger.surveyId,
        lensId: lens.id,
        name: lens.name,
        readiness: lens.readiness?.state ?? "ready",
        blockers: lens.readiness?.blockers ?? [],
        questions: questions.length,
        units: units.filter((u) => u.lensId === lens.id).length,
        channels,
      };
    }),
  );
}
