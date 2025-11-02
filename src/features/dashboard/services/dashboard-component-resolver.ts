/**
 * ダッシュボードコンポーネント取得システム
 *
 * カテゴリ・サブカテゴリ・地域タイプに応じて適切なダッシュボードコンポーネントを
 * 動的インポートで取得する。
 */

import type { ComponentType } from "react";

import type { AreaType } from "@/features/area/types";
import { determineAreaType } from "@/features/area/utils/code-converter";

import type { DashboardProps } from "../types/dashboard";

/**
 * サブカテゴリ名をコンポーネント名に変換
 *
 * 例: "land-area" -> "LandArea"
 *
 * @param subcategory - サブカテゴリキー（ハイフン区切り）
 * @returns 変換されたコンポーネント名（PascalCase）
 */
function convertSubcategoryToComponentName(subcategory: string): string {
  return subcategory
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

/**
 * 地域タイプからコンポーネント名のサフィックスを構築
 *
 * @param areaType - 地域タイプ
 * @returns コンポーネント名のサフィックス（例: "NationalDashboard"）
 */
function buildComponentSuffix(areaType: AreaType): string {
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
 * ダッシュボードコンポーネント名を構築
 *
 * サブカテゴリ名と地域タイプから完全なコンポーネント名を生成する。
 *
 * @param subcategory - サブカテゴリキー
 * @param areaType - 地域タイプ
 * @returns 完全なコンポーネント名（例: "LandAreaPrefectureDashboard"）
 */
function buildComponentName(subcategory: string, areaType: AreaType): string {
  const componentName = convertSubcategoryToComponentName(subcategory);
  const suffix = buildComponentSuffix(areaType);
  return `${componentName}${suffix}`;
}

/**
 * ダッシュボードコンポーネントを取得
 *
 * カテゴリ・サブカテゴリ・地域コードに基づいて、適切なダッシュボードコンポーネントを
 * 動的インポートで取得する。
 *
 * @param category - カテゴリキー
 * @param subcategory - サブカテゴリキー
 * @param areaCode - 地域コード
 * @returns ダッシュボードコンポーネント、またはnull（見つからない場合）
 */
export async function fetchDashboardComponent(
  category: string,
  subcategory: string,
  areaCode: string
): Promise<ComponentType<DashboardProps> | null> {
  try {
    // 地域タイプ判定
    const areaType = determineAreaType(areaCode);

    // コンポーネント名を構築
    const componentName = buildComponentName(subcategory, areaType);

    // 動的インポートでコンポーネントを取得
    const componentModule = await import(
      `../components/${category}/${subcategory}/${componentName}`
    );

    // コンポーネントを抽出
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
      `[DashboardComponentResolver] Error fetching component:`,
      error
    );
    throw error;
  }
}
