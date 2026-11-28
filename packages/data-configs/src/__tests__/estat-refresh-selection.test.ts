import { statsR2Key } from "@stats47/r2-storage/keys";
import { describe, expect, it, vi } from "vitest";
import { buildRecipe } from "../recipe.js";
import type { MetricConfig } from "../types.js";
import { checkTableUpdates, findTableUpdates, publicJsonReader, selectRefreshMetrics, readSnapshotVersions, type SnapshotVersion } from "../../scripts/estat-refresh-selection.js";
import { parseSnapshotArgs } from "../../scripts/estat-table-snapshot.js";
const ID = "0003445758";
const second = "0000010101";
const entry = (status: SnapshotVersion["status"] = "verified", statsDataId = ID): SnapshotVersion => ({ statsDataId, statCode: "00450091", catalogVersion: "2024-11-27", status });
function metric(key: string, statsDataId = ID, isActive = true): MetricConfig {
  return { key, title: key, unit: "人", category: "population", source: { kind: "estat", statsDataId, cdCat01: "01" },
    isActive, entities: ["prefecture"], years: "all", visualization: { domain: { mode: "extent" }, colorScheme: "interpolateBlues", colorSchemeType: "sequential",
      trendDomain: { mode: "extent", padding: 0.08 }, comparisonDomain: { mode: "extent", padding: 0.05 } } };
}
const catalog = [{ statsDataId: ID, updatedDate: "2025-01-01" }];
describe("table update detection", () => {
  it("loads the actual ledger through its registered schema without writing it", async () => {
    const ledger = await readSnapshotVersions();
    expect(ledger.length).toBeGreaterThan(0);
    expect(ledger[0]).toHaveProperty("catalogVersion");
  });
  it.each(["local-only", "pushed", "verified"] as const)("compares %s snapshots and deduplicates active nested references", (status) => {
    const active = { ...metric("active"), supplement: { statsDataId: ID }, sample: { statsDataId: second } };
    expect(findTableUpdates([entry(status)], catalog, [active, metric("retired", ID, false)]))
      .toEqual([{ statsDataId: ID, ledgerVersion: "2024-11-27", catalogVersion: "2025-01-01", metricKeys: ["active"] }]);
    expect(findTableUpdates([entry(status, second)], [{ statsDataId: second, updatedDate: "2025-01-01" }], [active])[0].metricKeys).toEqual(["active"]);
  });
  it("ignores equal/older dates and unsnapshotted tables", () => {
    for (const updatedDate of ["2024-11-27", "2023-01-01"]) expect(findTableUpdates([entry()], [{ statsDataId: ID, updatedDate }], [metric("a")])).toEqual([]);
    expect(findTableUpdates([], catalog, [metric("a")])).toEqual([]);
  });
  it("rejects missing, removed, duplicate or invalid versions", () => {
    for (const rows of [[], [{ ...catalog[0], removedAt: "2026-01-01" }], [catalog[0], catalog[0]], [{ ...catalog[0], updatedDate: "2025-02-30" }]]) {
      expect(() => findTableUpdates([entry()], rows, [])).toThrow();
    }
    expect(() => findTableUpdates([entry(), entry()], catalog, [])).toThrow(/Duplicate ledger/);
  });
  it("reads one public index shard per survey, never metadata or e-Stat", async () => {
    const readJson = vi.fn(async () => [...catalog, { statsDataId: second, updatedDate: "2024-11-27" }]);
    expect(await checkTableUpdates([metric("a")], { ledger: [entry(), entry("pushed", second)], readJson })).toHaveLength(1);
    expect(readJson.mock.calls).toEqual([["estat-catalog/index/tables/00450091.json"]]);
  });
  it("supports a standalone read-only CLI mode and rejects mixed write flags", () => {
    expect(parseSnapshotArgs(["--check-updates"]).checkUpdates).toBe(true);
    for (const flag of ["--push", "--dry-run", "--table", "--out"]) expect(() => parseSnapshotArgs(["--check-updates", flag, ID])).toThrow();
    expect(() => parseSnapshotArgs([])).toThrow();
  });
});
describe("refresh union", () => {
  it("unions table updates and configHash drift, excludes inactive metrics, sorts and deduplicates", async () => {
    const metrics = [metric("updated"), metric("both"), metric("drift", second), metric("same", second), metric("inactive", ID, false)];
    const readJson = vi.fn(async (key: string) => {
      const config = metrics.find((value) => key.includes(`/${value.key}/`))!;
      return { meta: { recipe: { configHash: ["both", "drift"].includes(config.key) ? "old" : buildRecipe(config).configHash } } };
    });
    const selected = await selectRefreshMetrics(metrics, { readJson, tableUpdates: findTableUpdates([entry()], catalog, metrics) });
    expect(selected.metricKeys).toEqual(["both", "drift", "updated"]);
    expect(selected.reasons.map(({ key, configHashChanged, updatedTables }) => ({ key, configHashChanged, updatedTables }))).toEqual([
      { key: "both", configHashChanged: true, updatedTables: [ID] }, { key: "drift", configHashChanged: true, updatedTables: [] }, { key: "updated", configHashChanged: false, updatedTables: [ID] },
    ]);
    expect(readJson).toHaveBeenCalledTimes(4);
  });
  it("都道府県の値を持たない指標は、その指標が書く値のファイルの記録と比べる", async () => {
    const city = { ...metric("city-only"), entities: ["city"] } as MetricConfig;
    const readJson = vi.fn(async (key: string) => (key === statsR2Key("city-only", "city") ? { meta: { recipe: buildRecipe(city) } } : null));
    expect((await selectRefreshMetrics([city], { tableUpdates: [], readJson })).metricKeys).toEqual([]);
    expect(readJson.mock.calls).toEqual([[statsR2Key("city-only", "city")]]);
  });
  it("都道府県も市区町村も持たない指標 (港など) は data-refresh が書けないので、記録が無くても選ばない", async () => {
    const port = { ...metric("port-only"), entities: ["port"] } as MetricConfig;
    const readJson = vi.fn(async () => null);
    expect((await selectRefreshMetrics([port, metric("pref")], { tableUpdates: [], readJson })).metricKeys).toEqual(["pref"]);
    expect(readJson.mock.calls).toEqual([[statsR2Key("pref", "prefecture")]]);
  });
  it("does not default to all when no tables/hash changed", async () => {
    const config = metric("same");
    const result = await selectRefreshMetrics([config], { tableUpdates: [], readJson: async () => ({ meta: { recipe: buildRecipe(config) } }) });
    expect(result.metricKeys).toEqual([]);
  });
  it("treats absent values or recipes as a missing hash and aborts on read failures/malformed hash", async () => {
    for (const value of [null, {}, { meta: {} }]) expect((await selectRefreshMetrics([metric("new")], { tableUpdates: [], readJson: async () => value })).metricKeys).toEqual(["new"]);
    await expect(selectRefreshMetrics([metric("a")], { tableUpdates: [], readJson: async () => { throw new Error("HTTP 503"); } })).rejects.toThrow("503");
    await expect(selectRefreshMetrics([metric("a")], { tableUpdates: [], readJson: async () => ({ meta: { recipe: { configHash: 5 } } }) })).rejects.toThrow(/Invalid configHash/);
  });
  it("公開 URL の読み込み口は、市区町村の値のファイルも読める (選び方が市区町村だけの指標で止まらない)", async () => {
    const transport = vi.fn(async () => new Response(JSON.stringify({ meta: {} }), { status: 200 }));
    const cityKey = statsR2Key("city-only", "city");
    await expect(publicJsonReader(transport as unknown as typeof fetch)(cityKey)).resolves.toEqual({ meta: {} });
    await expect(publicJsonReader(transport as unknown as typeof fetch)(cityKey.replace(/cities\.json$/, "other.json"))).rejects.toThrow(/Invalid input key/);
  });
  it("only allows public GET paths, distinguishes 404 from service errors", async () => {
    const transport = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response("", { status: 404 })).mockResolvedValueOnce(new Response("", { status: 503 }));
    const read = publicJsonReader(transport);
    expect(await read("app/stats/a/values.json")).toBeNull();
    await expect(read("app/stats/a/values.json")).rejects.toThrow("503");
    await expect(read("../secret")).rejects.toThrow(/Invalid input/);
    expect(transport.mock.calls[0][1]).toMatchObject({ method: "GET", redirect: "error" });
    expect(transport).toHaveBeenCalledTimes(2);
  });
});
