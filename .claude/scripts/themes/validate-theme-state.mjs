#!/usr/bin/env node
/**
 * validate-theme-state.mjs — テーマポートフォリオ state の決定的 lint
 *
 * 対象: .claude/state/themes/{portfolio,experiments}.json
 * schema・判定規律の正典: .claude/state/themes/README.md
 * 運用設計: docs/02_実装計画/25_テーマポートフォリオ運用.md
 *
 * enforce する規律 (根拠なし判定・重複実験を機械的に禁止する):
 *   P1 themeKey 一意 / 必須フィールド / enum 値
 *   P2 catalogStatus が ThemeCatalog 登録状況 (theme-catalog/index.ts) と一致
 *   P3 merge/split/rename/retire 候補は evidenceRefs >= 2
 *   P4 merge/retire 候補は GSC/GA4 両方が集計済み (measured | measured-low) かつ windowDays >= 56
 *      (データ不足 = 未集計を需要不足と混同した廃止判定の禁止。需要不足の証拠は
 *       measured-low のカウント値で示す — 2026-07-13 改訂、根拠は state README §判定規律 2)
 *   P5 metrics.*.status ごとの許可数値フィールド (推測値・標本不足比率の混入防止):
 *      measured = 制限なし / measured-low = カウント値のみ (gsc: clicks,impressions / ga4: pageViews)
 *      insufficient-data・not-instrumented = windowDays のみ
 *   E1 experimentId 一意
 *   E2 同一 themeKey × changeType の pending 実験は 1 件まで (重複実験防止)
 *   E3 baseline 必須 / verdict enum / verdict 確定時は result + evidenceRefs 必須
 *
 * Usage:
 *   node .claude/scripts/themes/validate-theme-state.mjs            # 人間向け (violation で exit 1)
 *   node .claude/scripts/themes/validate-theme-state.mjs --json     # CI 向け JSON (violation で exit 1)
 *   STATE_DIR=<dir> CATALOG_INDEX=<file> ... (fixture テスト用の上書き)
 *
 * ファイルが両方とも未生成 (PR-2 前) は skip 扱いで exit 0。
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const STATE_DIR = process.env.STATE_DIR || path.join(PROJECT_ROOT, ".claude/state/themes");
const CATALOG_INDEX =
  process.env.CATALOG_INDEX || path.join(PROJECT_ROOT, "packages/data-configs/src/theme-catalog/index.ts");
const jsonMode = process.argv.includes("--json");

const LIFECYCLE = new Set([
  "keep", "improve", "merge-candidate", "split-candidate",
  "rename-candidate", "retire-candidate", "insufficient-data",
]);
const REVIEW_STATUS = new Set(["reviewed", "review-missing", "stale"]);
const CATALOG_STATUS = new Set(["catalog", "legacy"]);
const METRIC_STATUS = new Set(["measured", "measured-low", "insufficient-data", "not-instrumented"]);
// measured-low で保存を許可するカウント値 (比率値は標本不足でノイズ支配のため禁止 — README §判定規律)
const MEASURED_LOW_COUNT_FIELDS = {
  gsc: new Set(["clicks", "impressions"]),
  ga4: new Set(["pageViews"]),
};
const VERDICT = new Set([
  "pending", "effect-full", "effect-partial", "effect-none",
  "effect-adverse", "insufficient-data", "aborted",
]);
const CHANGE_TYPE = new Set([
  "catalog-metrics", "catalog-charts", "copy", "structure", "merge", "split", "rename", "retire",
]);
const CANDIDATE_STATUSES = new Set([
  "merge-candidate", "split-candidate", "rename-candidate", "retire-candidate",
]);
const HARD_CANDIDATES = new Set(["merge-candidate", "retire-candidate"]);

/** THEME_CATALOGS 登録キーを index.ts のオブジェクトリテラルから決定的に抽出する */
function catalogKeys() {
  if (!fs.existsSync(CATALOG_INDEX)) return null; // fixture 等で無い場合は照合 skip
  const src = fs.readFileSync(CATALOG_INDEX, "utf8");
  const block = src.match(/THEME_CATALOGS[^=]*=\s*{([\s\S]*?)}\s*;/);
  if (!block) return null;
  return new Set([...block[1].matchAll(/"([a-z0-9-]+)"\s*:/g)].map((m) => m[1]));
}

function loadJson(file) {
  const p = path.join(STATE_DIR, file);
  if (!fs.existsSync(p)) return { data: null, exists: false };
  try {
    return { data: JSON.parse(fs.readFileSync(p, "utf8")), exists: true };
  } catch (e) {
    return { data: null, exists: true, parseError: String(e.message).split("\n")[0] };
  }
}

const violations = [];
const warnings = [];
const v = (code, msg) => violations.push(`[${code}] ${msg}`);
const w = (code, msg) => warnings.push(`[${code}] ${msg}`);

// ---------- portfolio.json ----------
function validatePortfolio(pf) {
  if (!Array.isArray(pf.themes)) { v("P0", "portfolio.themes が配列でない"); return; }
  const keys = new Set();
  const registered = catalogKeys();
  for (const t of pf.themes) {
    const k = t.themeKey;
    if (!k || typeof k !== "string") { v("P1", "themeKey 欠落エントリあり"); continue; }
    if (keys.has(k)) v("P1", `themeKey 重複: ${k}`);
    keys.add(k);
    if (!CATALOG_STATUS.has(t.catalogStatus)) v("P1", `${k}: catalogStatus 不正 (${t.catalogStatus})`);
    if (!LIFECYCLE.has(t.lifecycleStatus)) v("P1", `${k}: lifecycleStatus 不正 (${t.lifecycleStatus})`);
    if (t.reviewStatus !== undefined && !REVIEW_STATUS.has(t.reviewStatus))
      v("P1", `${k}: reviewStatus 不正 (${t.reviewStatus})`);

    // P2: ThemeCatalog 登録状況との一致
    if (registered) {
      const inCatalog = registered.has(k);
      if (inCatalog && t.catalogStatus !== "catalog")
        v("P2", `${k}: THEME_CATALOGS 登録済みだが catalogStatus=${t.catalogStatus}`);
      if (!inCatalog && t.catalogStatus === "catalog")
        v("P2", `${k}: THEME_CATALOGS 未登録なのに catalogStatus=catalog`);
    }

    // P3: 候補判定は根拠 >= 2
    if (CANDIDATE_STATUSES.has(t.lifecycleStatus)) {
      const refs = Array.isArray(t.evidenceRefs) ? t.evidenceRefs.filter(Boolean) : [];
      if (refs.length < 2)
        v("P3", `${k}: ${t.lifecycleStatus} には evidenceRefs >= 2 が必須 (現在 ${refs.length})`);
    }

    // P4: merge/retire は GSC/GA4 両方が「集計済み」(measured | measured-low) かつ 56 日以上が必須
    if (HARD_CANDIDATES.has(t.lifecycleStatus)) {
      const aggregated = (m) => m && (m.status === "measured" || m.status === "measured-low") && m.windowDays >= 56;
      if (!aggregated(t.metrics?.gsc) || !aggregated(t.metrics?.ga4)) {
        v("P4", `${k}: ${t.lifecycleStatus} には GSC/GA4 両方の集計済み (measured|measured-low) かつ windowDays>=56 が必須` +
          ` (未集計=データ不足を需要不足と混同した廃止判定の禁止)`);
      }
    }

    // P5: status ごとの許可数値フィールド (推測値・標本不足比率の混入防止)
    for (const [name, m] of Object.entries(t.metrics ?? {})) {
      if (!m || typeof m !== "object") continue;
      if (!METRIC_STATUS.has(m.status)) { v("P5", `${k}: metrics.${name}.status 不正 (${m.status})`); continue; }
      if (m.status === "measured") continue; // 制限なし
      const numeric = Object.entries(m).filter(([kk, vv]) => kk !== "windowDays" && typeof vv === "number");
      if (m.status === "measured-low") {
        const allowed = MEASURED_LOW_COUNT_FIELDS[name] ?? new Set();
        const banned = numeric.filter(([kk]) => !allowed.has(kk));
        if (banned.length > 0)
          v("P5", `${k}: metrics.${name} は measured-low なのに比率/非カウント値 (${banned.map(([kk]) => kk).join(",")}) を持つ — 標本不足の比率値は保存禁止`);
      } else if (numeric.length > 0) {
        v("P5", `${k}: metrics.${name} は ${m.status} なのに数値 (${numeric.map(([kk]) => kk).join(",")}) を持つ — 推測値を保存しない`);
      }
    }

    if (t.reviewStatus === "review-missing") w("P6", `${k}: レビュー文書なし`);
  }
  // 登録済みテーマの取りこぼし
  if (registered) {
    for (const k of registered) if (!keys.has(k)) v("P2", `THEME_CATALOGS の ${k} が portfolio に無い`);
  }
}

// ---------- experiments.json ----------
function validateExperiments(ex) {
  if (!Array.isArray(ex.experiments)) { v("E0", "experiments.experiments が配列でない"); return; }
  const ids = new Set();
  const pendingPairs = new Map();
  for (const e of ex.experiments) {
    const id = e.experimentId;
    if (!id) { v("E1", "experimentId 欠落エントリあり"); continue; }
    if (ids.has(id)) v("E1", `experimentId 重複: ${id}`);
    ids.add(id);
    if (!e.themeKey) v("E1", `${id}: themeKey 欠落`);
    if (!CHANGE_TYPE.has(e.changeType)) v("E1", `${id}: changeType 不正 (${e.changeType})`);
    if (!VERDICT.has(e.verdict)) v("E3", `${id}: verdict 不正 (${e.verdict})`);

    // E3: baseline 必須
    if (!e.baseline || typeof e.baseline !== "object" || Object.keys(e.baseline).length === 0)
      v("E3", `${id}: baseline 欠落 — 効果測定不能な実験は登録不可`);

    // E3: 確定 verdict は result + evidenceRefs 必須
    if (e.verdict?.startsWith("effect-")) {
      if (!e.result) v("E3", `${id}: verdict=${e.verdict} なのに result が無い`);
      const refs = Array.isArray(e.evidenceRefs) ? e.evidenceRefs.filter(Boolean) : [];
      if (refs.length < 1) v("E3", `${id}: verdict 確定には evidenceRefs >= 1 が必須`);
    }

    // E2: 同一 theme × changeType の pending は 1 件まで
    if (e.verdict === "pending") {
      const pair = `${e.themeKey}::${e.changeType}`;
      if (pendingPairs.has(pair))
        v("E2", `重複実験: ${pair} の pending が複数 (${pendingPairs.get(pair)}, ${id})`);
      pendingPairs.set(pair, id);
    }
  }
}

// ---------- main ----------
const pf = loadJson("portfolio.json");
const ex = loadJson("experiments.json");

if (pf.parseError) v("P0", `portfolio.json parse 失敗: ${pf.parseError}`);
if (ex.parseError) v("E0", `experiments.json parse 失敗: ${ex.parseError}`);
if (pf.data) validatePortfolio(pf.data);
if (ex.data) validateExperiments(ex.data);

const skipped = !pf.exists && !ex.exists;
const result = {
  stateDir: STATE_DIR,
  portfolioExists: pf.exists,
  experimentsExists: ex.exists,
  themes: pf.data?.themes?.length ?? 0,
  experiments: ex.data?.experiments?.length ?? 0,
  violations,
  warnings,
};

if (jsonMode) {
  console.log(JSON.stringify(result, null, 2));
} else if (skipped) {
  console.log("theme state 未生成 (PR-2 前) — skip");
} else {
  console.log(`themes: ${result.themes} / experiments: ${result.experiments}`);
  violations.forEach((x) => console.log("✗", x));
  warnings.forEach((x) => console.log("⚠", x));
  if (violations.length === 0) console.log("✓ theme state 違反なし");
}
process.exit(violations.length > 0 ? 1 : 0);
