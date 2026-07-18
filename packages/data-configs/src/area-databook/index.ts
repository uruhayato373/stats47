/**
 * AreaDatabook モジュールの入口。
 *
 * - `AREA_DATABOOK_TEMPLATE`: 47 県共通のセクション構成 (単一 SSOT)
 * - `AREA_EDITORIALS`: 県別編集コンテンツ (特産品・県シンボル)
 *
 * 規約: `.claude/rules/area-databook-standards.md`
 */
export * from "./types";
export { AREA_DATABOOK_TEMPLATE } from "./template";
export {
  listTemplateCharts,
  templateToPageComponentsJson,
  collectTemplateMetricKeys,
} from "./transform";
export { AREA_EDITORIALS, listAreaEditorials } from "./editorial";
