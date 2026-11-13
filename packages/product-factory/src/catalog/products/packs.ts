/**
 * テーマパック・カタログ — P-01〜P-14。
 *
 * 記録の正本は台帳 `products.packs` (data/products/packs/packs.json + Schema)。ここは型を付け、
 * rankingKeys を生成物 (pack-rankingkeys.generated.ts) から id 単位で注入して export するだけで、記録を持たない
 * (2,000+ キーを JSON に転記しないため)。
 */
import type { ProductDefinition } from "../types";
import { PACK_RANKING_KEYS } from "../pack-rankingkeys.generated";
import data from "../../../../../data/products/packs/packs.json";

/** rankingKeys を id 単位で注入した最終カタログ (SSOT)。 */
export const PACKS: readonly ProductDefinition[] = Object.entries(data.packs).map(([id, pack]) => ({
  id,
  ...(pack as unknown as Omit<ProductDefinition, "id" | "rankingKeys">),
  rankingKeys: PACK_RANKING_KEYS[id] ?? [],
}));
