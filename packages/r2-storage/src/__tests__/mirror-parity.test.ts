import { describe, expect, it } from "vitest";
// @ts-expect-error Generated plain-node mirror has no declaration file.
import * as mirror from "../../../../.claude/scripts/lib/r2-keys.mjs";
import * as canonical from "../keys";

describe("R2 key mirror parity", () => {
  it("exports the same constants and functions", () => {
    expect(Object.keys(mirror).sort()).toEqual(Object.keys(canonical).sort());
    expect(mirror.STATS_R2_PREFIX).toBe(canonical.STATS_R2_PREFIX);
    expect(mirror.RANKING_R2_PREFIX).toBe(canonical.RANKING_R2_PREFIX);
    expect(mirror.R2_PUBLIC_ORIGIN).toBe(canonical.R2_PUBLIC_ORIGIN);
  });

  it("returns identical keys for all kinds and valid segment boundaries", () => {
    for (const key of ["population", "population-2025", "x", "2025", "a-1-b"]) {
      for (const kind of ["item", "values", "values-per-population", "values-per-area", "national-trend"] as const) {
        expect(mirror.rankingR2Key(key, kind)).toBe(canonical.rankingR2Key(key, kind));
      }
    }
  });

  it("rejects the same invalid input with the same error", () => {
    const outcome = (fn: (key: unknown, kind: unknown) => string, key: unknown, kind: unknown) => {
      try { return fn(key, kind); } catch (error) { return String(error); }
    };
    const inputs = ["", "A", "a_b", "a/b", "..", "a--b", "a\n", null, undefined, 1, {}];
    for (const [key, kind] of [...inputs.map((key) => [key, "item"]), ["population", "invalid"], ["population", null]]) {
      // @ts-expect-error Invalid inputs deliberately cross the TypeScript boundary.
      const expected = outcome(canonical.rankingR2Key, key, kind);
      expect(outcome(mirror.rankingR2Key, key, kind)).toBe(expected);
      expect(expected).toMatch(/^Error: Invalid ranking/);
    }
  });
});
