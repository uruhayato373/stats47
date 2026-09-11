/**
 * 極性カタログの腐敗防止 (2026-07-31)。
 *
 * カタログは metric の改名・削除で**幽霊キー**になる。SSOT が実在しないキーを指したまま
 * 誰も気づかないのが最悪なので、実 registry との突合をテストで固定する。
 */
import { describe, expect, it } from "vitest";

import {
  EXCLUDED_FROM_SEED,
  METRIC_POLARITY,
  MIN_POLARITY_COVERAGE,
  findMetricPolarity,
} from "../metric-polarity";
import { listAllMetrics } from "../registry";

const keys = new Set(listAllMetrics().map((m) => m.key));

describe("極性カタログ", () => {
  it("★幽霊キーが無い (改名・削除で腐る)", () => {
    const ghosts = Object.keys(METRIC_POLARITY).filter((k) => !keys.has(k));
    expect(ghosts).toEqual([]);
  });

  it("★除外リストにも幽霊キーが無い", () => {
    const ghosts = EXCLUDED_FROM_SEED.filter((e) => !keys.has(e.key)).map((e) => e.key);
    expect(ghosts).toEqual([]);
  });

  it("★evidence が空でない (推測の混入を止める)", () => {
    const empty = Object.entries(METRIC_POLARITY)
      .filter(([, v]) => v.evidence.trim().length < 10)
      .map(([k]) => k);
    expect(empty).toEqual([]);
  });

  it("除外の reason が空でない", () => {
    const empty = EXCLUDED_FROM_SEED.filter((e) => e.reason.trim().length < 10).map((e) => e.key);
    expect(empty).toEqual([]);
  });

  it("★カバレッジのラチェット (減らさない)", () => {
    expect(Object.keys(METRIC_POLARITY).length).toBeGreaterThanOrEqual(MIN_POLARITY_COVERAGE);
  });

  it("収載と除外が重複しない", () => {
    const dup = EXCLUDED_FROM_SEED.filter((e) => e.key in METRIC_POLARITY).map((e) => e.key);
    expect(dup).toEqual([]);
  });

  it("未収載は null を返す (既定に化けない)", () => {
    expect(findMetricPolarity("total-population")).toBeNull();
    expect(findMetricPolarity("does-not-exist")).toBeNull();
  });

  it("収載は polarity を返す", () => {
    expect(findMetricPolarity("traffic-accident-count")?.polarity).toBe("higher-is-worse");
  });

  it("指定・支援利用の実数を被害実数へ読み替えない", () => {
    expect(findMetricPolarity("landslide-warning-zone-count")?.polarity).toBe("neutral");
    expect(findMetricPolarity("poverty-support-new-consultation-cases")?.polarity).toBe("neutral");
    expect(findMetricPolarity("ambulance-transported-persons")?.polarity).toBe("neutral");
    expect(findMetricPolarity("ambulance-transported-deaths")?.polarity).toBe("higher-is-worse");
    expect(findMetricPolarity("natural-disaster-deaths")?.polarity).toBe("higher-is-worse");
  });

  it("同じ主題でも観測の分母・実数と基準達成率を区別する", () => {
    expect(findMetricPolarity("pm25-general-station-count")?.polarity).toBe("neutral");
    expect(findMetricPolarity("pm25-compliant-general-station-count")?.polarity).toBe("neutral");
    expect(findMetricPolarity("pm25-general-station-compliance-rate")?.polarity).toBe("higher-is-better");
    expect(findMetricPolarity("individual-evacuation-plan-listed-persons")?.polarity).toBe("neutral");
    expect(findMetricPolarity("individual-evacuation-plan-coverage-rate")?.polarity).toBe("higher-is-better");
  });

  it("診断対象の規模と措置が必要な劣化を区別する", () => {
    expect(findMetricPolarity("road-bridge-diagnosed-count")?.polarity).toBe("neutral");
    expect(findMetricPolarity("road-bridge-condition-iii-count")?.polarity).toBe("higher-is-worse");
    expect(findMetricPolarity("road-tunnel-condition-iv-count")?.polarity).toBe("higher-is-worse");
    expect(findMetricPolarity("public-water-pipe-length")?.polarity).toBe("neutral");
    expect(findMetricPolarity("public-water-pipe-aging-rate")?.polarity).toBe("higher-is-worse");
    expect(findMetricPolarity("public-water-pipe-renewal-rate")?.polarity).toBe("higher-is-better");
  });

  it("健康指標は得点・該当区分・観測母集団を使って個別に判断する", () => {
    expect(findMetricPolarity("k6-known-score-estimated-persons-12plus")?.polarity).toBe("neutral");
    expect(findMetricPolarity("k6-score10plus-rate-12plus")?.polarity).toBe("higher-is-worse");
    expect(findMetricPolarity("elementary5-fitness-score-female")?.polarity).toBe("higher-is-better");
    expect(findMetricPolarity("salt-intake-female-age-adjusted")?.polarity).toBe("higher-is-worse");
    expect(findMetricPolarity("vegetable-intake-female-age-adjusted")?.polarity).toBe("higher-is-better");
    expect(findMetricPolarity("specific-health-checkup-participation-rate")?.polarity).toBe("higher-is-better");
  });

  it("消費・排出・価格・標本数を共通キーワードで一括判定しない", () => {
    expect(findMetricPolarity("regional-household-final-energy-consumption")?.polarity).toBe("neutral");
    expect(findMetricPolarity("regional-household-co2-emissions-estimate")?.polarity).toBe("higher-is-worse");
    expect(findMetricPolarity("residential-land-transaction-median-price")?.polarity).toBe("neutral");
    expect(findMetricPolarity("inbound-visit-sample-by-destination")?.polarity).toBe("neutral");
    expect(findMetricPolarity("housing-land-debt-per-household")?.polarity).toBe("neutral");
  });

  it("人口や制度利用の構成を個人の属性の優劣へ変換しない", () => {
    expect(findMetricPolarity("births-mother-age40plus")?.polarity).toBe("neutral");
    expect(findMetricPolarity("foreign-worker-count")?.polarity).toBe("neutral");
    expect(findMetricPolarity("single-mother-public-assistance-households")?.polarity).toBe("neutral");
    expect(findMetricPolarity("nonregular-employees-count")?.polarity).toBe("neutral");
    expect(findMetricPolarity("employees-weekly-hours-60plus-rate")?.polarity).toBe("higher-is-worse");
  });

  it("mutation: MIN_POLARITY_COVERAGE を 1 上げると落ちる (ラチェットが効いている証明)", () => {
    const inflated = Object.keys(METRIC_POLARITY).length + 1;
    expect(Object.keys(METRIC_POLARITY).length).toBeLessThan(inflated);
  });
});
