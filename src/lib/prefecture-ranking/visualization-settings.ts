/**
 * Prefecture Ranking用の可視化設定管理
 * ranking_itemsテーブルを使用してstatsDataId+cdCat01の組み合わせで可視化設定を管理
 */

export interface VisualizationSettings {
  id?: number;
  stats_data_id: string;
  cat01: string;
  map_color_scheme: string;
  map_diverging_midpoint: "zero" | "mean" | "median" | number;
  ranking_direction: "asc" | "desc";
  conversion_factor: number;
  decimal_places: number;
  created_at?: string;
  updated_at?: string;
}

export interface VisualizationSettingsResponse {
  success: boolean;
  found: boolean;
  rankingItem?: any;
  visualizationSettings: VisualizationSettings;
  error?: string;
}

/**
 * statsDataIdとcdCat01で可視化設定を取得
 */
export async function fetchVisualizationSettingsByStats(
  statsDataId: string,
  cdCat01: string
): Promise<VisualizationSettingsResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/ranking-items/by-stats?statsDataId=${encodeURIComponent(
      statsDataId
    )}&cdCat01=${encodeURIComponent(cdCat01)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: Failed to fetch visualization settings`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching visualization settings:", error);
    return {
      success: false,
      found: false,
      visualizationSettings: getDefaultSettings(statsDataId, cdCat01),
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * statsDataIdとcdCat01で可視化設定を保存
 */
export async function saveVisualizationSettingsForStats(
  statsDataId: string,
  cdCat01: string,
  settings: Partial<VisualizationSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const url = `${baseUrl}/api/ranking-items/manual`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        statsDataId,
        cdCat01,
        visualizationSettings: {
          map_color_scheme: settings.map_color_scheme,
          map_diverging_midpoint: settings.map_diverging_midpoint,
          ranking_direction: settings.ranking_direction,
          conversion_factor: settings.conversion_factor,
          decimal_places: settings.decimal_places,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.error || "Save failed" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error saving visualization settings:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * デフォルト設定を取得
 */
export function getDefaultSettings(
  statsDataId: string,
  cat01: string
): VisualizationSettings {
  return {
    stats_data_id: statsDataId,
    cat01: cat01,
    map_color_scheme: "interpolateBlues",
    map_diverging_midpoint: "zero",
    ranking_direction: "desc",
    conversion_factor: 1,
    decimal_places: 0,
  };
}
