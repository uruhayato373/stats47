/**
 * レガシー URL 構造 (`/{cat}/{sub}/dashboard|ranking/{x}` 等) の判定に使うカテゴリキー集合。
 *
 * これは **現行カテゴリキー (data-configs `CATEGORIES`) と一致している必要がある**。
 * middleware は Edge ランタイムで動くため、metric registry まで抱える `@stats47/data-configs`
 * を直接 import するとバンドルが肥大化する。そこでキーだけを本ファイルに固定し、
 * data-configs との乖離は `__tests__/legacy-category-keys.test.ts` (CI) で検出する
 * (drift したら test fail = silent drift を防ぐ)。
 *
 * カテゴリを追加/リネームしたら CATEGORIES と本配列の両方を更新すること。
 */
const LEGACY_CATEGORY_KEYS = [
  "administrativefinancial",
  "agriculture",
  "commercial",
  "construction",
  "economy",
  "educationsports",
  "energy",
  "ict",
  "infrastructure",
  "international",
  "laborwage",
  "landweather",
  "miningindustry",
  "population",
  "safetyenvironment",
  "socialsecurity",
  "tourism",
] as const;

export const LEGACY_CATEGORY_KEYS_SET: ReadonlySet<string> = new Set(
  LEGACY_CATEGORY_KEYS,
);
