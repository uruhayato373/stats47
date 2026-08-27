/**
 * validate-survey-portfolio.ts — survey ポートフォリオ state の決定的 lint
 *
 * 対象: .claude/state/surveys/{portfolio,experiments}.json
 * schema・判定規律の正典: .claude/state/surveys/README.md
 * 運用設計: .claude/skills/survey/manage-survey-portfolio/reference/surveyポートフォリオ運用.md
 *
 * enforce する規律 (根拠なし判定・重複実験・drift を機械的に禁止する):
 *   S1 surveyId 一意 / surveys.json (マスタ) との双方向一致 / enum 値
 *   S2 survey-editorial.ts との drift (editorialContentExists / readerQuestionCount の再導出照合)
 *   S3 editorialStatus ↔ editorialContentExists の整合
 *      (exists=true ⇔ implemented|measuring|validated)
 *   S4 merge/retire 候補は evidenceRefs >= 2 かつ GSC/GA4 両方が集計済み
 *      (measured|measured-low) かつ windowDays >= 56 / editorial-candidate は evidenceRefs >= 1
 *   S5 metrics.*.status ごとの許可数値フィールド (推測値・標本不足比率の混入防止):
 *      measured = 制限なし / measured-low = カウント値のみ
 *      (gsc: impressions,clicks / ga4: landingPageViews / internalNav: rankingOutboundClicks)
 *      insufficient-data・not-instrumented = windowDays のみ
 *   S6 orphanStatus と linkageStatus / itemCount の整合
 *   S7 portfolio / linkage 監査日の freshness (既定35日、SURVEY_STATE_MAX_AGE_DAYSで変更可)
 *   S8 survey-editorial.ts の移行 ratchet。--require-all-editorial では master 全件、
 *      必須項目件数、readerQuestions の所属・重複、過度な本文類似も検査
 *   E1 experimentId 一意 / surveyId がマスタに実在
 *   E2 同一 surveyId × changeType の pending 実験は 1 件まで (重複実験防止)
 *   E3 baseline 必須 / verdict enum / effect-* 確定には observations の d28|d56 + evidenceRefs 必須
 *   E4 primaryKpi が gsc.ctr の effect-* 確定には判定観測の gsc.impressions >= 100 が必須
 *      (impressions 100 未満で CTR 効果を確定しない)
 *
 * Usage:
 *   npx tsx .claude/scripts/surveys/validate-survey-portfolio.ts          # 人間向け (violation で exit 1)
 *   npx tsx .claude/scripts/surveys/validate-survey-portfolio.ts --json   # CI 向け JSON (violation で exit 1)
 *   npx tsx .claude/scripts/surveys/validate-survey-portfolio.ts --require-all-editorial
 *
 * ファイルが両方とも未生成 (PR-2 前) は skip 扱いで exit 0。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { METRICS_REGISTRY } from "@stats47/data-configs";

import {
  getSurveyEditorialContent,
  requiredSurveyReaderQuestionCount,
} from "../../../apps/web/src/features/survey/survey-editorial";
import { resolveSurveyTaxonomy } from "../../../packages/ranking/src/survey/survey-taxonomy";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const STATE_DIR = process.env.STATE_DIR || path.join(PROJECT_ROOT, ".claude/state/surveys");
const SURVEYS_JSON =
  process.env.SURVEYS_JSON || path.join(PROJECT_ROOT, "packages/ranking/src/data/surveys.json");
const jsonMode = process.argv.includes("--json");
const requireAllEditorial = process.argv.includes("--require-all-editorial");

const LIFECYCLE = new Set([
  "keep", "observe", "improve", "editorial-candidate", "linkage-fix-required",
  "merge-candidate", "retire-candidate", "insufficient-data",
]);
const EDITORIAL = new Set([
  "fallback", "candidate", "audit-ready", "implemented", "measuring", "validated", "rejected",
]);
const EDITORIAL_IMPLEMENTED = new Set(["implemented", "measuring", "validated"]);
const LINKAGE_STATUS = new Set(["ok", "r2-drift", "inactive-only", "orphan", "unknown"]);
const METRIC_STATUS = new Set(["measured", "measured-low", "insufficient-data", "not-instrumented"]);
// measured-low で保存を許可するカウント値 (比率値は標本不足でノイズ支配のため保存禁止 — README §判定規律)
const MEASURED_LOW_COUNT_FIELDS: Record<string, Set<string>> = {
  gsc: new Set(["impressions", "clicks"]),
  ga4: new Set(["landingPageViews"]),
  internalNav: new Set(["rankingOutboundClicks"]),
};
const VERDICT = new Set([
  "pending", "effect-full", "effect-partial", "effect-none",
  "effect-adverse", "insufficient-data", "aborted",
]);
const CHANGE_TYPE = new Set(["editorial-hub", "linkage", "title-meta", "structure", "merge", "retire"]);
const HARD_CANDIDATES = new Set(["merge-candidate", "retire-candidate"]);
const MIN_CTR_IMPRESSIONS = 100;
const MAX_STATE_AGE_DAYS = Number(process.env.SURVEY_STATE_MAX_AGE_DAYS ?? 35);
const EDITORIAL_COUNT_RATCHET = 83;
const MIN_REQUIRED_MASTER_COUNT = 80;
const MAX_EDITORIAL_SIMILARITY = 0.88;

function loadJson(file: string): { data: any; exists: boolean; parseError?: string } {
  const p = path.join(STATE_DIR, file);
  if (!fs.existsSync(p)) return { data: null, exists: false };
  try {
    return { data: JSON.parse(fs.readFileSync(p, "utf8")), exists: true };
  } catch (e) {
    return { data: null, exists: true, parseError: String((e as Error).message).split("\n")[0] };
  }
}

const violations: string[] = [];
const warnings: string[] = [];
const v = (code: string, msg: string) => violations.push(`[${code}] ${msg}`);
const w = (code: string, msg: string) => warnings.push(`[${code}] ${msg}`);

const masterSurveys = JSON.parse(
  fs.readFileSync(SURVEYS_JSON, "utf8"),
) as Array<{ id: string }>;
const masterIds = new Set(masterSurveys.map((s) => s.id));

function sentenceCount(value: string): number {
  return value.split(/[。！？!?]+/).map((part) => part.trim()).filter(Boolean).length;
}

function normalizeText(value: string): string {
  return value.normalize("NFKC").toLowerCase().replace(/[\s\p{P}\p{S}]/gu, "");
}

function normalizedNgrams(value: string, size = 3): Set<string> {
  const normalized = normalizeText(value);
  const grams = new Set<string>();
  for (let i = 0; i <= normalized.length - size; i += 1) grams.add(normalized.slice(i, i + size));
  return grams;
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return intersection / (a.size + b.size - intersection);
}

function activeRankingKeysBySurvey(): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  for (const metric of Object.values(METRICS_REGISTRY)) {
    if (metric.isActive === false) continue;
    const resolution = resolveSurveyTaxonomy({ metricKeys: [metric.key] }, METRICS_REGISTRY);
    for (const survey of resolution.surveys) {
      const keys = result.get(survey.id) ?? new Set<string>();
      keys.add(metric.key);
      result.set(survey.id, keys);
    }
  }
  return result;
}

function validateEditorial() {
  const implemented = masterSurveys.flatMap((survey) => {
    const content = getSurveyEditorialContent(survey.id);
    return content ? [{ surveyId: survey.id, content }] : [];
  });

  if (implemented.length < EDITORIAL_COUNT_RATCHET) {
    v("S8", `editorial 実装数 ${implemented.length} が ratchet ${EDITORIAL_COUNT_RATCHET} を下回る`);
  }
  // 全件移行前は通常CIを件数ratchetだけに留め、完了後は通常CIでも完全ゲートを維持する。
  if (!requireAllEditorial && EDITORIAL_COUNT_RATCHET < MIN_REQUIRED_MASTER_COUNT) return;

  if (masterSurveys.length < MIN_REQUIRED_MASTER_COUNT)
    v("S8", `survey master が ${masterSurveys.length} 件 (最低 ${MIN_REQUIRED_MASTER_COUNT} 件)`);
  const missing = masterSurveys.map((survey) => survey.id)
    .filter((surveyId) => !getSurveyEditorialContent(surveyId));
  if (missing.length > 0)
    v("S8", `editorial 未実装 ${missing.length} 件: ${missing.join(",")}`);

  const membership = activeRankingKeysBySurvey();
  const fingerprints: Array<{ surveyId: string; grams: Set<string> }> = [];
  for (const { surveyId, content } of implemented) {
    const summarySentences = sentenceCount(content.summary);
    if (summarySentences < 2 || summarySentences > 3)
      v("S8", `${surveyId}: summary は2〜3文が必須 (現在 ${summarySentences}文)`);
    if (content.whatYouCanLearn.length < 3 || content.whatYouCanLearn.length > 5)
      v("S8", `${surveyId}: whatYouCanLearn は3〜5件が必須 (現在 ${content.whatYouCanLearn.length}件)`);
    const surveyKeys = membership.get(surveyId) ?? new Set<string>();
    const requiredReaderQuestions = requiredSurveyReaderQuestionCount(surveyKeys.size);
    if (content.readerQuestions.length < requiredReaderQuestions || content.readerQuestions.length > 5)
      v(
        "S8",
        `${surveyId}: readerQuestions はactive在庫に応じて${requiredReaderQuestions}〜5件が必須 (active ${surveyKeys.size}件 / 現在 ${content.readerQuestions.length}件)`,
      );
    if (content.caveats.length < 2 || content.caveats.length > 5)
      v("S8", `${surveyId}: caveats は2〜5件が必須 (現在 ${content.caveats.length}件)`);
    for (const [field, values] of [
      ["whatYouCanLearn", content.whatYouCanLearn],
      ["caveats", content.caveats],
    ] as const) {
      if (values.some((value) => value.trim().length === 0))
        v("S8", `${surveyId}: ${field} に空文字がある`);
    }

    const surveyQuestions = new Set<string>();
    const surveyRankingKeys = new Set<string>();
    for (const readerQuestion of content.readerQuestions) {
      const question = readerQuestion.question.trim();
      const rankingKey = readerQuestion.rankingKey.trim();
      if (!question || !rankingKey) {
        v("S8", `${surveyId}: readerQuestions に空の question/rankingKey がある`);
        continue;
      }
      if (!surveyKeys.has(rankingKey))
        v("S8", `${surveyId}: readerQuestion の ${rankingKey} は当該調査の active ranking に所属しない`);
      if (surveyRankingKeys.has(rankingKey))
        v("S8", `${surveyId}: readerQuestions の rankingKey 重複 (${rankingKey})`);
      surveyRankingKeys.add(rankingKey);
      const normalizedQuestion = normalizeText(question);
      if (surveyQuestions.has(normalizedQuestion))
        v("S8", `${surveyId}: readerQuestion 重複: 「${question}」`);
      surveyQuestions.add(normalizedQuestion);
    }

    fingerprints.push({
      surveyId,
      grams: normalizedNgrams(
        [content.summary, ...content.whatYouCanLearn, ...content.caveats].join(" "),
      ),
    });
  }

  for (let i = 0; i < fingerprints.length; i += 1) {
    for (let j = i + 1; j < fingerprints.length; j += 1) {
      const similarity = jaccardSimilarity(fingerprints[i].grams, fingerprints[j].grams);
      if (similarity >= MAX_EDITORIAL_SIMILARITY)
        v("S8", `editorial 本文の過度な類似: ${fingerprints[i].surveyId},${fingerprints[j].surveyId} (${similarity.toFixed(3)} >= ${MAX_EDITORIAL_SIMILARITY})`);
    }
  }
}

// ---------- portfolio.json ----------
function validatePortfolio(pf: any) {
  if (!Array.isArray(pf.surveys)) {
    v("S0", "portfolio.surveys が配列でない");
    return;
  }
  if (!pf.linkage || typeof pf.linkage !== "object")
    w("S0", "linkage グローバルサマリが無い (build を実行して転記する)");
  const today = Date.now();
  for (const [field, value] of [
    ["generatedAt", pf.generatedAt],
    ["linkage.auditedAt", pf.linkage?.auditedAt],
  ] as const) {
    const timestamp = typeof value === "string" ? new Date(`${value}T00:00:00Z`).getTime() : NaN;
    const ageDays = (today - timestamp) / 86_400_000;
    if (!Number.isFinite(ageDays)) {
      v("S7", `${field} が有効な YYYY-MM-DD でない (${value ?? "欠落"})`);
    } else if (ageDays > MAX_STATE_AGE_DAYS) {
      v("S7", `${field} が stale (${ageDays.toFixed(1)}日 > ${MAX_STATE_AGE_DAYS}日) — 週次監査を再実行`);
    }
  }
  const ids = new Set<string>();
  for (const s of pf.surveys) {
    const id = s.surveyId;
    if (!id || typeof id !== "string") {
      v("S1", "surveyId 欠落エントリあり");
      continue;
    }
    if (ids.has(id)) v("S1", `surveyId 重複: ${id}`);
    ids.add(id);
    if (!masterIds.has(id)) v("S1", `${id}: surveys.json (マスタ) に存在しない`);
    if (!LIFECYCLE.has(s.lifecycleStatus)) v("S1", `${id}: lifecycleStatus 不正 (${s.lifecycleStatus})`);
    if (!EDITORIAL.has(s.editorialStatus)) v("S1", `${id}: editorialStatus 不正 (${s.editorialStatus})`);
    if (!LINKAGE_STATUS.has(s.linkageStatus)) v("S1", `${id}: linkageStatus 不正 (${s.linkageStatus})`);

    // S2: survey-editorial.ts との drift (再導出照合)
    const editorial = getSurveyEditorialContent(id);
    const exists = Boolean(editorial);
    if (s.editorialContentExists !== exists)
      v("S2", `${id}: editorialContentExists=${s.editorialContentExists} だが survey-editorial.ts の実装は ${exists} — drift (build を再実行)`);
    const rq = editorial ? editorial.readerQuestions.length : null;
    if ((s.readerQuestionCount ?? null) !== rq)
      v("S2", `${id}: readerQuestionCount=${s.readerQuestionCount} だが survey-editorial.ts は ${rq} — drift (build を再実行)`);

    // S3: editorialStatus ↔ exists の整合
    if (exists && !EDITORIAL_IMPLEMENTED.has(s.editorialStatus))
      v("S3", `${id}: editorial 実装済みなのに editorialStatus=${s.editorialStatus}`);
    if (!exists && EDITORIAL_IMPLEMENTED.has(s.editorialStatus))
      v("S3", `${id}: editorial 未実装なのに editorialStatus=${s.editorialStatus}`);

    // S4: 候補判定の根拠
    const refs = Array.isArray(s.evidenceRefs) ? s.evidenceRefs.filter(Boolean) : [];
    if (HARD_CANDIDATES.has(s.lifecycleStatus)) {
      if (refs.length < 2)
        v("S4", `${id}: ${s.lifecycleStatus} には evidenceRefs >= 2 が必須 (現在 ${refs.length})`);
      const aggregated = (m: any) =>
        m && (m.status === "measured" || m.status === "measured-low") && m.windowDays >= 56;
      if (!aggregated(s.metrics?.gsc) || !aggregated(s.metrics?.ga4))
        v("S4", `${id}: ${s.lifecycleStatus} には GSC/GA4 両方の集計済み (measured|measured-low) かつ windowDays>=56 が必須 (データ不足を需要不足と混同した廃止判定の禁止)`);
    }
    if (s.lifecycleStatus === "editorial-candidate" && refs.length < 1)
      v("S4", `${id}: editorial-candidate には evidenceRefs >= 1 が必須 (根拠なしで候補化しない)`);

    // S5: status ごとの許可数値フィールド (推測値・標本不足比率の混入防止)
    for (const [name, m] of Object.entries<any>(s.metrics ?? {})) {
      if (!m || typeof m !== "object") continue;
      if (!METRIC_STATUS.has(m.status)) {
        v("S5", `${id}: metrics.${name}.status 不正 (${m.status})`);
        continue;
      }
      if (m.status === "measured") continue; // 制限なし
      const numeric = Object.entries(m).filter(([k, val]) => k !== "windowDays" && typeof val === "number");
      if (m.status === "measured-low") {
        const allowed = MEASURED_LOW_COUNT_FIELDS[name] ?? new Set();
        const banned = numeric.filter(([k]) => !allowed.has(k));
        if (banned.length > 0)
          v("S5", `${id}: metrics.${name} は measured-low なのに比率/非カウント値 (${banned.map(([k]) => k).join(",")}) を持つ — 標本不足の比率値は保存禁止`);
      } else if (numeric.length > 0) {
        v("S5", `${id}: metrics.${name} は ${m.status} なのに数値 (${numeric.map(([k]) => k).join(",")}) を持つ — 推測値を保存しない`);
      }
    }

    // S6: orphan / inactive-only / r2-drift の整合 (未公開を stale と混同した誤診の防止 — 2026-07-14 教訓)
    if (s.orphanStatus === true && s.linkageStatus !== "orphan")
      v("S6", `${id}: orphanStatus=true なのに linkageStatus=${s.linkageStatus}`);
    if (s.itemCount === 0 && s.orphanStatus !== true)
      v("S6", `${id}: itemCount=0 なのに orphanStatus=${s.orphanStatus}`);
    if (s.linkageStatus === "inactive-only" && !(s.activeItemCount === 0 && s.itemCount > 0))
      v("S6", `${id}: inactive-only なのに activeItemCount=${s.activeItemCount} / itemCount=${s.itemCount} (定義: active 0 かつ在庫 > 0)`);
    if (s.linkageStatus === "r2-drift" && !(typeof s.activeItemCount === "number" && s.activeItemCount > 0))
      v("S6", `${id}: r2-drift は activeItemCount > 0 が前提 (active 0 なら inactive-only = R2 不在は正常)`);
    if (s.orphanStatus === true)
      w("S6", `${id}: orphan (item 0 件) — surveys.json からの物理削除を survey-curator が判断`);
    if (s.linkageStatus === "r2-drift")
      w("S6", `${id}: active item があるのに R2 all.json に不在 (真の stale) — sync-snapshots (ranking-items → master) を CI へ委譲`);
    if (s.linkageStatus === "inactive-only")
      w("S6", `${id}: 在庫 ${s.itemCount} 件すべて未公開 (isActive:false) — 公開判断は ranking-publisher / expansion queue (R2 不在は正常)`);
  }
  // マスタ側の取りこぼし (双方向一致)
  for (const id of masterIds) if (!ids.has(id)) v("S1", `surveys.json の ${id} が portfolio に無い (build を再実行)`);
}

// ---------- experiments.json ----------
function validateExperiments(ex: any) {
  if (!Array.isArray(ex.experiments)) {
    v("E0", "experiments.experiments が配列でない");
    return;
  }
  const ids = new Set<string>();
  const pendingPairs = new Map<string, string>();
  for (const e of ex.experiments) {
    const id = e.experimentId;
    if (!id) {
      v("E1", "experimentId 欠落エントリあり");
      continue;
    }
    if (ids.has(id)) v("E1", `experimentId 重複: ${id}`);
    ids.add(id);
    if (!e.surveyId || !masterIds.has(e.surveyId))
      v("E1", `${id}: surveyId がマスタに実在しない (${e.surveyId})`);
    if (!CHANGE_TYPE.has(e.changeType)) v("E1", `${id}: changeType 不正 (${e.changeType})`);
    if (!VERDICT.has(e.verdict)) v("E3", `${id}: verdict 不正 (${e.verdict})`);

    // E3: baseline 必須
    if (!e.baseline || typeof e.baseline !== "object" || Object.keys(e.baseline).length === 0)
      v("E3", `${id}: baseline 欠落 — 効果測定不能な実験は登録不可`);
    if (e.startedAt && !(e.evaluateAt7d && e.evaluateAt28d && e.evaluateAt56d))
      v("E3", `${id}: startedAt があるのに evaluateAt7d/28d/56d が揃っていない`);

    // E3: 確定 verdict は d28|d56 観測 + evidenceRefs 必須 (d7 では確定不可)
    if (typeof e.verdict === "string" && e.verdict.startsWith("effect-")) {
      const obs = e.observations ?? {};
      const deciding = obs.d56 ?? obs.d28;
      if (!deciding)
        v("E3", `${id}: verdict=${e.verdict} なのに observations の d28/d56 が無い (d7 だけでは確定不可)`);
      const refs = Array.isArray(e.evidenceRefs) ? e.evidenceRefs.filter(Boolean) : [];
      if (refs.length < 1) v("E3", `${id}: verdict 確定には evidenceRefs >= 1 が必須`);

      // E4: CTR 効果は impressions >= 100 が無いと確定しない
      // (observations.dNN の形は evaluate-survey-experiments.mjs が書く {observedAt, window, values})
      if (e.primaryKpi === "gsc.ctr") {
        const imp = deciding?.values?.["gsc.impressions"]?.value;
        if (typeof imp !== "number" || imp < MIN_CTR_IMPRESSIONS)
          v("E4", `${id}: primaryKpi=gsc.ctr の effect-* 確定には判定観測の gsc.impressions >= ${MIN_CTR_IMPRESSIONS} が必須 (現在 ${imp ?? "無記録"}) — insufficient-data とする`);
      }
    }

    // E2: 同一 survey × changeType の pending は 1 件まで
    if (e.verdict === "pending") {
      const pair = `${e.surveyId}::${e.changeType}`;
      if (pendingPairs.has(pair))
        v("E2", `重複実験: ${pair} の pending が複数 (${pendingPairs.get(pair)}, ${id})`);
      pendingPairs.set(pair, id);
    }
  }
}

// ---------- main ----------
const pf = loadJson("portfolio.json");
const ex = loadJson("experiments.json");

validateEditorial();
if (pf.parseError) v("S0", `portfolio.json parse 失敗: ${pf.parseError}`);
if (ex.parseError) v("E0", `experiments.json parse 失敗: ${ex.parseError}`);
if (pf.data) validatePortfolio(pf.data);
if (ex.data) validateExperiments(ex.data);

const skipped = !pf.exists && !ex.exists;
const result = {
  stateDir: STATE_DIR,
  portfolioExists: pf.exists,
  experimentsExists: ex.exists,
  surveys: pf.data?.surveys?.length ?? 0,
  experiments: ex.data?.experiments?.length ?? 0,
  editorialImplemented: masterSurveys.filter((survey) => getSurveyEditorialContent(survey.id)).length,
  editorialRequired: requireAllEditorial ? masterSurveys.length : EDITORIAL_COUNT_RATCHET,
  violations,
  warnings,
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else if (skipped) {
  console.log("survey state 未生成 (PR-2 前) — skip");
} else {
  console.log(`surveys: ${result.surveys} / experiments: ${result.experiments}`);
  console.log(`editorial: ${result.editorialImplemented} / ${result.editorialRequired}${requireAllEditorial ? " (all required)" : " (ratchet)"}`);
  violations.forEach((x) => console.log("✗", x));
  warnings.forEach((x) => console.log("⚠", x));
  if (violations.length === 0) console.log("✓ survey state 違反なし");
}
process.exit(violations.length > 0 ? 1 : 0);
