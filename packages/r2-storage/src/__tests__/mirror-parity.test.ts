import { describe, expect, it } from "vitest";
// @ts-expect-error Generated plain-node mirror has no declaration file.
import * as mirror from "../../mirror/r2-keys.mjs";
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
      for (const kind of ["item", "values", "values-per-population", "values-per-area", "national-trend", "ai-content", "page-cards", "values-per-household", "thumbnail", "ogp-image", "ogp-generation"] as const) {
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


it("keeps observation keys and errors identical in the mirror", () => {
  for (const metric of ["population", "legacy_key/path", ""]) {
    for (const entity of ["prefecture", "city", "port", "migration-flow"] as const) {
      for (const year of [undefined, 0, 2025]) {
        const outcome = (fn: typeof canonical.statsR2Key) => {
          try { return fn(metric, entity, year); } catch (error) { return String(error); }
        };
        expect(outcome(mirror.statsR2Key)).toBe(outcome(canonical.statsR2Key));
      }
    }
  }
  expect(() => mirror.statsR2Key("m", "invalid")).toThrow("unknown entity kind: invalid");
});


it("keeps download variants identical in the mirror", () => {
  for (const basis of ["original", "per_population", "per_area", "per_household", "all-bases"]) {
    for (const format of ["csv", "json"] as const) {
      for (const encoding of ["utf8", "sjis"] as const) {
        const options = { basis, format, encoding };
        expect(mirror.rankingR2Key("population", "download", options))
          .toBe(canonical.rankingR2Key("population", "download", options));
      }
    }
  }
  expect(() => mirror.rankingR2Key("population", "download")).toThrow("download requires options");
});
