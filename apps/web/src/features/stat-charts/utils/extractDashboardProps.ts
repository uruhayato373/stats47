import { logger } from "@stats47/logger";

import type {
  DashboardComponent,
  DashboardCommonProps,
  DashboardConfigMap,
  DashboardComponentType,
} from "../types";
import type { Area } from "@stats47/area";

/**
 * DashboardComponent (DB行) + Area を共通 props + 固有 config に分解する。
 * DashboardComponentRenderer で一度だけ呼び出し、結果をそのまま子コンポーネントに渡す。
 */
export function extractDashboardProps<T extends DashboardComponentType>(
  component: DashboardComponent,
  area: Area
): { common: DashboardCommonProps; config: DashboardConfigMap[T] } {
  let config: Record<string, unknown> = {};
  if (component.componentProps) {
    try {
      config = JSON.parse(component.componentProps) as Record<string, unknown>;
    } catch (e) {
      logger.warn(
        { componentId: component.id, componentType: component.componentType, error: e },
        "extractDashboardProps: componentProps の JSON パースに失敗"
      );
    }
  }

  const common: DashboardCommonProps = {
    title: component.title ?? "",
    area,
    rankingLink: component.rankingLink ?? undefined,
    rankingLinkLabel: (config.rankingLinkLabel as string) ?? undefined,
    sourceLink: component.sourceLink ?? undefined,
    sourceName: component.sourceName ?? undefined,
    dataSource: component.dataSource ?? "estat",
    annotation: (config.annotation as string) ?? undefined,
    rankingLinks: (config.rankingLinks as Array<{ label: string; url: string }>) ?? undefined,
  };

  return {
    common,
    config: config as DashboardConfigMap[T],
  };
}
