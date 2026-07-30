/**
 * thresholds — effect ラベル自動確定の閾値 SSOT。
 *
 * 正典: `.claude/rules/evidence-based-judgment.md` §状況 1「閾値エンジン経由の確定」。
 * 数値は**全部ここに集約**し、engine.mjs 側にリテラルを書かない (書けば SSOT が二重化する)。
 * 形は `.claude/scripts/search-growth/lib/scoring.mjs` の `DEFAULT_CONFIG` に倣う。
 *
 * 閾値を変えるときは `version` を上げる。verdict JSON に `thresholdsVersion` が残るので、
 * 「どの境界で確定したラベルか」が後から復元できる。
 */

/** 閾値セットのバージョン。境界を変えたら必ず上げる (verdict JSON に焼かれる)。 */
export const THRESHOLDS_VERSION = "1.0.0";

/**
 * 既定閾値。
 * - attainment: 達成率 (実測 delta ÷ 想定 delta) の確定境界 = 第一基準
 * - adverse: before 比の相対低下でこれ以下なら悪化と確定
 * - sample: noise floor = 第二基準。標本が薄い / 相対変化が小さい判定は確定させない
 * - freshness: 判定根拠にした source の許容鮮度 (日)
 * - window: deploy からこの週数を経過しないと確定させない
 * - confounding: この週数以内に投入された別施策は同時投入 (交絡) とみなす
 *
 * **統計的有意性は導入しない** — 週次 snapshot は各 1 点で分散が取れず、
 * 比率検定を入れると「有意性を装った推測」になる (evidence-based-judgment.md)。
 */
export const DEFAULT_THRESHOLDS = deepFreeze({
  version: THRESHOLDS_VERSION,
  attainment: { full: 0.8, partial: 0.3 },
  adverse: { relativeDrop: -0.1 },
  sample: { minImpressionsBefore: 100, minImpressionsAfter: 100, minRelativeDelta: 0.05 },
  freshness: { maxSourceAgeDays: 10 },
  window: { minWeeks: 2 },
  confounding: { coDeployWeeks: 1 },
});

/**
 * 既定閾値に部分的な上書きを重ねた**新しい frozen セット**を返す。
 * DEFAULT_THRESHOLDS は freeze 済みなので直接代入できない (それが狙い)。
 * mutation テスト (閾値を動かして判定が変わることの確認) と将来の domain 別調整に使う。
 * @param {object} patch 上書きする部分木 (1 段のネストまで)
 * @param {object} [base]
 */
export function mergeThresholds(patch, base = DEFAULT_THRESHOLDS) {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch ?? {})) {
    out[k] = v && typeof v === "object" && !Array.isArray(v) ? { ...base[k], ...v } : v;
  }
  return deepFreeze(out);
}

function deepFreeze(obj) {
  for (const v of Object.values(obj)) {
    if (v && typeof v === "object" && !Object.isFrozen(v)) deepFreeze(v);
  }
  return Object.freeze(obj);
}
