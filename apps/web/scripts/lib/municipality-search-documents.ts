import type { MetricConfig } from "@stats47/data-configs";

import type { SearchDocument } from "../../src/features/search/types/search.types";

/**
 * 公開中の市区町村ランキングを検索索引の文書にする。
 *
 * R2 の item.json を 1 件ずつ読むと build が遅くなる (716 件) ため、公開集合 (市区町村カタログ) と
 * git TS の指標設定だけから組み立てる。表示名は市区町村ランキングのページと同じ「title（subtitle）」の材料を持つ。
 */
export function buildMunicipalitySearchDocuments(
  rankingKeys: Iterable<string>,
  getConfig: (key: string) => MetricConfig | undefined,
  getCategoryName: (categoryKey: string) => string | null | undefined,
): SearchDocument[] {
  const documents: SearchDocument[] = [];
  for (const key of [...rankingKeys].sort()) {
    const config = getConfig(key);
    if (!config) throw new Error(`公開中の市区町村ランキングに指標設定がありません: ${key}`);
    documents.push({
      id: `municipality-ranking_${key}`,
      title: config.title,
      subtitle: config.subtitle ?? undefined,
      // 「市区町村」で絞り込めるよう、検索対象の description に種別名を含める
      description: ["市区町村ランキング", config.subtitle, config.description].filter(Boolean).join(" "),
      type: "municipality-ranking",
      url: `/municipalities/ranking/${key}`,
      category: getCategoryName(config.category) ?? undefined,
      categoryKey: config.category,
    });
  }
  return documents;
}
