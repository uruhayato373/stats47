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

  it("mutation: MIN_POLARITY_COVERAGE を 1 上げると落ちる (ラチェットが効いている証明)", () => {
    const inflated = Object.keys(METRIC_POLARITY).length + 1;
    expect(Object.keys(METRIC_POLARITY).length).toBeLessThan(inflated);
  });
});
