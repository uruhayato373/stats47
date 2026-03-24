import { describe, expect, it } from "vitest";
import {
  isExcludedCorrelationPair,
  isExcludedCorrelationKey,
} from "../trivial-pairs";

// ---------------------------------------------------------------------------
// isExcludedCorrelationPair
// ---------------------------------------------------------------------------
describe("isExcludedCorrelationPair", () => {
  // --- Explicit pair exclusion (EXCLUDED_PAIRS) ---

  it("should detect excluded pair in forward order", () => {
    expect(
      isExcludedCorrelationPair(
        "ssdse-f-elevation",
        "ssdse-f-pressure-local"
      )
    ).toBe(true);
  });

  it("should detect excluded pair in reverse order", () => {
    expect(
      isExcludedCorrelationPair(
        "ssdse-f-pressure-local",
        "ssdse-f-elevation"
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
      isExcludedCorrelationPair("average-temperature", "ssdse-f-avg-temp")
    ).toBe(true);
  });

  it("should detect within-group pairs (temperature group, reverse)", () => {
    expect(
      isExcludedCorrelationPair("ssdse-f-avg-temp", "average-temperature")
    ).toBe(true);
  });

  it("should detect within-group pairs for non-adjacent group members", () => {
    // First and last element of temperature group
    expect(
      isExcludedCorrelationPair(
        "average-temperature",
        "ssdse-f-vapor-pressure"
      )
    ).toBe(true);
  });

  it("should detect within-group pairs (snowfall group)", () => {
    expect(
      isExcludedCorrelationPair(
        "ssdse-f-max-snow-depth",
        "ssdse-f-snow-days"
      )
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
    // One from temperature group, one from snowfall group
    expect(
      isExcludedCorrelationPair(
        "average-temperature",
        "ssdse-f-max-snow-depth"
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
