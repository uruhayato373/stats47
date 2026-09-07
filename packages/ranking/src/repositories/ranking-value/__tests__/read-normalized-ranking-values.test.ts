import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));
vi.mock("@stats47/r2-storage/server", () => ({ fetchFromR2AsJson: vi.fn() }));
vi.mock("../../ranking-item", () => ({ readRankingItemFromR2: vi.fn() }));
vi.mock("../list-ranking-values-all-years", () => ({ listRankingValuesAllYears: vi.fn() }));

import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { err, ok } from "@stats47/types";

import { getRankingDownloadSeries } from "../../../services/get-ranking-download-series";
import type { RankingItem, RankingValue } from "../../../types";
import { readRankingItemFromR2 } from "../../ranking-item";
import { listRankingValuesAllYears } from "../list-ranking-values-all-years";
import {
  readAllYearsNormalizedRankingValuesFromR2,
  readNormalizedRankingValuesFromR2,
} from "../read-ranking-values-from-r2";

const key = "household-expenditure";
const values: RankingValue[] = ["2023", "2024"].map((yearCode) => ({
  metricKey: key, areaType: "prefecture", areaCode: "13000", areaName: "東京都",
  yearCode, yearName: `${yearCode}年`, value: 12, unit: "円/10万人", rank: 1,
}));
const original = [{ ...values[1], value: 240000, unit: "円" }];
const item: RankingItem = {
  rankingKey: key, rankingName: "支出", title: "支出", areaType: "prefecture",
  unit: "円", dataSourceId: "estat", isActive: true, hook: "支出を比較する",
  createdAt: "", updatedAt: "",
  calculation: {
    isCalculated: false,
    normalizationOptions: [{ type: "per_population", label: "人口10万人あたり", unit: "円/10万人", scaleFactor: 100000 }],
  },
};
const snapshot = {
  generatedAt: "2026-09-07T00:00:00Z", rankingKey: key, areaType: "prefecture",
  partitions: values.map((value) => ({ yearCode: value.yearCode, count: 1, values: [value] })),
};

describe("normalized snapshots require a current item declaration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(readRankingItemFromR2).mockResolvedValue(ok(item));
    vi.mocked(fetchFromR2AsJson).mockResolvedValue(snapshot);
    vi.mocked(listRankingValuesAllYears).mockResolvedValue(ok(original));
  });

  it.each(["per_population", "per_area"])("does not read orphan %s snapshots after normalization is removed", async (basis) => {
    vi.mocked(readRankingItemFromR2).mockResolvedValue(ok({ ...item, calculation: { isCalculated: false } }));
    expect(await readNormalizedRankingValuesFromR2(key, "prefecture", "2024", basis)).toEqual(ok([]));
    expect(await readAllYearsNormalizedRankingValuesFromR2(key, "prefecture", basis)).toEqual(ok([]));
    expect(vi.mocked(fetchFromR2AsJson)).not.toHaveBeenCalled();
  });

  it("retains supported single-year and all-year reads", async () => {
    expect(await readNormalizedRankingValuesFromR2(key, "prefecture", "2024年度", "per_population")).toEqual(ok([values[1]]));
    expect(await readAllYearsNormalizedRankingValuesFromR2(key, "prefecture", "per_population")).toEqual(ok(values));
    expect(readRankingItemFromR2).toHaveBeenCalledWith(key, "prefecture");
    expect(fetchFromR2AsJson).toHaveBeenCalledWith(`app/ranking/${key}/values-per-population.json`);
  });

  it("rejects an undeclared basis even when another basis is supported", async () => {
    expect(await readAllYearsNormalizedRankingValuesFromR2(key, "prefecture", "per_area")).toEqual(ok([]));
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  });

  it("does not reuse permission after the item declaration is removed", async () => {
    await readAllYearsNormalizedRankingValuesFromR2(key, "prefecture", "per_population");
    vi.mocked(readRankingItemFromR2).mockResolvedValue(ok({ ...item, calculation: undefined }));
    expect(await readAllYearsNormalizedRankingValuesFromR2(key, "prefecture", "per_population")).toEqual(ok([]));
    expect(fetchFromR2AsJson).toHaveBeenCalledTimes(1);
  });

  it("uses the requested area type and rejects a missing item", async () => {
    vi.mocked(readRankingItemFromR2).mockResolvedValue(ok(null));
    expect(await readNormalizedRankingValuesFromR2(key, "city", "2024", "per_population")).toEqual(ok([]));
    expect(readRankingItemFromR2).toHaveBeenCalledWith(key, "city");
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  });

  it("fails closed when the current item cannot be verified", async () => {
    const error = new Error("item unavailable");
    vi.mocked(readRankingItemFromR2).mockResolvedValue(err(error));
    expect(await readAllYearsNormalizedRankingValuesFromR2(key, "prefecture", "per_population")).toEqual(err(error));
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  });

  it("preserves the empty-snapshot fallback for a declared basis", async () => {
    vi.mocked(fetchFromR2AsJson).mockResolvedValue(null);
    expect(await readNormalizedRankingValuesFromR2(key, "prefecture", "2024", "per_population")).toEqual(ok([]));
  });

  it("download all-bases omits obsolete snapshots and keeps original values", async () => {
    vi.mocked(readRankingItemFromR2).mockResolvedValue(ok({ ...item, calculation: undefined }));
    expect(await getRankingDownloadSeries(key, "prefecture", "per_population")).toEqual([]);
    expect(await getRankingDownloadSeries(key, "prefecture", "all-bases")).toEqual([
      { basisKey: "original", basisLabel: "総数", values: original },
    ]);
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  });

  it("download all-bases retains only the declared normalized series", async () => {
    const series = await getRankingDownloadSeries(key, "prefecture", "all-bases");
    expect(series.map((row) => row.basisKey)).toEqual(["original", "per_population"]);
    expect(series[1].values).toEqual(values);
  });
});
