/**
 * 権利状態が「[要確認]」(再配布・商用利用の許諾が確認できない) の指標は有料パックに入れない。
 * 規則: metric config の license 欄に「[要確認]」を含む指標 (算出指標は親指標も) を pack snapshot の読み込みで除外し、
 * 除外した指標名と理由を READINESS.md に残す。無料パック P-13 (総人口のみ) は対象外。
 */
import { describe, it, expect } from "vitest";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { METRICS_REGISTRY } from "@stats47/data-configs";
import { loadPackSnapshotDatasets } from "../src/data/pack-snapshot";
import { buildDatabook, resolveDatabook } from "../src/build/build-databook";
import { unconfirmedLicense } from "../src/data/metric-source";
import { ALL_PRODUCTS } from "../src/catalog/products";

const PACK_IDS = ["P-01", "P-02", "P-03", "P-04", "P-05", "P-06", "P-07", "P-08", "P-09", "P-10", "P-11", "P-12", "P-14"];
const registry = METRICS_REGISTRY as unknown as Record<string, Record<string, any>>;
// テスト側の独立した検出: source 配下のどこかに「[要確認]」がある指標
const flagged = new Set(Object.keys(registry).filter((k) => JSON.stringify(registry[k].source ?? {}).includes("[要確認]")));

describe("権利要確認の指標を有料パックから除く", () => {
  it("検出対象 (定義側) が実在する: テスト自体が空振りしない", () => {
    expect(flagged.has("pachinko-shop-density-per-10k")).toBe(true);
    expect(flagged.has("junior-high-club-per100-soccer")).toBe(true);
    expect(flagged.size).toBeGreaterThanOrEqual(11);
  });

  it("全パックの収録指標に、権利要確認の指標が 0 件", () => {
    for (const id of PACK_IDS) {
      const bad = loadPackSnapshotDatasets(id)!.datasets.filter((d) => flagged.has(d.rankingKey!));
      expect(bad.map((d) => d.rankingKey), id).toEqual([]);
    }
  });

  it("除外件数: P-06 中体連 10 件 / P-08 パチンコ 1 件 / P-12 11 件、その他のパックは 0 件", () => {
    const expected: Record<string, number> = { "P-06": 10, "P-08": 1, "P-12": 11 };
    for (const id of PACK_IDS) {
      const loaded = loadPackSnapshotDatasets(id)!;
      expect(loaded.excluded?.length ?? 0, id).toBe(expected[id] ?? 0);
    }
    expect(loadPackSnapshotDatasets("P-06")!.datasets.length).toBe(244);
    expect(loadPackSnapshotDatasets("P-08")!.datasets.length).toBe(69);
    expect(loadPackSnapshotDatasets("P-12")!.datasets.length).toBe(2073);
  });

  it("除外記録には指標キー・指標名・理由 (license 欄の「要確認」) が入る", () => {
    const ex = loadPackSnapshotDatasets("P-08")!.excluded!;
    expect(ex).toHaveLength(1);
    expect(ex[0].rankingKey).toBe("pachinko-shop-density-per-10k");
    expect(ex[0].indicator).toBeTruthy();
    expect(ex[0].reason).toContain("要確認");
    expect(ex[0].reason).toContain("All rights Reserved");
  });

  it("算出指標は親指標が要確認なら除く。許諾が確認済み・記載なしの指標は除かない", () => {
    const reg = {
      parent: { source: { kind: "external", fetcherKey: "manual", config: { source: { license: "[要確認] 規約の明文なし" } } } },
      child: { source: { kind: "external", fetcherKey: "calculated", config: {} }, calculation: { numeratorKey: "parent", denominatorKey: "ok" } },
      ok: { source: { kind: "external", fetcherKey: "manual", config: { source: { license: "PDL1.0（商用利用可）" } } } },
      none: { source: { kind: "estat", statsDataId: "0000010101" } },
    };
    expect(unconfirmedLicense(reg.parent, reg)).toContain("規約の明文なし");
    expect(unconfirmedLicense(reg.child, reg)).toContain("規約の明文なし");
    expect(unconfirmedLicense(reg.ok, reg)).toBeNull();
    expect(unconfirmedLicense(reg.none, reg)).toBeNull();
  });

  it("除外した指標名と理由を READINESS.md に残す。無料パック P-13 は除外なし", async () => {
    const dir = mkdtempSync(join(tmpdir(), "pf-excl-"));
    try {
      const product = ALL_PRODUCTS.find((p) => p.id === "P-08")!;
      const databook = resolveDatabook(product)!;
      const small = { ...databook, datasets: databook.datasets.slice(0, 3) };
      const res = await buildDatabook(product, small, { outRoot: dir, version: "t1" });
      const readiness = readFileSync(join(res.outDir, "READINESS.md"), "utf8");
      expect(readiness).toContain("pachinko-shop-density-per-10k");
      expect(readiness).toContain("権利");
      expect(readiness).toContain("All rights Reserved");
      const free = resolveDatabook(ALL_PRODUCTS.find((p) => p.id === "P-13")!)!;
      expect(free.excluded ?? []).toEqual([]);
    } finally { rmSync(dir, { recursive: true, force: true }); }
  }, 120000);
});
