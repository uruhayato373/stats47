/**
 * ThemeCatalog レジストリ — カタログ駆動テーマの単一入口。
 *
 * ⚠️ ここに登録されたテーマだけが generator/validator の対象になる。
 * 未登録テーマ (legacy) は従来どおり手編集の IndicatorSet TS + page-components JSON を SSOT とする
 * (generator は触らない = golden diff ゼロ保証)。
 *
 * 横展開: テーマ 1 件ずつ catalog TS を追加 → ここに登録 → golden diff → commit。
 */
import type { ThemeCatalog } from "./types";
import { MANUFACTURING_CATALOG } from "./manufacturing";

export * from "./types";

/** カタログ駆動テーマの登録簿 (key → catalog)。 */
export const THEME_CATALOGS: Record<string, ThemeCatalog> = {
  manufacturing: MANUFACTURING_CATALOG,
};

/** 登録済みカタログ配列。 */
export function listThemeCatalogs(): ThemeCatalog[] {
  return Object.values(THEME_CATALOGS);
}
