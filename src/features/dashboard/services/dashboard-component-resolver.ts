/**
 * ダッシュボードコンポーネント解決システム
 * カテゴリ・サブカテゴリ・地域レベルに応じて適切なダッシュボードコンポーネントを解決
 */

import type { ComponentType } from "react";

import type { AreaType } from "@/features/area/types";
import { determineAreaType } from "@/features/area/utils/code-converter";

import type { DashboardProps } from "../types/dashboard";

/**
 * サブカテゴリ名をコンポーネント名に変換
 *
 * 例: "land-area" -> "LandArea"
 */
function subcategoryToComponentName(subcategory: string): string {
  return subcategory
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * 地域タイプからコンポーネント名のサフィックスを取得
 */
function getComponentSuffix(areaType: AreaType): string {
  switch (areaType) {
    case "national":
      return "NationalDashboard";
    case "prefecture":
      return "PrefectureDashboard";
    case "city":
      return "CityDashboard";
  }
}

/**
 * コンポーネント名を生成
 */
function getComponentName(subcategory: string, areaType: AreaType): string {
  const componentName = subcategoryToComponentName(subcategory);
  const suffix = getComponentSuffix(areaType);
  return `${componentName}${suffix}`;
}

/**
 * ダッシュボードコンポーネントを解決
 *
 * @param category - カテゴリキー
 * @param subcategory - サブカテゴリキー
 * @param areaCode - 地域コード
 * @returns ダッシュボードコンポーネント、またはnull（見つからない場合）
 */
export async function resolveDashboardComponent(
  category: string,
  subcategory: string,
  areaCode: string
): Promise<ComponentType<DashboardProps> | null> {
  try {
    // 地域タイプ判定
    const areaType = determineAreaType(areaCode);

    // コンポーネント名を生成
    const componentName = getComponentName(subcategory, areaType);

    // 動的インポートでコンポーネントを解決
    const componentModule = await import(
      `../components/${category}/${subcategory}/${componentName}`
    );

    // コンポーネントを取得
    const Component = componentModule[
      componentName
    ] as ComponentType<DashboardProps>;

    if (!Component) {
      console.warn(
        `[DashboardComponentResolver] Component ${componentName} not found in module`
      );
      return null;
    }

    return Component;
  } catch (error) {
    // コンポーネントが見つからない場合はnullを返す（フォールバック処理は呼び出し側で行う）
    if (
      error instanceof Error &&
      error.message.includes("Cannot find module")
    ) {
      console.log(
        `[DashboardComponentResolver] Component not found for ${category}/${subcategory}/${areaCode}: ${error.message}`
      );
      return null;
    }

    // その他のエラーは再スロー
    console.error(
      `[DashboardComponentResolver] Error resolving component:`,
      error
    );
    throw error;
  }
}
