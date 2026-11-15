import { describe, expect, it } from "vitest";
import SITE from "../../../types/src/site.json";
import { R2_PUBLIC_ORIGIN, RANKING_R2_PREFIX, STATS_R2_PREFIX, rankingR2Key } from "../keys";
import { R2_KEY_CLASSES } from "../scripts/r2-key-classes";

describe("metric R2 keys", () => {
  it.each(["item", "values", "values-per-population", "values-per-area", "national-trend"] as const)(
    "builds the %s snapshot key", (kind) => {
      expect(rankingR2Key("population-2025", kind)).toBe(["app", "ranking", "population-2025", `${kind}.json`].join("/"));
    },
  );

  it.each(["", "Population", "under_score", "a/b", "../x", "a--b", "-a", "a-", "a.b", "a b", "a\n", "県", "a%2fb"])(
    "rejects invalid key segment %j", (key) => expect(() => rankingR2Key(key, "item")).toThrow("Invalid ranking key segment"),
  );

  it("rejects invalid JavaScript arguments", () => {
    // @ts-expect-error Exercise the plain-node boundary.
    expect(() => rankingR2Key(null, "item")).toThrow("Invalid ranking key segment");
    // @ts-expect-error Exercise the plain-node boundary.
    expect(() => rankingR2Key("population", "../item")).toThrow("Invalid ranking R2 kind");
  });

  it("uses the shared public origin and classified observation/snapshot prefixes", () => {
    expect(R2_PUBLIC_ORIGIN).toBe(SITE.r2PublicBaseUrl);
    for (const [prefix, dataClass] of [[STATS_R2_PREFIX, "authoritative"], [RANKING_R2_PREFIX, "regenerable"]]) {
      const rows = R2_KEY_CLASSES.filter((row) => row.bucket === SITE.r2Bucket && row.prefix === `${prefix}/` && !row.pattern);
      expect(rows).toHaveLength(1);
      expect(rows[0].class).toBe(dataClass);
    }
  });
});
