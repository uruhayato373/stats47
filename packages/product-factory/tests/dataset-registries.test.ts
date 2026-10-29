/**
 * check-datasets の参照検査 (config/datasets.mjs の REGISTRIES) は TS を import せず、本文を正規表現で読む。
 * 読み方が TS の実際の値とずれると、参照切れの誤検知か照合漏れになるので、ここで実際の値と突き合わせる (2026-10-26)。
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import { BUSINESS_PLAN_M1_ANALYSES } from "@stats47/data-configs/business-plan";
import { REGISTRIES } from "../../../config/datasets.mjs";
import { resolveRegistry } from "../../../.claude/scripts/lib/check-datasets.mjs";
import { ALL_PRODUCTS } from "../src/catalog/products";
import { GEO_SERVICE_OFFER } from "../src/channels/geo/service-offer";

const ROOT = resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const readText = (path: string) => readFileSync(resolve(ROOT, path), "utf8");
const sorted = (values: Iterable<string>) => [...values].sort();

describe("check-datasets の REGISTRIES は TS の正本と同じ ID を読む", () => {
  it("metrics = METRICS_REGISTRY のキー", () => {
    expect(sorted(resolveRegistry(REGISTRIES.metrics, readText))).toEqual(sorted(Object.keys(METRICS_REGISTRY)));
  });

  it("product-ids = ALL_PRODUCTS と Geo サービスの ID", () => {
    expect(sorted(resolveRegistry(REGISTRIES["product-ids"], readText))).toEqual(
      sorted([...ALL_PRODUCTS.map((p) => p.id), GEO_SERVICE_OFFER.id]),
    );
  });

  it("affiliate-ad-experiment-ids = AFFILIATE_ADS が持つ experimentId", async () => {
    // apps/web の TS はこの package の型検査 (rootDir) の外なので、実行時だけ読む
    const { AFFILIATE_ADS } = (await import(pathToFileURL(resolve(ROOT, "apps/web/scripts/affiliate-ads-data.ts")).href)) as {
      AFFILIATE_ADS: { experimentId?: string }[];
    };
    const ids = new Set(AFFILIATE_ADS.map((ad) => ad.experimentId).filter((id): id is string => Boolean(id)));
    expect(ids.size).toBeGreaterThan(0);
    expect(sorted(resolveRegistry(REGISTRIES["affiliate-ad-experiment-ids"], readText))).toEqual(sorted(ids));
  });

  it("ranking-slug-redirects = RANKING_SLUG_REDIRECTS のキー、ranking-content-keys = 指標 + 旧 slug", async () => {
    // apps/web の TS はこの package の型検査 (rootDir) の外なので、実行時だけ読む
    const { RANKING_SLUG_REDIRECTS } = (await import(pathToFileURL(resolve(ROOT, "apps/web/src/config/ranking-redirects.ts")).href)) as {
      RANKING_SLUG_REDIRECTS: Record<string, string>;
    };
    expect(sorted(resolveRegistry(REGISTRIES["ranking-slug-redirects"], readText))).toEqual(sorted(Object.keys(RANKING_SLUG_REDIRECTS)));
    expect(sorted(resolveRegistry(REGISTRIES["ranking-content-keys"], readText, REGISTRIES))).toEqual(
      sorted(new Set([...Object.keys(METRICS_REGISTRY), ...Object.keys(RANKING_SLUG_REDIRECTS)])),
    );
  });

  it("geo-campaign-metric-names は M1 Geo 分析の metricKeys の文字列リテラルで、指標と合わせると全 metricKeys を覆う", () => {
    const names = resolveRegistry(REGISTRIES["geo-campaign-metric-names"], readText);
    const metricKeys = new Set<string>(BUSINESS_PLAN_M1_ANALYSES.flatMap((a) => [...a.metricKeys]));
    for (const name of names) expect(metricKeys.has(name), `${name} は metricKeys に無い`).toBe(true);
    const geoPostKeys = resolveRegistry(REGISTRIES["geo-post-metric-keys"], readText, REGISTRIES);
    for (const key of metricKeys) expect(geoPostKeys.has(key), `${key} が Geo の投稿の参照先に無い`).toBe(true);
  });

  it("ksj-datasets = GIS 台帳 (GIS_DATASETS) の dataId", async () => {
    // packages/gis はこの package の依存の外なので、実行時だけ読む
    const { GIS_DATASETS } = (await import(pathToFileURL(resolve(ROOT, "packages/gis/src/mlit-ksj/datasets.ts")).href)) as {
      GIS_DATASETS: { dataId: string }[];
    };
    expect(sorted(resolveRegistry(REGISTRIES["ksj-datasets"], readText))).toEqual(sorted(GIS_DATASETS.map((d) => d.dataId)));
  });

  it("[mutation] 読み方を取り違えると 0 件で例外になり、黙って空集合で照合しない", () => {
    expect(() => resolveRegistry({ ...REGISTRIES.metrics, pattern: "^NO_SUCH_LINE_(x)$" }, readText)).toThrow(/1 件も読めない/);
    expect(() => resolveRegistry({ ...REGISTRIES.metrics, between: ["NO_SUCH_START", "NO_SUCH_END"] }, readText)).toThrow(/区切り/);
  });
});
