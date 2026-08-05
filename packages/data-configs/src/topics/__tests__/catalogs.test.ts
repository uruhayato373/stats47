import { describe, expect, it } from "vitest";

import { METRICS_REGISTRY } from "../../registry";
import { CATEGORY_TOPIC_CATALOGS, listTopicCatalogs } from "../index";
import { toTopicResolutionInput } from "../from-metric";
import { resolveTopicKey } from "../resolve-topic";
import { OTHER_TOPIC_KEY } from "../types";
import { CATEGORY_KEYS } from "../../types";

/**
 * カタログの分類結果を代表例で凍結する。
 *
 * **件数や比率は凍結しない** — metric が増えるたびに落ちて、実際の欠陥ではない
 * failure を生むため。凍結するのは「この metric はこの群に入る」という写像だけ。
 */
const REPRESENTATIVE: Array<[category: string, metricKey: string, topicKey: string]> = [
  // laborwage: 語尾規則と先勝ち
  ["laborwage", "cook-annual-income", "occupation-income"],
  ["laborwage", "active-job-opening-ratio", "job-opening"],
  ["laborwage", "labor-expenses-prefecture", OTHER_TOPIC_KEY], // overrides で受け皿へ

  // economy: 家計調査コードによる分類 (タイトルの語彙に依存しない)
  ["economy", "apple-consumption-expenditure", "food-fruit"],
  ["economy", "natto-consumption-expenditure", "food-vegetable"],
  ["economy", "tuna-consumption-expenditure", "food-seafood"],
  ["economy", "beer-consumption-expenditure", "food-alcohol"],
  ["economy", "air-conditioner-consumption-expenditure", "furniture"],
  ["economy", "tuition-consumption-expenditure", "education"],
];

describe("topic カタログ", () => {
  it("17 カテゴリすべてに登録がある", () => {
    const registered = listTopicCatalogs().map((c) => c.categoryKey).sort();
    expect(registered).toEqual([...CATEGORY_KEYS].sort());
  });

  it("categoryKey とレジストリのキーが一致する", () => {
    for (const [key, catalog] of Object.entries(CATEGORY_TOPIC_CATALOGS)) {
      expect(catalog?.categoryKey).toBe(key);
    }
  });

  it("代表 metric が期待した群に入る", () => {
    for (const [category, metricKey, expected] of REPRESENTATIVE) {
      const config = METRICS_REGISTRY[metricKey];
      expect(config, `${metricKey} が registry に無い`).toBeTruthy();
      const catalog = CATEGORY_TOPIC_CATALOGS[category as never];
      expect(catalog, `${category} のカタログが無い`).toBeTruthy();
      const actual = resolveTopicKey(toTopicResolutionInput(config!), catalog!);
      expect(actual, `${metricKey}`).toBe(expected);
    }
  });

  it("どの metric も解決が例外を投げない", () => {
    // 不正な正規表現がカタログへ混入すると本番の exporter が落ちる
    for (const config of Object.values(METRICS_REGISTRY)) {
      const catalog = CATEGORY_TOPIC_CATALOGS[config.category];
      if (!catalog) continue;
      expect(() =>
        resolveTopicKey(toTopicResolutionInput(config), catalog),
      ).not.toThrow();
    }
  });

  it("解決結果は必ずカタログの topic か other のいずれか", () => {
    for (const catalog of listTopicCatalogs()) {
      const valid = new Set([...catalog.topics.map((t) => t.key), OTHER_TOPIC_KEY]);
      for (const config of Object.values(METRICS_REGISTRY)) {
        if (config.category !== catalog.categoryKey) continue;
        const key = resolveTopicKey(toTopicResolutionInput(config), catalog);
        expect(valid.has(key), `${config.key} → ${key}`).toBe(true);
      }
    }
  });
});
