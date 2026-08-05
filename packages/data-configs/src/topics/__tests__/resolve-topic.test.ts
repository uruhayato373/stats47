import { describe, expect, it } from "vitest";

import type { MetricConfig } from "../../types";
import { toTopicResolutionInput } from "../from-metric";
import { clearTopicPatternCache, resolveTopicKey } from "../resolve-topic";
import { OTHER_TOPIC_KEY, type CategoryTopicCatalog } from "../types";

const CATALOG: CategoryTopicCatalog = {
  categoryKey: "laborwage",
  topics: [
    {
      key: "occupation-income",
      label: "職業別の平均年収",
      matchers: [{ kind: "title", pattern: "の平均年収$" }],
    },
    {
      key: "living-time",
      label: "生活時間",
      matchers: [{ kind: "title", pattern: "の平均時間$" }],
    },
    {
      // 広いパターンは後ろ。先勝ちなので「◯◯の平均年収」はここへ来ない
      key: "wage",
      label: "賃金・給与",
      matchers: [{ kind: "title", pattern: "給与|賃金|年収" }],
    },
    {
      key: "food",
      label: "食料",
      matchers: [{ kind: "kakei-cat01", prefixes: ["0102", "0105"] }],
    },
  ],
  overrides: {
    "labor-expenses-prefecture": "wage",
  },
};

describe("resolveTopicKey", () => {
  it("overrides が matchers より優先される", () => {
    // タイトルはどの規則にも一致しないが、override で wage へ送る
    expect(
      resolveTopicKey(
        { key: "labor-expenses-prefecture", title: "労働費" },
        CATALOG,
      ),
    ).toBe("wage");
  });

  it("override は一致するはずの matcher も上書きする", () => {
    const catalog: CategoryTopicCatalog = {
      ...CATALOG,
      overrides: { "cook-annual-income": "wage" },
    };
    expect(
      resolveTopicKey(
        { key: "cook-annual-income", title: "飲食物調理従事者の平均年収" },
        catalog,
      ),
    ).toBe("wage");
  });

  it("matchers は配列順で先勝ちする", () => {
    // 「の平均年収$」と「年収」の両方に一致するが、先に定義した方を採る
    expect(
      resolveTopicKey(
        { key: "designer-annual-income", title: "デザイナーの平均年収" },
        CATALOG,
      ),
    ).toBe("occupation-income");
  });

  it("後方の広いパターンは、前方に一致しなかったものだけ拾う", () => {
    expect(
      resolveTopicKey(
        { key: "female-part-time-wage", title: "女性パートタイムの給与" },
        CATALOG,
      ),
    ).toBe("wage");
  });

  it("kakei-cat01 は前方一致で判定する", () => {
    expect(
      resolveTopicKey(
        { key: "natto-consumption-expenditure", title: "納豆消費支出額", cdCat01: "010530030" },
        CATALOG,
      ),
    ).toBe("food");
    expect(
      resolveTopicKey(
        { key: "tuna-consumption-expenditure", title: "まぐろ消費支出額", cdCat01: "010211010" },
        CATALOG,
      ),
    ).toBe("food");
  });

  it("kakei-cat01 の prefix 外は一致させない", () => {
    // 011100030 = 酒類。food の prefixes (0102 / 0105) に含まれない
    expect(
      resolveTopicKey(
        { key: "beer-consumption-expenditure", title: "ビール消費支出額", cdCat01: "011100030" },
        CATALOG,
      ),
    ).toBe(OTHER_TOPIC_KEY);
  });

  it("cdCat01 を持たない metric は kakei matcher に一致しない", () => {
    expect(
      resolveTopicKey({ key: "x", title: "何かの指標" }, CATALOG),
    ).toBe(OTHER_TOPIC_KEY);
    expect(
      resolveTopicKey({ key: "y", title: "何かの指標", cdCat01: null }, CATALOG),
    ).toBe(OTHER_TOPIC_KEY);
  });

  it("どの規則にも一致しなければ other へ落とす", () => {
    expect(
      resolveTopicKey({ key: "z", title: "労働災害度数率" }, CATALOG),
    ).toBe(OTHER_TOPIC_KEY);
  });

  it("matchers が空の topic は overrides でのみ到達できる", () => {
    const catalog: CategoryTopicCatalog = {
      categoryKey: "laborwage",
      topics: [{ key: "manual-only", label: "手動", matchers: [] }],
      overrides: { picked: "manual-only" },
    };
    expect(resolveTopicKey({ key: "picked", title: "何か" }, catalog)).toBe("manual-only");
    expect(resolveTopicKey({ key: "other-one", title: "何か" }, catalog)).toBe(OTHER_TOPIC_KEY);
  });

  it("正規表現キャッシュを挟んでも結果は変わらない", () => {
    const first = resolveTopicKey({ key: "a", title: "デザイナーの平均年収" }, CATALOG);
    clearTopicPatternCache();
    const second = resolveTopicKey({ key: "a", title: "デザイナーの平均年収" }, CATALOG);
    expect(second).toBe(first);
  });
});

describe("toTopicResolutionInput", () => {
  const base = {
    key: "apple-consumption-expenditure",
    title: "りんご消費支出額",
    unit: "円",
    category: "economy",
    entities: ["prefecture"],
  } as unknown as MetricConfig;

  it("家計調査の cdCat01 を取り出す", () => {
    const config = {
      ...base,
      source: {
        kind: "kakei-chousa",
        filter: { statsDataId: "0003348239", cdCat01: "010610010", cdCat02: "03" },
      },
    } as unknown as MetricConfig;
    expect(toTopicResolutionInput(config)).toEqual({
      key: "apple-consumption-expenditure",
      title: "りんご消費支出額",
      cdCat01: "010610010",
    });
  });

  it("家計調査以外は cdCat01 を持たない", () => {
    // e-Stat の cdCat01 は品目コードではないので流用してはならない
    const config = {
      ...base,
      source: { kind: "estat", statsDataId: "0000010201", cdCat01: "#A06601" },
    } as unknown as MetricConfig;
    expect(toTopicResolutionInput(config).cdCat01).toBeNull();
  });

  it("filter が無い / 文字列でない場合は null", () => {
    const noFilter = { ...base, source: { kind: "kakei-chousa" } } as unknown as MetricConfig;
    expect(toTopicResolutionInput(noFilter).cdCat01).toBeNull();

    const nested = {
      ...base,
      source: { kind: "kakei-chousa", filter: { cdCat01: { name: "x" } } },
    } as unknown as MetricConfig;
    expect(toTopicResolutionInput(nested).cdCat01).toBeNull();
  });
});
