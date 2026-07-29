/**
 * 正規化スナップショットの **値域ゲート定義 (単一ソース)**。
 *
 * writer (`generate-ranking-normalized-values.ts`) が push 前に、週次 audit
 * (`audit-ranking-data-integrity.ts`) が live に対して、**同じ定義**で検査する。
 *
 * ## なぜ必要か (2026-07-29)
 *
 * `values-per-area.json` が 100 倍過大なまま 2 ヶ月配信されていた。原因は分母
 * (総面積) が 100km² 単位なのに km² とみなして除算していたこと。件数や実在チェックでは
 * 「値が桁違い」を検出できないため、**実測に基づく期待レンジ**を機械ゲートにする。
 *
 * ## レンジの決め方
 *
 * 推測値を書かない。総務省・e-Stat の公表値から導いた実測値に、年変動を吸収する幅を持たせる:
 *
 * - 東京都: 人口 ≒ 1,350〜1,420 万人 / 面積 ≒ 2,194km² → 人口密度 ≒ 6,150〜6,470 人/km²
 *   = 615,000〜647,000 人/100km²。レンジ [5.5e5, 7.0e5] は上下に約 1 割の余裕。
 * - 北海道: 人口 ≒ 500〜538 万人 / 面積 ≒ 83,421km² → ≒ 60〜65 人/km²
 *   = 6,000〜6,500 人/100km²。レンジ [4.0e3, 1.0e4]。
 *
 * 100 倍ズレれば必ず外れる幅で、正常な年変動では絶対に外れない幅にしてある。
 */

export interface NormalizedFixtureGate {
  /** 検査対象の ranking key */
  rankingKey: string;
  /** 検査対象の正規化タイプ */
  normType: "per_population" | "per_area";
  /** 検査対象の地域コード */
  areaCode: string;
  /** 人が読むための地域名 (エラーメッセージ用) */
  areaName: string;
  /** 許容レンジ [min, max] (両端含む) */
  range: readonly [number, number];
  /** レンジ根拠 (実測の出所)。推測で書かないこと */
  rationale: string;
}

export const NORMALIZED_FIXTURE_GATES: readonly NormalizedFixtureGate[] = [
  {
    rankingKey: "total-population",
    normType: "per_area",
    areaCode: "13000",
    areaName: "東京都",
    range: [5.5e5, 7.0e5],
    rationale:
      "人口 1,350〜1,420 万人 / 面積 2,194km² → 6,150〜6,470 人/km² = 61.5〜64.7 万人/100km²",
  },
  {
    rankingKey: "total-population",
    normType: "per_area",
    areaCode: "01000",
    areaName: "北海道",
    range: [4.0e3, 1.0e4],
    rationale:
      "人口 500〜538 万人 / 面積 83,421km² → 60〜65 人/km² = 6,000〜6,500 人/100km²",
  },
];

export interface FixtureCheckInput {
  rankingKey: string;
  normType: string;
  /** 検査対象年の値 (areaCode → value) */
  valuesByAreaCode: ReadonlyMap<string, number | null>;
  /** エラーメッセージに載せる年 */
  yearCode: string;
}

export interface FixtureViolation {
  rankingKey: string;
  normType: string;
  areaCode: string;
  areaName: string;
  yearCode: string;
  actual: number | null;
  range: readonly [number, number];
  rationale: string;
  message: string;
}

/**
 * 1 つの (key, normType, 年) に対して該当する fixture ゲートを検査する。
 *
 * 該当ゲートが無ければ空配列 (検査対象外)。値が欠落している場合も違反として報告する
 * (「生成されたが対象県が落ちている」を見逃さないため)。
 */
export function checkFixtureGates(input: FixtureCheckInput): FixtureViolation[] {
  const gates = NORMALIZED_FIXTURE_GATES.filter(
    (g) => g.rankingKey === input.rankingKey && g.normType === input.normType,
  );

  const violations: FixtureViolation[] = [];
  for (const gate of gates) {
    const actual = input.valuesByAreaCode.get(gate.areaCode) ?? null;
    const [min, max] = gate.range;
    const ok = actual !== null && Number.isFinite(actual) && actual >= min && actual <= max;
    if (ok) continue;

    violations.push({
      rankingKey: gate.rankingKey,
      normType: gate.normType,
      areaCode: gate.areaCode,
      areaName: gate.areaName,
      yearCode: input.yearCode,
      actual,
      range: gate.range,
      rationale: gate.rationale,
      message:
        actual === null
          ? `${gate.rankingKey} (${gate.normType}) ${gate.areaName} ${input.yearCode}: 値が存在しない (期待レンジ ${min}〜${max})`
          : `${gate.rankingKey} (${gate.normType}) ${gate.areaName} ${input.yearCode}: 実測 ${actual} が期待レンジ ${min}〜${max} の外 (根拠: ${gate.rationale})`,
    });
  }
  return violations;
}

/** fixture ゲートが対象にしている ranking key の集合 (writer の先行検査用) */
export function fixtureGateRankingKeys(): string[] {
  return [...new Set(NORMALIZED_FIXTURE_GATES.map((g) => g.rankingKey))];
}
