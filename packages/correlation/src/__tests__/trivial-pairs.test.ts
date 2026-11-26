import { describe, expect, it } from "vitest";
import {
  isExcludedCorrelationPair,
  isExcludedCorrelationKey,
} from "../trivial-pairs";

// ---------------------------------------------------------------------------
// isExcludedCorrelationPair
// ---------------------------------------------------------------------------
describe("isExcludedCorrelationPair", () => {
  it("家計調査の同じ品目の支出額と購入数量は自明な組として外し、別の品目の組は残す", () => {
    expect(isExcludedCorrelationPair("kerosene-consumption-expenditure", "kerosene-consumption-quantity")).toBe(true);
    expect(isExcludedCorrelationPair("kerosene-consumption-quantity", "kerosene-consumption-expenditure")).toBe(true);
    expect(isExcludedCorrelationPair("bread-consumption-expenditure", "other-bread-consumption-expenditure")).toBe(false);
    expect(isExcludedCorrelationPair("bread-consumption-quantity", "rice-consumption-quantity")).toBe(false);
  });

  // --- Explicit pair exclusion (EXCLUDED_PAIRS) ---

  it("should detect excluded pair in forward order", () => {
    expect(
      isExcludedCorrelationPair(
        "public-nursery-ratio",
        "public-nursery-student-ratio"
      )
    ).toBe(true);
  });

  it("should detect excluded pair in reverse order", () => {
    expect(
      isExcludedCorrelationPair(
        "public-nursery-student-ratio",
        "public-nursery-ratio"
      )
    ).toBe(true);
  });

  it("should detect complementary pair", () => {
    expect(
      isExcludedCorrelationPair("employed-people-ratio", "unemployment-rate")
    ).toBe(true);
    expect(
      isExcludedCorrelationPair("unemployment-rate", "employed-people-ratio")
    ).toBe(true);
  });

  it("should return false for non-excluded pair", () => {
    expect(
      isExcludedCorrelationPair("some-random-key", "another-random-key")
    ).toBe(false);
  });

  it("should return false for same key paired with itself (not in exclusion list)", () => {
    expect(
      isExcludedCorrelationPair("some-random-key", "some-random-key")
    ).toBe(false);
  });

  // --- Group-based exclusion (EXCLUDED_GROUPS) ---

  it("should detect within-group pairs (temperature group)", () => {
    // Both are in the temperature group
    expect(
      isExcludedCorrelationPair("average-temperature", "lowest-temperature")
    ).toBe(true);
  });

  it("should detect within-group pairs (temperature group, reverse)", () => {
    expect(
      isExcludedCorrelationPair("lowest-temperature", "average-temperature")
    ).toBe(true);
  });

  it("should detect within-group pairs (public assistance group)", () => {
    expect(
      isExcludedCorrelationPair(
        "persons-on-public-assistance-per-1000",
        "public-assistance-medical-beneficiaries-per-1000"
      )
    ).toBe(true);
  });

  it("should not exclude cross-group pairs", () => {
    // 気温のまとまりと住宅のまとまりから 1 つずつ
    expect(
      isExcludedCorrelationPair(
        "average-temperature",
        "detached-house-ratio"
      )
    ).toBe(false);
  });

  it("should detect within-group pairs (nursing home group)", () => {
    expect(
      isExcludedCorrelationPair(
        "nursing-home-count-per-100k-65plus",
        "nursing-home-capacity-per-1000-65plus"
      )
    ).toBe(true);
  });

  it("should detect within-group pairs (housing group)", () => {
    expect(
      isExcludedCorrelationPair(
        "detached-house-ratio",
        "apartment-ratio"
      )
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isExcludedCorrelationKey
// ---------------------------------------------------------------------------
describe("isExcludedCorrelationKey", () => {
  it("should exclude population-scale absolute keys", () => {
    expect(isExcludedCorrelationKey("total-population")).toBe(true);
  });

  it("should exclude demographic absolute keys", () => {
    expect(isExcludedCorrelationKey("births")).toBe(true);
    expect(isExcludedCorrelationKey("marriages")).toBe(true);
    expect(isExcludedCorrelationKey("death-count")).toBe(true);
  });

  it("should exclude medical absolute keys", () => {
    expect(isExcludedCorrelationKey("nurse-count")).toBe(true);
    expect(isExcludedCorrelationKey("pharmacy-count")).toBe(true);
  });

  it("should exclude economic absolute keys", () => {
    expect(isExcludedCorrelationKey("electricity-demand")).toBe(true);
    expect(isExcludedCorrelationKey("sales-amount-private")).toBe(true);
  });

  it("should exclude migration absolute keys", () => {
    expect(isExcludedCorrelationKey("movers-in")).toBe(true);
    expect(isExcludedCorrelationKey("movers-out")).toBe(true);
    expect(isExcludedCorrelationKey("japanese-movers-in")).toBe(true);
  });

  it("should exclude foreign resident absolute keys", () => {
    expect(isExcludedCorrelationKey("foreign-resident-count")).toBe(true);
    expect(isExcludedCorrelationKey("foreign-resident-count-china")).toBe(true);
  });

  it("should not exclude per-capita / rate keys", () => {
    expect(isExcludedCorrelationKey("average-temperature")).toBe(false);
    expect(isExcludedCorrelationKey("unemployment-rate")).toBe(false);
    expect(isExcludedCorrelationKey("suicide-rate-per-100k")).toBe(false);
  });

  it("should not exclude unknown keys", () => {
    expect(isExcludedCorrelationKey("nonexistent-key-xyz")).toBe(false);
  });

  it("should not exclude empty string", () => {
    expect(isExcludedCorrelationKey("")).toBe(false);
  });
});

// 一覧は台帳 data/correlation/exclusions.json が正本 (2026-11-26)。指標の実在は check-datasets の refs が検査する
describe("除外の台帳", () => {
  it("まとまりの中の隣り合わない 2 指標も除外する", async () => {
    const { default: exclusions } = await import("../../../../data/correlation/exclusions.json");
    const group = exclusions.groups.find(({ keys }) => keys.length >= 3)!;
    expect(isExcludedCorrelationPair(group.keys[0], group.keys[group.keys.length - 1])).toBe(true);
  });

  it("どの行にも理由がある", async () => {
    const { default: exclusions } = await import("../../../../data/correlation/exclusions.json");
    for (const row of [...exclusions.pairs, ...exclusions.groups, ...exclusions.keys]) expect(row.reason.length).toBeGreaterThan(0);
  });
});
