/**
 * engine — effect ラベルを閾値だけで決める純粋関数。
 *
 * 正典: `.claude/rules/evidence-based-judgment.md` §状況 1「閾値エンジン経由の確定」。
 *
 * **制約 (これを破ると推測が混入する)**:
 * - engine は「観測差分」と「閾値の比較」だけを出力する。原因・外部システムの仕様・
 *   次の打ち手を出力してはならない (それは人間 / triage の仕事)。
 * - 閾値は必ず引数の thresholds から読む。リテラルを書かない (thresholds.mjs が SSOT)。
 * - ガードが 1 つでも hit したら `effect/pending` を返す。これは人間ゲートの復活ではなく
 *   「閾値ルールが判定不能と宣言している状態」で、`guards[]` がその記録である。
 * - 統計的有意性は扱わない (週次 snapshot は各 1 点で分散が取れない)。
 */

import { DEFAULT_THRESHOLDS } from "./thresholds.mjs";
import { classifyAge, worstFreshness } from "../../search-growth/lib/freshness.mjs";
import { weekDiff, weekIndex } from "./iso-week.mjs";

/** 確定ラベルと保留ラベル。improvement-log / backlog の status 語彙と一致させる。 */
export const LABELS = Object.freeze({
  full: "effect/full",
  partial: "effect/partial",
  none: "effect/none",
  adverse: "effect/adverse",
  pending: "effect/pending",
});

/** ガードコード (4 種固定)。増やすときは rules と verdict JSON の読み手を同時に直す。 */
export const GUARD_CODES = Object.freeze([
  "insufficient-sample",
  "stale-source",
  "confounded",
  "insufficient-target",
]);

/**
 * 施策 1 件の effect ラベルを決める。
 *
 * @param {object} input
 * @param {{value:number, impressions?:number|null}} input.before  判定対象指標の before 実測
 * @param {{value:number, impressions?:number|null}} input.after   after 実測
 * @param {number|null} input.target  想定 delta (符号付き)。取れないなら null
 * @param {{beforeWeek?:string, afterWeek?:string, elapsedWeeks?:number|null, notDue?:boolean}} [input.window]
 * @param {Array<{name:string, observedAt?:string|null, freshness?:string|null, status?:string|null}>} [input.sources]
 * @param {{coDeployed?:string[], laterContaminators?:string[]}} [input.confounders]
 * @param {string} [input.now] ISO 日時 (鮮度判定の基準。テストで固定する)
 * @param {object} [thresholds]
 * @returns {{label:string, reason:string, guards:Array<{code:string,detail:string}>,
 *   attainment:number|null, evidence:object, thresholdsVersion:string}}
 */
export function decideVerdict(input, thresholds = DEFAULT_THRESHOLDS) {
  const t = thresholds;
  const before = normalizePoint(input?.before);
  const after = normalizePoint(input?.after);
  const target = Number.isFinite(input?.target) ? Number(input.target) : null;
  const win = input?.window ?? {};
  const sources = Array.isArray(input?.sources) ? input.sources : [];
  const conf = input?.confounders ?? {};
  const now = input?.now;

  const delta = round(after.value - before.value, 6);
  const relativeDelta = relativeChange(before.value, delta);
  const attainment = target != null && target !== 0 ? round(delta / target, 4) : null;

  const sourceFreshness = sources.map((s) => ({
    name: s.name,
    observedAt: s.observedAt ?? null,
    freshness:
      s.freshness ??
      (s.observedAt
        ? classifyAge({ observedAt: s.observedAt, now, staleAfterDays: t.freshness.maxSourceAgeDays })
        : "missing"),
  }));

  const guards = [];

  // ── guard 1: 想定効果値が無い / まだ判定窓に達していない ───────────────
  const elapsed = Number.isFinite(win.elapsedWeeks)
    ? Number(win.elapsedWeeks)
    : win.beforeWeek && win.afterWeek
      ? weekDiff(win.beforeWeek, win.afterWeek)
      : null;
  if (win.notDue === true || (elapsed != null && elapsed < t.window.minWeeks)) {
    guards.push({
      code: "insufficient-target",
      detail: `判定窓が不足 (経過 ${elapsed ?? "?"} 週 < window.minWeeks ${t.window.minWeeks})`,
    });
  } else if (target == null || target === 0) {
    guards.push({
      code: "insufficient-target",
      detail: "想定効果値 (target delta) が機械可読な形で登録されていない",
    });
  }

  // ── guard 2: 標本不足 / noise floor ───────────────────────────────────
  const sampleIssues = [];
  if (before.impressions != null && before.impressions < t.sample.minImpressionsBefore) {
    sampleIssues.push(
      `before imp ${before.impressions} < sample.minImpressionsBefore ${t.sample.minImpressionsBefore}`,
    );
  }
  if (after.impressions != null && after.impressions < t.sample.minImpressionsAfter) {
    sampleIssues.push(
      `after imp ${after.impressions} < sample.minImpressionsAfter ${t.sample.minImpressionsAfter}`,
    );
  }
  if (relativeDelta != null && Math.abs(relativeDelta) < t.sample.minRelativeDelta) {
    sampleIssues.push(
      `相対変化 ${fmtPct(relativeDelta)} < sample.minRelativeDelta ${fmtPct(t.sample.minRelativeDelta)}`,
    );
  }
  if (sampleIssues.length > 0) {
    guards.push({ code: "insufficient-sample", detail: sampleIssues.join(" / ") });
  }

  // ── guard 3: 根拠 source の鮮度 ───────────────────────────────────────
  const worst = worstFreshness(sourceFreshness.map((s) => s.freshness));
  if (sourceFreshness.length > 0 && worst !== "fresh") {
    const bad = sourceFreshness.filter((s) => s.freshness !== "fresh");
    guards.push({
      code: "stale-source",
      detail:
        `根拠 source が ${worst} (freshness.maxSourceAgeDays ${t.freshness.maxSourceAgeDays}日): ` +
        bad.map((s) => `${s.name}=${s.freshness}@${s.observedAt ?? "none"}`).join(", "),
    });
  }

  // ── guard 4: 交絡 ─────────────────────────────────────────────────────
  const coDeployed = conf.coDeployed ?? [];
  const laterContaminators = conf.laterContaminators ?? [];
  if (coDeployed.length > 0 || laterContaminators.length > 0) {
    const parts = [];
    if (coDeployed.length) parts.push(`同時投入: ${coDeployed.join(", ")}`);
    if (laterContaminators.length) parts.push(`after 窓の後発投入: ${laterContaminators.join(", ")}`);
    guards.push({ code: "confounded", detail: parts.join(" / ") });
  }

  const evidence = {
    before,
    after,
    delta,
    relativeDelta,
    target,
    attainment,
    window: {
      beforeWeek: win.beforeWeek ?? null,
      afterWeek: win.afterWeek ?? null,
      elapsedWeeks: elapsed,
      minWeeks: t.window.minWeeks,
    },
    sources: sourceFreshness,
    confounders: { coDeployed, laterContaminators },
  };

  // 判定に使った境界値を verdict に焼く (custom thresholds でも報告が嘘にならない)
  const boundaries = {
    attainmentFull: t.attainment.full,
    attainmentPartial: t.attainment.partial,
    adverseRelativeDrop: t.adverse.relativeDrop,
  };

  if (guards.length > 0) {
    return {
      label: LABELS.pending,
      reason: `ガード ${guards.map((g) => g.code).join(", ")} により判定不能`,
      guards,
      attainment,
      evidence,
      boundaries,
      thresholdsVersion: t.version,
    };
  }

  // ── 確定 (adverse → full → partial → none の順) ─────────────────────
  if (relativeDelta != null && relativeDelta <= t.adverse.relativeDrop) {
    return verdict(LABELS.adverse, `相対変化 ${fmtPct(relativeDelta)} ≤ adverse.relativeDrop ${fmtPct(t.adverse.relativeDrop)}`);
  }
  if (attainment != null && attainment >= t.attainment.full) {
    return verdict(LABELS.full, `達成率 ${fmtPct(attainment)} ≥ attainment.full ${fmtPct(t.attainment.full)}`);
  }
  if (attainment != null && attainment >= t.attainment.partial) {
    return verdict(LABELS.partial, `達成率 ${fmtPct(attainment)} ≥ attainment.partial ${fmtPct(t.attainment.partial)}`);
  }
  return verdict(
    LABELS.none,
    `達成率 ${attainment == null ? "算出不能" : fmtPct(attainment)} < attainment.partial ${fmtPct(t.attainment.partial)}`,
  );

  function verdict(label, reason) {
    return { label, reason, guards, attainment, evidence, boundaries, thresholdsVersion: t.version };
  }
}

/**
 * 同一計測窓の交絡を検出する (元実装は measure-adsense-impact.mjs にあったものを移設)。
 *
 * - coDeployed: deploy 週が ±`confounding.coDeployWeeks` 以内の別施策 = 同時投入
 * - laterContaminators: deploy 週より後で after 週以前に投入された別施策 = after 窓の汚染
 *
 * @param {{subject:{id:string, deployWeek:string}, siblings:Array<{id:string, deployWeek:string}>, afterWeek?:string|null}} p
 * @param {object} [thresholds]
 */
export function detectConfounders({ subject, siblings = [], afterWeek = null }, thresholds = DEFAULT_THRESHOLDS) {
  const self = weekIndex(subject.deployWeek);
  const gap = thresholds.confounding.coDeployWeeks;
  const coDeployed = siblings
    .filter((o) => o.id !== subject.id && Math.abs(weekIndex(o.deployWeek) - self) <= gap)
    .map((o) => o.id);
  const laterContaminators = !afterWeek
    ? []
    : siblings
        .filter(
          (o) =>
            o.id !== subject.id &&
            weekIndex(o.deployWeek) > self &&
            weekIndex(o.deployWeek) <= weekIndex(afterWeek),
        )
        .map((o) => `${o.id}@${o.deployWeek}`);
  return { coDeployed, laterContaminators };
}

/**
 * 施策の説明文から deploy 日を抽出する (元実装は measure-adsense-impact.mjs)。
 * 「slotId 記入待ち」等の未稼働表現は null を返す (未デプロイを deploy と誤認しない)。
 * @param {string} text
 * @returns {string|null} "YYYY-MM-DD"
 */
export function extractDeployDate(text) {
  const s = String(text ?? "");
  if (/未デプロイ|空文字の間は非描画|slotId を記入/.test(s)) return null;
  const m = s.match(/(?:deployed|デプロイ済?|実装済)\s*[（(:：]?\s*(20\d\d-\d\d-\d\d)/i);
  return m ? m[1] : null;
}

/**
 * 施策の説明文から機械可読な想定効果値を抽出する。
 * 形式は `[target: +100 clicks]` / `[target: -0.15]` に限定する。
 * **散文からの推測は行わない** — 取れなければ null を返し、engine が
 * `insufficient-target` で pending に留める (数値の捏造を構造的に防ぐ)。
 * @param {string} text
 * @returns {{value:number, unit:string|null}|null}
 */
export function extractTarget(text) {
  const m = String(text ?? "").match(/\[target:\s*([+-]?\d+(?:\.\d+)?)\s*([^\]]*)\]/i);
  if (!m) return null;
  const value = Number(m[1]);
  if (!Number.isFinite(value)) return null;
  const unit = m[2].trim() || null;
  return { value, unit };
}

/**
 * improvement-log の `### 判定` セクション (5 行) を組み立てる。
 * 判定・根拠データ・閾値 SSOT・ガード・再現コマンドを必ず全部出す。
 * すべて実測値と閾値の引用なので NG ワード表と矛盾しない。
 * @param {object} v decideVerdict の戻り値
 * @param {{subjectId:string, metricLabel?:string, reproduceCommand:string}} p
 */
export function formatVerdictSection(v, { subjectId, metricLabel = "指標", reproduceCommand, decidedAt = null }) {
  const e = v.evidence;
  const b = v.boundaries;
  const guardText =
    v.guards.length === 0
      ? "なし (4 ガードすべて通過)"
      : v.guards.map((g) => `${g.code} (${g.detail})`).join(" / ");
  const targetText =
    e.target == null
      ? "想定値未登録"
      : `想定 ${signed(e.target)} / 達成率 ${e.attainment == null ? "—" : fmtPct(e.attainment)}`;
  const lines = [
    "### 判定",
    "",
    `- **[判定] ${v.label}** — ${v.reason}`,
    `- **[根拠データ]** ${metricLabel} ${fmtNum(e.before.value)}→${fmtNum(e.after.value)} (delta ${signed(e.delta)}` +
      `${e.relativeDelta == null ? "" : ` / 相対 ${fmtPct(e.relativeDelta)}`} / ${targetText})` +
      ` / window ${e.window.beforeWeek ?? "?"}→${e.window.afterWeek ?? "?"} (${e.window.elapsedWeeks ?? "?"} 週)`,
    `- **[閾値 SSOT]** \`.claude/scripts/lib/effect-verdict/thresholds.mjs\` v${v.thresholdsVersion}` +
      ` (full ≥ ${fmtPct(b.attainmentFull)} / partial ≥ ${fmtPct(b.attainmentPartial)} / adverse ≤ ${fmtPct(b.adverseRelativeDrop)})`,
    `- **[ガード]** ${guardText}`,
    `- **[再現コマンド]** \`${reproduceCommand}\``,
    `- **[subject]** ${subjectId} / 判定日 ${decidedAt ?? new Date().toISOString().slice(0, 10)} (自動: effect-verdict engine)`,
  ];
  return lines.join("\n") + "\n";
}

// ── helpers ────────────────────────────────────────────────────────────

function normalizePoint(p) {
  const value = Number(p?.value);
  const imp = p?.impressions;
  return {
    value: Number.isFinite(value) ? value : 0,
    impressions: imp == null || !Number.isFinite(Number(imp)) ? null : Number(imp),
  };
}

/** before 比の相対変化。before が 0 なら比が定義できないので ±Infinity / 0 を返す。 */
function relativeChange(beforeValue, delta) {
  if (!Number.isFinite(beforeValue)) return null;
  if (beforeValue === 0) return delta === 0 ? 0 : delta > 0 ? Infinity : -Infinity;
  return round(delta / Math.abs(beforeValue), 6);
}

function round(x, d) {
  const m = 10 ** d;
  return Math.round((x + Number.EPSILON) * m) / m;
}
function fmtPct(x) {
  if (x == null) return "—";
  if (!Number.isFinite(x)) return x > 0 ? "+∞%" : "-∞%";
  return `${(x * 100).toFixed(1)}%`;
}
function fmtNum(x) {
  return Number.isInteger(x) ? String(x) : Number(x).toFixed(2);
}
function signed(x) {
  if (x == null) return "—";
  return `${x >= 0 ? "+" : ""}${fmtNum(x)}`;
}
