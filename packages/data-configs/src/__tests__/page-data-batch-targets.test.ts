import { describe, expect, it } from "vitest";

import { filterActiveRefreshTargets, hasNothingToPublish, isIngestableCityCode, parseBatchArgs } from "../../scripts/page-data-batch";
import type { MetricConfig } from "../types";

const active = { key: "active", isActive: true } as MetricConfig;
const inactive = { key: "inactive", isActive: false } as MetricConfig;
const legacyActive = { key: "legacy-active" } as MetricConfig;

describe("page-data-batch の全量更新対象", () => {
  it("全量更新では退役済み metric を除外する", () => {
    expect(filterActiveRefreshTargets([active, inactive, legacyActive], false).map((c) => c.key)).toEqual([
      "active",
      "legacy-active",
    ]);
  });

  it("--metric 明示時は退役済み metric も個別診断できる", () => {
    expect(filterActiveRefreshTargets([inactive], true).map((c) => c.key)).toEqual(["inactive"]);
  });
});

describe("page-data-batch の名指し実行で上げるものが無いときは失敗にする", () => {
  const named = { isExplicitMetric: true, dryRun: false };
  it("名指しした指標をすべて飛ばしたら失敗にする (港の 9 指標が成功扱いで次の段で落ちた)", () => {
    expect(hasNothingToPublish([{ status: "skip" }, { status: "skip" }], named)).toBe(true);
  });
  it("1 件でも取り込むか、年名を付け直して上げるものがあれば失敗にしない", () => {
    expect(hasNothingToPublish([{ status: "skip" }, { status: "ok" }], named)).toBe(false);
    expect(hasNothingToPublish([{ status: "skip", relabeled: 3 }], named)).toBe(false);
  });
  it("全量実行・dry-run・対象 0 件は判定しない", () => {
    expect(hasNothingToPublish([{ status: "skip" }], { isExplicitMetric: false, dryRun: false })).toBe(false);
    expect(hasNothingToPublish([{ status: "skip" }], { isExplicitMetric: true, dryRun: true })).toBe(false);
    expect(hasNothingToPublish([], named)).toBe(false);
  });
});

describe("page-data-batch の市区町村コード判定", () => {
  const current = new Map([
    ["28201", "兵庫県 姫路市"],
    ["28101", "兵庫県 神戸市 東灘区"],
  ]);

  it("現行の市区町村マスタにあるコードは取り込む", () => {
    expect(isIngestableCityCode("28201", current)).toBe(true);
    expect(isIngestableCityCode("28101", current)).toBe(true);
  });

  it("国勢調査の表が返す合併前の旧町村 (旧：家島町 28421) は 5 桁でも取り込まない", () => {
    expect(isIngestableCityCode("28421", current)).toBe(false);
  });

  it("都道府県コードは市区町村として取り込まない", () => {
    expect(isIngestableCityCode("28000", new Map([["28000", "兵庫県"]]))).toBe(false);
  });
});

describe("page-data-batch の取得モード", () => {
  it("既定は差分選択、全件は明示したときだけ", () => {
    expect(parseBatchArgs([])).toMatchObject({ all: false, selectOnly: false, dryRun: false });
    expect(parseBatchArgs(["--all"]).all).toBe(true);
    expect(parseBatchArgs(["--select-only", "--metric", "a,b"])).toMatchObject({ all: false, selectOnly: true, metric: "a,b" });
  });
  it("曖昧な取得モード・空の指標指定・誤記は停止する", () => {
    for (const args of [["--all", "--metric", "a"], ["--select-only", "--all"], ["--select-only", "--kind", "city"], ["--metric", ""], ["--metric"], ["--alll"]]) {
      expect(() => parseBatchArgs(args)).toThrow();
    }
  });
});
