/**
 * ダッシュボードコンポーネント解決システム
 * カテゴリ・サブカテゴリ・地域レベルに応じて適切なダッシュボードコンポーネントを解決
 */

import type { ComponentType } from "react";

import { determineAreaType } from "@/features/area/utils/code-converter";

import type { AreaLevel, DashboardComponent, DashboardProps } from "../types/dashboard";

/**
 * 地域コードから地域レベルを判定
 */
export function determineAreaLevel(areaCode: string): AreaLevel {
  if (areaCode === "00000") {
    return "national";
  }

  // 都道府県レベル（末尾が000）
  if (areaCode.endsWith("000") && areaCode.length === 5) {
    return "prefecture";
  }

  // 市区町村レベル（5桁で末尾が000以外）
  if (areaCode.length === 5) {
    return "municipality";
  }

  throw new Error(`Invalid area code format: ${areaCode}`);
}

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
 * 地域レベルからコンポーネント名のサフィックスを取得
 */
function getComponentSuffix(areaLevel: AreaLevel): string {
  switch (areaLevel) {
    case "national":
      return "NationalDashboard";
    case "prefecture":
      return "PrefectureDashboard";
    case "municipality":
      return "CityDashboard";
  }
}

/**
 * コンポーネント名を生成
 */
function getComponentName(
  subcategory: string,
  areaLevel: AreaLevel
): string {
  const componentName = subcategoryToComponentName(subcategory);
  const suffix = getComponentSuffix(areaLevel);
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
    // 地域レベル判定
    const areaLevel = determineAreaLevel(areaCode);
    const areaType = determineAreaType(areaCode);

    // コンポーネント名を生成
    const componentName = getComponentName(subcategory, areaLevel);

    // 動的インポートでコンポーネントを解決
    const module = await import(
      `../components/${category}/${subcategory}/${componentName}`
    );

    // コンポーネントを取得
    const Component = module[componentName] as ComponentType<DashboardProps>;

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

