/**
 * build-survey-portfolio.ts — survey ポートフォリオ state の決定的 builder (upsert)
 *
 * 機械項目 (surveys.json のマスタ情報・紐付け監査の itemCount/orphan・R2 all.json の
 * activeItemCount/linkage drift・survey-editorial.ts の編集実装状態・レビュー文書対応付け) を
 * 毎回再導出し、意味項目 (lifecycleStatus / editorialStatus / currentHypothesis / evidenceRefs /
 * metrics / nextReviewAt) は既存値を保持する (theme portfolio / blog remediation-queue と同じ upsert 思想)。
 * 意味項目の変更も本スクリプトの --set 経由で行う (portfolio.json の手編集禁止)。
 *
 * 紐付けの導出ロジックは書かない: itemCount 等は audit-survey-linkage.ts (--json) の実測値を転記する
 * (resolveSurveyLinkage への一本化 — survey-linkage-standards.md §5)。
 *
 * schema・判定規律の正典: .claude/state/surveys/README.md
 * 運用設計: .claude/skills/survey/manage-survey-portfolio/reference/surveyポートフォリオ運用.md
 *
 * Usage:
 *   npx tsx .claude/scripts/surveys/build-survey-portfolio.ts                 # 機械項目の再導出 (upsert)
 *     [--audit-file <path>]   # 保存済み audit JSON を再利用 (省略時は audit-survey-linkage.ts --json を実行)
 *     [--offline]             # R2 app/survey/all.json を fetch しない (activeItemCount/linkageStatus は既存値维持)
 *   npx tsx .claude/scripts/surveys/build-survey-portfolio.ts --set <surveyId> \
 *     [--lifecycle <status>] [--editorial <status>] [--hypothesis "<text>"] \
 *     [--add-evidence <ref>] [--next-review YYYY-MM-DD]
 *   npx tsx .claude/scripts/surveys/build-survey-portfolio.ts --add-experiment <file.json>
 *
 * 実行後は必ず validate-survey-portfolio.ts を通すこと (根拠なし判定・drift は validator が弾く)。
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getSurveyEditorialContent } from "../../../apps/web/src/features/survey/survey-editorial";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/surveys");
const REVIEW_DIR = path.join(
  PROJECT_ROOT,
  ".claude/skills/survey/manage-survey-portfolio/reference/reviews",
);
const PORTFOLIO = path.join(STATE_DIR, "portfolio.json");
const EXPERIMENTS = path.join(STATE_DIR, "experiments.json");
const SURVEYS_JSON = path.join(PROJECT_ROOT, "packages/ranking/src/data/surveys.json");
const AUDIT_SCRIPT = "packages/ranking/src/scripts/audit-survey-linkage.ts";
const R2_ALL_URL = "https://storage.stats47.jp/app/survey/all.json";

interface SurveyMaster {
  id: string;
  name: string;
  organization: string | null;
}

interface AuditJson {
  generatedAt: string;
  totals: { metrics: number; activeMetrics?: number; resolved: number; unresolved: number; coverage: number };
  unresolvedByReason: Record<string, number>;
  uncoveredStatsDataIds: string[];
  orphanSurveys: string[];
  badOverrides: unknown[];
  perSurvey: Record<string, number>;
  /** git 導出 × isActive (= 配信されるべき数)。2026-07-14 追加 — 無い旧 audit file は null 扱い */
  perSurveyActive?: Record<string, number>;
}

interface SurveyEntry {
  surveyId: string;
  name: string;
  organization: string | null;
  lifecycleStatus: string;
  linkageStatus: "ok" | "r2-drift" | "inactive-only" | "orphan" | "unknown";
  editorialStatus: string;
  itemCount: number;
  activeItemCount: number | null;
  liveItemCount: number | null;
  latestDataYear: string | null;
  unresolvedItemCount: number | null;
  orphanStatus: boolean;
  editorialContentExists: boolean;
  readerQuestionCount: number | null;
  relatedArticleCount: number | null;
  gscSnapshotRef: string | null;
  ga4SnapshotRef: string | null;
  metrics: Record<string, { status: string; windowDays?: number } & Record<string, unknown>>;
  currentHypothesis: string | null;
  evidenceRefs: string[];
  lastReviewedAt: string | null;
  nextReviewAt: string | null;
}

interface Portfolio {
  schemaVersion: number;
  generatedAt: string | null;
  linkage: Record<string, unknown> | null;
  surveys: SurveyEntry[];
}

function load<T>(file: string, fallback: T): T {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function findReviewDoc(surveyId: string): { ref: string; date: string | null } | null {
  if (!fs.existsSync(REVIEW_DIR)) return null;
  const files = fs
    .readdirSync(REVIEW_DIR)
    .filter((f) => new RegExp(`^\\d{4}-\\d{2}-\\d{2}-survey-${surveyId}\\.md$`).test(f))
    .sort(); // 複数あれば最新日付
  if (files.length === 0) return null;
  const f = files[files.length - 1];
  const src = fs.readFileSync(path.join(REVIEW_DIR, f), "utf8");
  const date = src.match(/^date:\s*(\S+)/m)?.[1] ?? f.slice(0, 10);
  return {
    ref: `.claude/skills/survey/manage-survey-portfolio/reference/reviews/${f}`,
    date,
  };
}

function runAudit(auditFile?: string): AuditJson {
  if (auditFile) return JSON.parse(fs.readFileSync(auditFile, "utf8")) as AuditJson;
  console.log("audit-survey-linkage.ts --json 実行中 (数十秒かかる)...");
  const out = execFileSync((process.platform === "win32" ? "npx.cmd" : "npx"), ["tsx", AUDIT_SCRIPT, "--json"], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return JSON.parse(out) as AuditJson;
}

async function fetchR2All(): Promise<Map<string, number> | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15_000);
    const res = await fetch(R2_ALL_URL, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const body = (await res.json()) as
      | { surveys: Array<{ id: string; itemCount?: number }> }
      | Array<{ id: string; itemCount?: number }>;
    const arr = Array.isArray(body) ? body : body.surveys;
    if (!Array.isArray(arr)) throw new Error("想定外の all.json 形状 (surveys 配列なし)");
    return new Map(arr.map((s) => [s.id, s.itemCount ?? 0]));
  } catch (e) {
    console.warn(`⚠ R2 all.json fetch 失敗 (${String(e)}) — activeItemCount/linkageStatus は既存値を維持`);
    return null;
  }
}

function deriveMechanical(
  master: SurveyMaster,
  audit: AuditJson,
  r2: Map<string, number> | null,
  existing: SurveyEntry | undefined,
): Partial<SurveyEntry> {
  const itemCount = audit.perSurvey[master.id] ?? 0; // git 導出の総数 (inactive 含む)
  const activeItemCount = audit.perSurveyActive
    ? (audit.perSurveyActive[master.id] ?? 0) // git 導出 × isActive (= 配信されるべき数)
    : null; // 旧 audit file (perSurveyActive なし) は判定不能
  const orphanStatus = itemCount === 0;
  const editorial = getSurveyEditorialContent(master.id);
  const review = findReviewDoc(master.id);

  // linkageStatus (4+1 値):
  //   orphan        = git 導出でも item 0 (マスタから物理削除の候補)
  //   inactive-only = 在庫はあるが全て未公開 (isActive:false)。R2 不在は正常 — 公開判断は
  //                   ranking-publisher / expansion queue (r2-drift と混同しない: 2026-07-14 教訓)
  //   r2-drift      = active item があるのに R2 all.json に調査が無い (真の stale。要 sync)
  //   ok / unknown
  const liveItemCount = r2 ? (r2.get(master.id) ?? null) : (existing?.liveItemCount ?? null);
  let linkageStatus: SurveyEntry["linkageStatus"];
  if (orphanStatus) {
    linkageStatus = "orphan";
  } else if (activeItemCount === 0) {
    linkageStatus = "inactive-only";
  } else if (r2) {
    linkageStatus = r2.has(master.id) ? "ok" : "r2-drift";
  } else {
    linkageStatus = existing?.linkageStatus ?? "unknown";
  }

  return {
    surveyId: master.id,
    name: master.name,
    organization: master.organization ?? null,
    linkageStatus,
    itemCount,
    activeItemCount,
    liveItemCount,
    orphanStatus,
    editorialContentExists: Boolean(editorial),
    readerQuestionCount: editorial ? editorial.readerQuestions.length : null,
    relatedArticleCount: editorial
      ? ((editorial as { relatedArticleSlugs?: readonly string[] }).relatedArticleSlugs?.length ?? null)
      : null,
    lastReviewedAt: review?.date ?? null,
  };
}

function defaults(mech: Partial<SurveyEntry>, reviewRef: string | null): SurveyEntry {
  return {
    surveyId: "",
    name: "",
    organization: null,
    lifecycleStatus: "observe",
    linkageStatus: "unknown",
    editorialStatus: mech.editorialContentExists ? "implemented" : "fallback",
    itemCount: 0,
    activeItemCount: null,
    liveItemCount: null,
    latestDataYear: null, // PR-3 (R2 集計) で埋める
    unresolvedItemCount: null, // 未分類は survey 帰属不能 (グローバル linkage が正)
    orphanStatus: false,
    editorialContentExists: false,
    readerQuestionCount: null,
    relatedArticleCount: null,
    gscSnapshotRef: null, // PR-3 で埋める
    ga4SnapshotRef: null,
    metrics: {
      // PR-3 の集計前は「判定に使える標本なし」= insufficient-data (数値は持たない)
      gsc: { status: "insufficient-data", windowDays: 0 },
      ga4: { status: "insufficient-data", windowDays: 0 },
      // 初回 build 時点では snapshot が無い。aggregate-survey-metrics が実測へ置換する。
      internalNav: { status: "insufficient-data", windowDays: 0 },
    },
    currentHypothesis: null,
    evidenceRefs: reviewRef ? [reviewRef] : [],
    lastReviewedAt: null,
    nextReviewAt: "2026-10-01",
    ...mech,
  } as SurveyEntry;
}

function getOpt(args: string[], name: string): string | undefined {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

async function main() {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  const pf = load<Portfolio>(PORTFOLIO, {
    schemaVersion: 1,
    generatedAt: null,
    linkage: null,
    surveys: [],
  });
  const byId = new Map(pf.surveys.map((s) => [s.surveyId, s]));
  const args = process.argv.slice(2);

  if (args.includes("--set")) {
    // ── 意味項目の更新モード (手編集の代替・script 経由の書き込み口) ──
    const id = getOpt(args, "--set");
    const entry = id ? byId.get(id) : undefined;
    if (!entry) {
      console.error(`✗ ${id} は portfolio に存在しない (先に build を実行)`);
      process.exit(1);
    }
    const lc = getOpt(args, "--lifecycle");
    if (lc) entry.lifecycleStatus = lc;
    const ed = getOpt(args, "--editorial");
    if (ed) entry.editorialStatus = ed;
    const hyp = getOpt(args, "--hypothesis");
    if (hyp) entry.currentHypothesis = hyp;
    const ev = getOpt(args, "--add-evidence");
    if (ev && !entry.evidenceRefs.includes(ev)) entry.evidenceRefs.push(ev);
    const nr = getOpt(args, "--next-review");
    if (nr) entry.nextReviewAt = nr;
    console.log(
      `set: ${id} lifecycle=${entry.lifecycleStatus} editorial=${entry.editorialStatus} evidence=${entry.evidenceRefs.length}`,
    );
  } else if (args.includes("--add-experiment")) {
    // ── 実験登録モード (experiments.json の script 経由の書き込み口) ──
    const file = getOpt(args, "--add-experiment");
    if (!file || !fs.existsSync(file)) {
      console.error("✗ --add-experiment <file.json> が必要");
      process.exit(1);
    }
    const exp = JSON.parse(fs.readFileSync(file, "utf8"));
    const ex = load(EXPERIMENTS, { schemaVersion: 1, experiments: [] as Array<Record<string, unknown>> });
    if (ex.experiments.some((e) => e.experimentId === exp.experimentId)) {
      console.error(`✗ experimentId 重複: ${exp.experimentId}`);
      process.exit(1);
    }
    ex.experiments.push(exp);
    fs.writeFileSync(EXPERIMENTS, JSON.stringify(ex, null, 2) + "\n");
    console.log(`experiment 登録: ${exp.experimentId} (${exp.surveyId} / ${exp.changeType})`);
    console.log("→ validate-survey-portfolio.ts で規律検証すること");
    return;
  } else {
    // ── 機械項目の再導出モード (upsert) ──
    const master = JSON.parse(fs.readFileSync(SURVEYS_JSON, "utf8")) as SurveyMaster[];
    const audit = runAudit(getOpt(args, "--audit-file"));
    const r2 = args.includes("--offline") ? null : await fetchR2All();

    for (const m of master) {
      const existing = byId.get(m.id);
      const mech = deriveMechanical(m, audit, r2, existing);
      const review = findReviewDoc(m.id);
      if (existing) {
        Object.assign(existing, mech); // 機械項目のみ上書き (意味項目は保持)
        if (review && !existing.evidenceRefs.includes(review.ref)) existing.evidenceRefs.push(review.ref);
        // 編集実装が確認できたのに前段階 status のままなら昇格 (逆方向の降格はしない — drift は validator が検知)
        if (
          existing.editorialContentExists &&
          ["fallback", "candidate", "audit-ready"].includes(existing.editorialStatus)
        ) {
          existing.editorialStatus = "implemented";
          console.log(`  editorialStatus 昇格: ${m.id} → implemented (editorial 実装を検出)`);
        }
      } else {
        byId.set(m.id, defaults(mech, review?.ref ?? null));
      }
    }
    // master から消えた survey は portfolio からも落とす (orphan 物理削除の追従)
    for (const key of [...byId.keys()]) {
      if (!master.some((m) => m.id === key)) {
        byId.delete(key);
        console.log(`  master から削除済みのため除去: ${key}`);
      }
    }
    pf.linkage = {
      auditedAt: audit.generatedAt.slice(0, 10),
      metrics: audit.totals.metrics,
      resolved: audit.totals.resolved,
      unresolved: audit.totals.unresolved,
      coveragePct: audit.totals.coverage,
      unresolvedByReason: audit.unresolvedByReason,
      uncoveredStatsDataIds: audit.uncoveredStatsDataIds.length,
      orphanSurveys: audit.orphanSurveys.length,
      badOverrides: audit.badOverrides.length,
    };
    pf.surveys = [...byId.values()].sort((a, b) => a.surveyId.localeCompare(b.surveyId));
    const drift = pf.surveys.filter((s) => s.linkageStatus === "r2-drift").map((s) => s.surveyId);
    console.log(
      `build: ${pf.surveys.length} surveys (orphan ${pf.surveys.filter((s) => s.orphanStatus).length} / ` +
        `editorial 実装 ${pf.surveys.filter((s) => s.editorialContentExists).length} / r2-drift ${drift.length}${drift.length ? `: ${drift.join(",")}` : ""})`,
    );
  }

  pf.generatedAt = new Date().toISOString().slice(0, 10);
  fs.writeFileSync(PORTFOLIO, JSON.stringify(pf, null, 2) + "\n");

  if (!fs.existsSync(EXPERIMENTS)) {
    fs.writeFileSync(EXPERIMENTS, JSON.stringify({ schemaVersion: 1, experiments: [] }, null, 2) + "\n");
    console.log("experiments.json 初期化 (空)");
  }
  console.log(`→ ${PORTFOLIO}`);
}

main();
