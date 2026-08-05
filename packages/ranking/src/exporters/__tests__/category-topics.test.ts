import { describe, expect, it } from "vitest";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";
import {
  CATEGORY_TOPIC_CATALOGS,
  OTHER_TOPIC_KEY,
  OTHER_TOPIC_LABEL,
  resolveTopicKey,
  toTopicResolutionInput,
  type CategoryTopicCatalog,
} from "@stats47/data-configs/topics";

/**
 * exporter が category items.json へ焼く topic の契約。
 *
 * exporter 本体は R2 へ書くため直接は呼べない。ここでは同じ手順
 * (カタログ引き → resolveTopicKey → マニフェスト組み立て) を再現し、
 * 出力の不変量を固定する。手順が exporter とずれたらこのテストの意味が薄れるので、
 * 変更時は `ranking-items-per-url-snapshot.ts` の該当ブロックと必ず見比べること。
 */

function lookupCatalog(categoryKey: string): CategoryTopicCatalog | undefined {
  return (CATEGORY_TOPIC_CATALOGS as Record<string, CategoryTopicCatalog | undefined>)[
    categoryKey
  ];
}

/** exporter と同じ手順で 1 カテゴリ分の topicKey とマニフェストを作る */
function bakeCategory(categoryKey: string) {
  const catalog = lookupCatalog(categoryKey);
  const metrics = Object.values(METRICS_REGISTRY).filter(
    (config) =>
      config.isActive !== false &&
      (config.category === categoryKey ||
        (config.additionalCategories ?? []).includes(categoryKey)),
  );

  const topicKeyByRankingKey = new Map<string, string>();
  const usedTopicKeys = new Set<string>();
  if (catalog) {
    for (const config of metrics) {
      const topicKey = resolveTopicKey(toTopicResolutionInput(config), catalog);
      topicKeyByRankingKey.set(config.key, topicKey);
      usedTopicKeys.add(topicKey);
    }
  }

  const topics = catalog
    ? [
        ...catalog.topics
          .filter((topic) => usedTopicKeys.has(topic.key))
          .map((topic) => ({ key: topic.key, label: topic.label })),
        ...(usedTopicKeys.has(OTHER_TOPIC_KEY)
          ? [{ key: OTHER_TOPIC_KEY, label: OTHER_TOPIC_LABEL }]
          : []),
      ]
    : undefined;

  return { catalog, metrics, topicKeyByRankingKey, topics };
}

describe("category items.json への topic 焼き込み", () => {
  it("マニフェストはカタログの定義順を保つ", () => {
    const { catalog, topics } = bakeCategory("laborwage");
    const catalogOrder = catalog!.topics.map((t) => t.key);
    const manifestOrder = topics!
      .map((t) => t.key)
      .filter((k) => k !== OTHER_TOPIC_KEY);
    // マニフェストはカタログ順の部分列になっている
    expect(manifestOrder).toEqual(
      catalogOrder.filter((k) => manifestOrder.includes(k)),
    );
  });

  it("受け皿 (other) は末尾に 1 つだけ付く", () => {
    const { topics } = bakeCategory("laborwage");
    const others = topics!.filter((t) => t.key === OTHER_TOPIC_KEY);
    expect(others).toHaveLength(1);
    expect(topics![topics!.length - 1].key).toBe(OTHER_TOPIC_KEY);
    expect(others[0].label).toBe(OTHER_TOPIC_LABEL);
  });

  it("該当 0 件の topic はマニフェストに出さない", () => {
    for (const categoryKey of Object.keys(CATEGORY_TOPIC_CATALOGS)) {
      const { topicKeyByRankingKey, topics } = bakeCategory(categoryKey);
      const used = new Set(topicKeyByRankingKey.values());
      for (const topic of topics ?? []) {
        expect(used.has(topic.key), `${categoryKey}/${topic.key}`).toBe(true);
      }
    }
  });

  it("全 item の topicKey がマニフェストのいずれかを指す", () => {
    // ここが崩れると UI がどの群にも入らない行を落とす
    for (const categoryKey of Object.keys(CATEGORY_TOPIC_CATALOGS)) {
      const { topicKeyByRankingKey, topics } = bakeCategory(categoryKey);
      const manifest = new Set((topics ?? []).map((t) => t.key));
      for (const [rankingKey, topicKey] of topicKeyByRankingKey) {
        expect(manifest.has(topicKey), `${categoryKey}/${rankingKey}`).toBe(true);
      }
    }
  });

  it("カタログ未登録カテゴリでは topics を焼かない (UI は平坦一覧へ縮退)", () => {
    const { topics, topicKeyByRankingKey } = bakeCategory("no-such-category");
    expect(topics).toBeUndefined();
    expect(topicKeyByRankingKey.size).toBe(0);
  });

  it("economy は家計調査コードで割れ、食料が中分類に分かれている", () => {
    const { topicKeyByRankingKey } = bakeCategory("economy");
    expect(topicKeyByRankingKey.get("apple-consumption-expenditure")).toBe("food-fruit");
    expect(topicKeyByRankingKey.get("beer-consumption-expenditure")).toBe("food-alcohol");
    expect(topicKeyByRankingKey.get("tuition-consumption-expenditure")).toBe("education");
  });
});
