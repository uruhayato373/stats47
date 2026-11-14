import { createHash } from "node:crypto";
import { gzipSync } from "node:zlib";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createSnapshotReader, withSnapshotReader, sourceEvidence, type SnapshotEntry } from "../../scripts/lib/estat-table-reader.js";
import { fetchEstatData, fetchSampleCounts, shapeForPrefecture, applySupplements } from "../../scripts/page-data-batch.js";
import { compareValues, selectTableSnapshotTargets, parseAuditArgs, assertSnapshotPayload } from "../../scripts/verify-table-snapshot-equivalence.js";
import { makeSliceKey, type Axis } from "../../../estat-api/src/stats-data/utils/table-partitions.js";
import { listAllMetrics } from "../registry.js";
import type { MetricConfig, SourceConfig } from "../types.js";

const table = "0003445758";
const hash = (b: Buffer) => createHash("sha256").update(b).digest("hex");
type Value = { "@area": string; "@time": string; $: string; [key: string]: string };
const row = (tab: string, value: string, extra: Record<string, string> = {}): Value => ({ "@tab": tab, "@cat01": "01", "@cat02": "1133", "@area": "01000", "@time": "2022000000", "@unit": "千円", $: value, ...extra });
const source: Extract<SourceConfig, { kind: "estat" }> = { kind: "estat", statsDataId: table, cdTab: "08", cdCat01: "01", cdCat02: "1133" };
function fixture(rows: Value[], depth = 1, status = "pushed") {
  const axes: Axis[] = ["tab", "cat01"].slice(0, depth).map((id) => ({ id, name: null, codes: [...new Set(rows.map((v) => v[`@${id}`]))] }));
  const bytes = new Map<string, Buffer>();
  const groups = new Map<string, Value[]>();
  for (const value of rows) {
    const key = makeSliceKey(table, axes, Object.fromEntries(axes.map((axis) => [axis.id, value[`@${axis.id}`]])), depth);
    groups.set(key, [...groups.get(key) ?? [], value]);
  }
  const files = [...groups].map(([key, values]) => {
    const raw = Buffer.from(JSON.stringify({ cachedAt: "2026-11-14T00:00:00Z", apiVersion: "3.0", params: {
      statsDataId: table, ...Object.fromEntries(axes.map((axis) => [`cd${axis.id[0].toUpperCase()}${axis.id.substring(1)}`, values[0][`@${axis.id}`]])),
    }, response: { GET_STATS_DATA: { RESULT: { STATUS: 0 }, STATISTICAL_DATA: { TABLE_INF: { "@id": table }, DATA_INF: { VALUE: values } } } } }));
    const compressed = gzipSync(raw);
    bytes.set(key, compressed);
    return { key, rowCount: values.length, bytes: compressed.length, uncompressedBytes: raw.length, sha256: hash(compressed) };
  });
  const manifest = { schemaVersion: 1, statsDataId: table, catalogVersion: "2024-11-27", partition: { depth, partitionAxes: axes.map((a) => a.id), fileCount: files.length }, files, emptyPartitions: [], fileCount: files.length, rowCount: rows.length };
  const manifestKey = `estat-tables/${table}/manifest.json`;
  const manifestBytes = Buffer.from(JSON.stringify(manifest));
  bytes.set(manifestKey, manifestBytes);
  const entry: SnapshotEntry = { statsDataId: table, status, catalogVersion: manifest.catalogVersion, manifestKey, manifestSha256: hash(manifestBytes), depth,
    partitionAxes: axes.map((a) => a.id), fileCount: files.length, rowCount: rows.length, bucket: "stats47-private" };
  const get = vi.fn(async (key: string) => bytes.get(key) ?? null);
  return { reader: createSnapshotReader([entry], get), bytes, entry, get, files };
}
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.restoreAllMocks(); });

describe("pushed table source selection (offline)", () => {
  it.each([0, 1, 2])("depth %i reads canonical keys and filters remaining axes, without live API", async (depth) => {
    const f = fixture([row("08", "30"), row("08", "99", { "@cat02": "OTHER" }), row("12", "5")], depth);
    const network = vi.fn(() => { throw new Error("Network prohibited"); });
    vi.stubGlobal("fetch", network);
    await withSnapshotReader(f.reader, async () => {
      const result = await fetchEstatData("", source);
      expect(result.values).toEqual([row("08", "30")]);
      expect(result.raw).toEqual({ totalNumber: 1, toNumber: 1 });
      expect(sourceEvidence(result.sources)).toEqual({ kind: "estat-table-snapshot", statsDataId: table, catalogVersion: "2024-11-27", manifestSha256: f.entry.manifestSha256,
        sliceKeys: [f.files[0].key] });
      result.values[0].$ = "mutated";
      expect((await fetchEstatData("", source)).values[0].$).toBe("30");
    });
    expect(network).not.toHaveBeenCalled();
  });
  it.each(["absent", "local-only"])("%s uses legacy API and records its source", async (status) => {
    const f = fixture([row("08", "30")], 1, status);
    const reader = status === "absent" ? createSnapshotReader([], f.get) : f.reader;
    const network = vi.fn(async () => new Response(JSON.stringify({ GET_STATS_DATA: { RESULT: { STATUS: 0 }, STATISTICAL_DATA: { DATA_INF: { VALUE: row("08", "30") } } } })));
    vi.stubGlobal("fetch", network);
    await withSnapshotReader(reader, async () => {
      const result = await fetchEstatData("test-only", source);
      expect(result.values).toHaveLength(1);
      expect(sourceEvidence(result.sources)).toEqual({ kind: "estat-api", statsDataId: table, catalogVersion: null, manifestSha256: null, sliceKeys: [] });
    });
    expect(f.get).not.toHaveBeenCalled();
    expect(network).toHaveBeenCalledOnce();
  });
  it("snapshot-only trial cannot silently call the API for an unlisted table", async () => {
    vi.stubEnv("ESTAT_SNAPSHOT_ONLY", "1");
    const network = vi.fn(); vi.stubGlobal("fetch", network);
    await expect(withSnapshotReader(createSnapshotReader([], vi.fn()), () => fetchEstatData("", source))).rejects.toThrow("Live e-Stat disabled");
    expect(network).not.toHaveBeenCalled();
  });
  it.each(["manifest", "slice", "missing"])("%s corruption fails closed, never API fallback", async (target) => {
    const f = fixture([row("08", "30")]);
    if (target === "manifest") f.bytes.set(f.entry.manifestKey, Buffer.from("{}"));
    else if (target === "slice") f.bytes.set(f.files[0].key, Buffer.from("corrupt"));
    else f.bytes.delete(f.files[0].key);
    const network = vi.fn(); vi.stubGlobal("fetch", network);
    await expect(withSnapshotReader(f.reader, () => fetchEstatData("", source))).rejects.toThrow(/mismatch\/missing/);
    expect(network).not.toHaveBeenCalled();
  });
  it("a documented empty partition returns zero rows without GET of a nonexistent slice", async () => {
    const f = fixture([row("08", "30")]);
    const manifest = JSON.parse(f.bytes.get(f.entry.manifestKey)!.toString());
    manifest.emptyPartitions = [{ key: `estat-tables/${table}/data/tab=12.json.gz`, params: { statsDataId: table, cdTab: "12" } }];
    manifest.partition.fileCount = 2;
    const bytes = Buffer.from(JSON.stringify(manifest));
    f.bytes.set(f.entry.manifestKey, bytes);
    f.entry.manifestSha256 = hash(bytes);
    const result = await withSnapshotReader(f.reader, () => fetchEstatData("", { ...source, cdTab: "12" }));
    expect(result.values).toEqual([]);
    expect(result.sources[0].sliceKeys).toEqual([]);
    expect(f.get).toHaveBeenCalledTimes(1);
  });
  it("annual income and estimated workers use distinct tabs and preserve value/rank", async () => {
    const f = fixture([row("08", "300"), row("12", "500"), row("13", "0", { "@unit": "十人" }),
      row("40", "310", { "@time": "2023000000" }), row("44", "600", { "@time": "2023000000" }), row("45", "2", { "@time": "2023000000", "@unit": "十人" })], 2);
    const config = listAllMetrics().find((m) => m.key === "nurse-annual-income")!;
    if (config.source.kind !== "estat") throw new Error("Invalid fixture source");
    const wageSource = config.source;
    await withSnapshotReader(f.reader, async () => {
      const fetched = await fetchEstatData("", wageSource);
      const counts = await fetchSampleCounts("", wageSource);
      const payload = shapeForPrefecture(config, fetched.values, counts, sourceEvidence([...fetched.sources, ...counts?.sources ?? []]));
      expect(payload.rows.map((r) => [r.yearCode, r.value, r.rank, r.sampleCount, r.isReference])).toEqual([
        ["2022", 410, 1, 0, true], ["2023", 432, 1, 20, false],
      ]);
      expect(payload.meta.source?.sliceKeys).toHaveLength(6);
      expect(payload.meta.sampleCount).toEqual({ kind: "estimated-workers", unit: "人", referenceBelow: 10, cdTab: "13,45" });
    });
  });
  it("axisSum and axisRatio use snapshot members", async () => {
    const f = fixture([row("08", "30", { "@cat02": "A" }), row("08", "70", { "@cat02": "B" })]);
    await withSnapshotReader(f.reader, async () => {
      expect((await fetchEstatData("", { ...source, axisSum: { axis: "cat02", codes: ["A", "B"] } })).values[0].$).toBe("100");
      expect((await fetchEstatData("", { ...source, axisRatio: { axis: "cat02", numeratorCodes: ["A"], denominatorCodes: ["A", "B"] } })).values[0].$).toBe("30");
    });
  });
  it("supplemental years keep their slice provenance, including a reused cached supplement", async () => {
    const f = fixture([row("08", "30"), row("12", "25", { "@time": "2021000000" })]);
    const base = listAllMetrics().find((m) => m.key === "nurse-annual-income")!;
    const config = { ...base, source, supplementalSources: [{ years: [2021], source: { ...source, cdTab: "12" }, reason: "offline fixture: earlier year in another tab" }] };
    await withSnapshotReader(f.reader, async () => {
      const fetched = await fetchEstatData("", source);
      const cache = new Map();
      for (const entity of ["prefecture", "city"] as const) {
        const result = await applySupplements("", config, fetched, cache, [], entity);
        expect(result.values.map((v) => v.$)).toEqual(["30", "25"]);
        expect(sourceEvidence(result.sources).sliceKeys).toEqual(f.files.map((f) => f.key));
      }
      expect(f.get).toHaveBeenCalledTimes(3); // manifest + two slices, cached on reuse
    });
  });
  it("cdCat03–05 and comma-separated codes are filtered inside a shallow slice", async () => {
    const common = { "@cat03": "a", "@cat04": "b", "@cat05": "c" };
    const f = fixture([row("08", "1", common), row("08", "2", { ...common, "@cat05": "d" }), row("08", "3", { ...common, "@cat04": "other" })]);
    const result = await withSnapshotReader(f.reader, () => fetchEstatData("", { ...source, cdCat03: "a", cdCat04: "b", cdCat05: "c,d" }));
    expect(result.values.map((v) => v.$)).toEqual(["1", "2"]);
  });
  it("areaAxis reports why it needs the legacy path; snapshot-only mode blocks that live request", async () => {
    vi.stubEnv("ESTAT_SNAPSHOT_ONLY", "1");
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const network = vi.fn(); vi.stubGlobal("fetch", network);
    const config = listAllMetrics().find((m) => m.source.kind === "estat" && m.source.areaAxis);
    if (!config || config.source.kind !== "estat") throw new Error("Missing areaAxis fixture");
    await expect(fetchEstatData("", config.source)).rejects.toThrow("Live e-Stat disabled");
    expect(warning).toHaveBeenCalledWith(expect.stringContaining("areaAxis requires live classification metadata"));
    expect(network).not.toHaveBeenCalled();
  });
  it("sample count rejects ambiguous coordinates and unknown units instead of inventing people", async () => {
    for (const values of [[row("13", "1", { "@unit": "不明" })], [row("13", "1", { "@unit": "人" }), row("45", "1", { "@unit": "人" })]]) {
      await expect(withSnapshotReader(fixture(values).reader, () => fetchSampleCounts("", source))).rejects.toThrow(/unit|Duplicate/);
    }
  });
  it("mixed supplemental tables retain every input's provenance without changing earlier results", () => {
    const first = { kind: "estat-table-snapshot" as const, statsDataId: table, catalogVersion: "v1", manifestSha256: "sha", sliceKeys: ["a"] };
    const supplement = { kind: "estat-api" as const, statsDataId: "0000000002", catalogVersion: null, manifestSha256: null, sliceKeys: [] };
    const merged = sourceEvidence([first, { ...first, sliceKeys: ["b", "a"] }, supplement]);
    expect(merged.sliceKeys).toEqual(["a", "b"]);
    expect(merged.inputs).toEqual([{ ...first, sliceKeys: ["a", "b"] }, supplement]);
    expect(first.sliceKeys).toEqual(["a"]);
  });
});

describe("strict public equivalence", () => {
  const original = { metricKey: "fixture", entityKind: "prefecture", rows: [{ areaCode: "01000", yearCode: "2023", value: 123, unit: "万円", rank: 1 }], meta: {} };
  it("ignores only metadata and newly added sample annotations", () => {
    expect(compareValues({ ...original, meta: { generatedAt: "new" }, rows: [{ ...original.rows[0], sampleCount: 0, isReference: true }] }, original).matches).toBe(true);
    for (const field of ["value", "unit", "yearCode", "areaCode", "rank"]) {
      expect(compareValues({ ...original, rows: [{ ...original.rows[0], [field]: "changed" }] }, original).matches).toBe(false);
    }
  });
});

describe("table-scoped manual equivalence audit", () => {
  const base = listAllMetrics().find((metric) => metric.key === "nurse-annual-income")!;
  const primary = "0000000001", city = "0000000002", supplement = "0000000003";
  const entries = [primary, city, supplement].map((statsDataId) => ({ statsDataId, status: "pushed" }));
  const metric: MetricConfig = { ...base, key: "non-wage-fixture", entities: ["prefecture", "city"],
    source: { kind: "estat", statsDataId: primary }, citySource: { kind: "estat", statsDataId: city },
    supplementalSources: [{ years: [2020], source: { kind: "estat", statsDataId: supplement }, reason: "earlier table" }] };
  it("selects prefecture/city/supplemental references without changing the registry", () => {
    const original = structuredClone(metric);
    expect(selectTableSnapshotTargets(primary, entries, [metric]).map((target) => target.entity)).toEqual(["prefecture"]);
    expect(selectTableSnapshotTargets(city, entries, [metric]).map((target) => target.entity)).toEqual(["city"]);
    expect(selectTableSnapshotTargets(supplement, entries, [metric]).map((target) => target.entity)).toEqual(["prefecture", "city"]);
    expect(metric).toEqual(original);
  });
  it("finds derived SSDS city tables and mapped household sources using existing resolvers", () => {
    const ssds = { ...metric, citySource: undefined, supplementalSources: undefined, source: { kind: "estat" as const, statsDataId: "0000010201" } };
    expect(selectTableSnapshotTargets("0000020301", [{ statsDataId: "0000020301", status: "pushed" }], [ssds]).map((target) => target.entity)).toEqual(["city"]);
    const household: MetricConfig = { ...metric, entities: ["prefecture"], supplementalSources: undefined,
      source: { kind: "kakei-chousa", filter: { statsDataId: primary, cdCat01: "x" } } };
    expect(selectTableSnapshotTargets(primary, entries, [household])).toHaveLength(1);
  });
  it("requires a unique pushed ledger entry and at least one active metric", () => {
    expect(() => selectTableSnapshotTargets(primary, [], [metric])).toThrow("pushed ledger entry");
    expect(() => selectTableSnapshotTargets(primary, [{ statsDataId: primary, status: "local-only" }], [metric])).toThrow("pushed ledger entry");
    expect(() => selectTableSnapshotTargets(primary, [entries[0], entries[0]], [metric])).toThrow("pushed ledger entry");
    expect(() => selectTableSnapshotTargets(primary, entries, [{ ...metric, isActive: false }])).toThrow("No active ingestible metrics");
  });
  it("wage metrics come from the registry, not a hard-coded metric count", () => {
    const wage = { statsDataId: table, status: "pushed" };
    expect(selectTableSnapshotTargets(table, [wage], [base])).toHaveLength(1);
    expect(selectTableSnapshotTargets(table, [wage], listAllMetrics())).toHaveLength(40);
  });
  it("parses a required table and optional output directory, rejecting ambiguous arguments", () => {
    expect(parseAuditArgs(["--table", primary, "--out", "/private/tmp/equivalence"])).toEqual({ table: primary, out: "/private/tmp/equivalence" });
    expect(parseAuditArgs(["--table", primary]).out).toContain(`stats47-table-snapshot-equivalence/${primary}`);
    for (const args of [[], ["--table", "123"], ["--table", primary, "--table", city], ["--table", primary, "--push"], ["--out", "--table", primary]]) {
      expect(() => parseAuditArgs(args)).toThrow();
    }
  });
  it("non-wage outputs need no count annotations; provenance must identify the requested table", () => {
    const f = fixture([row("08", "30")]);
    const target = { config: base, entity: "prefecture" as const };
    const source = { kind: "estat-table-snapshot", statsDataId: table, catalogVersion: f.entry.catalogVersion, manifestSha256: f.entry.manifestSha256, sliceKeys: [] };
    const payload = { metricKey: base.key, entityKind: "prefecture", rows: [], meta: { generatedAt: "2026-11-14T01:00:00Z", source } };
    const start = new Date("2026-11-14T00:00:00Z");
    expect(() => assertSnapshotPayload(payload, target, f.entry, start)).not.toThrow();
    for (const changed of [{ ...source, kind: "estat-api" }, { ...source, manifestSha256: "wrong" }, { ...source, statsDataId: primary }]) {
      expect(() => assertSnapshotPayload({ ...payload, meta: { ...payload.meta, source: changed } }, target, f.entry, start)).toThrow("provenance missing");
    }
    expect(() => assertSnapshotPayload({ ...payload, meta: { ...payload.meta, generatedAt: "invalid" } }, target, f.entry, start)).toThrow("provenance missing");
  });
});
