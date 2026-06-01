import type { ComponentType } from "react";

import { ThemeDepopulationMedicalSection } from "@/features/depopulation-medical";
import { ThemeFinanceFlowSection } from "@/features/finance-flow";
import { ThemeHighwayTimelineSection } from "@/features/highway-history";
import { ThemeMigrationFlowSection } from "@/features/migration-flow";
import { ThemeStationPassengersSection } from "@/features/station-passengers";
import { ThemeSunshineMapSection } from "@/features/sunshine-map";


/**
 * テーマダッシュボードに埋め込む GIS マップ section の registry。
 *
 * ThemeConfig.embeddedSections のキーから component を解決する。旧来 ThemePageLayout 内の
 * `themeKey === "..."` ハードコード分岐を data 駆動に一般化したもの。1 つの section を
 * 複数テーマから再利用できる (例: depopulation-medical を healthcare / aging-society で共用)。
 *
 * client section (migration-flow / station-passengers / depopulation-medical / sunshine-map) と
 * async server component (highway) が混在するが、いずれも引数なしで描画できる。
 */
export const THEME_SECTION_REGISTRY: Record<string, ComponentType> = {
  "migration-flow": ThemeMigrationFlowSection,
  "finance-flow": ThemeFinanceFlowSection,
  highway: ThemeHighwayTimelineSection,
  "station-passengers": ThemeStationPassengersSection,
  "depopulation-medical": ThemeDepopulationMedicalSection,
  "sunshine-map": ThemeSunshineMapSection,
};
