/**
 * check-datasets の参照検査 (config/datasets.mjs の REGISTRIES) は TS を import せず、本文を正規表現で読む。
 * 読み方が TS の実際の値とずれると、参照切れの誤検知か照合漏れになるので、ここで実際の値と突き合わせる (2026-10-26)。
 * check-datasets は .claude/scripts の道具なので、テストもここに置く (SCRIPTS-TO-PACKAGES-01)。
 * 実行: node --import tsx --test (@stats47/data-configs の TS と apps/web の TS を読むため)。
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { GEO_ANALYSES } from "@stats47/data-configs/business-plan";
import { REGISTRIES } from "../../../../config/datasets.mjs";
import { resolveRegistry } from "../check-datasets.mjs";

const ROOT = resolve(fileURLToPath(new URL("../../../..", import.meta.url)));
const readText = (path: string) => readFileSync(resolve(ROOT, path), "utf8");
const sorted = (values: Iterable<string>) => [...values].sort();

describe("check-datasets の REGISTRIES は TS の正本と同じ ID を読む", () => {
  it("metrics = METRICS_REGISTRY のキー", () => {
    assert.deepEqual(sorted(resolveRegistry(REGISTRIES.metrics, readText)), sorted(Object.keys(METRICS_REGISTRY)));
  });

  it("ranking-slug-redirects = RANKING_SLUG_REDIRECTS のキー、ranking-content-keys = 指標 + 旧 slug", async () => {
    const { RANKING_SLUG_REDIRECTS } = (await import(pathToFileURL(resolve(ROOT, "apps/web/src/config/ranking-redirects.ts")).href)) as {
      RANKING_SLUG_REDIRECTS: Record<string, string>;
    };
    assert.deepEqual(sorted(resolveRegistry(REGISTRIES["ranking-slug-redirects"], readText)), sorted(Object.keys(RANKING_SLUG_REDIRECTS)));
    assert.deepEqual(
      sorted(resolveRegistry(REGISTRIES["ranking-content-keys"], readText, REGISTRIES)),
      sorted(new Set([...Object.keys(METRICS_REGISTRY), ...Object.keys(RANKING_SLUG_REDIRECTS)])),
    );
  });

  it("geo-analysis-metric-names = 全 Geo 分析 (GEO_ANALYSES) の metricKeys の和集合で、指標と合わせると全 metricKeys を覆う", () => {
    const names = resolveRegistry(REGISTRIES["geo-analysis-metric-names"], readText);
    const metricKeys = new Set<string>(GEO_ANALYSES.flatMap((a) => [...a.metricKeys]));
    for (const name of names) assert.ok(metricKeys.has(name), `${name} は metricKeys に無い`);
    const geoPostKeys = resolveRegistry(REGISTRIES["geo-post-metric-keys"], readText, REGISTRIES);
    for (const key of metricKeys) assert.ok(geoPostKeys.has(key), `${key} が Geo の投稿の参照先に無い`);
  });

  it("[mutation] 読み方を取り違えると 0 件で例外になり、黙って空集合で照合しない", () => {
    assert.throws(() => resolveRegistry({ ...REGISTRIES.metrics, pattern: "^NO_SUCH_LINE_(x)$" }, readText), /1 件も読めない/);
    assert.throws(() => resolveRegistry({ ...REGISTRIES.metrics, between: ["NO_SUCH_START", "NO_SUCH_END"] }, readText), /区切り/);
  });
});
