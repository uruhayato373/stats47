import { CATEGORY_KEYS } from "@stats47/data-configs/category-keys";

/**
 * レガシー URL 構造 (`/{cat}/{sub}/dashboard|ranking/{x}` 等) の判定に使うカテゴリキー集合。
 *
 * 現行カテゴリのキー (data/categories/categories.json) から生成した `CATEGORY_KEYS` をそのまま使う。
 * middleware は Edge ランタイムで動くため、metric registry まで抱える `@stats47/data-configs` の
 * ルートは import せず、何も import しない軽い subpath `@stats47/data-configs/category-keys` だけを読む
 * (`__tests__/legacy-category-keys.test.ts` がこの経路を固定する)。
 */
export const LEGACY_CATEGORY_KEYS_SET: ReadonlySet<string> = new Set(CATEGORY_KEYS);
