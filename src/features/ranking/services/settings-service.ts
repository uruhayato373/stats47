/**
 * Prefecture Ranking用の設定サービス
 * 削除されたVisualizationSettingsServiceの代替実装
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

export class PrefectureRankingSettingsService {
  /**
   * 値に変換係数と小数点以下桁数を適用
   */
  static applyConversion(
    value: number,
    conversionFactor: number,
    decimalPlaces: number
  ): number {
    const converted = value * conversionFactor;
    return Number(converted.toFixed(decimalPlaces));
  }

  /**
   * 値をフォーマットして文字列として返す
   */
  static formatValue(value: number, settings: VisualizationSettings): string {
    const converted = this.applyConversion(
      value,
      settings.conversion_factor,
      settings.decimal_places
    );
    return converted.toLocaleString();
  }

  /**
   * デフォルト設定を取得
   */
  static getDefaultSettings(
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

  /**
   * 設定を保存（APIエンドポイントへのリクエスト）
   */
  static async saveSettings(
    settings: Partial<VisualizationSettings>
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const response = await fetch("/api/visualization-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return { success: true, id: result.id };
    } catch (error) {
      console.error("Failed to save settings:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
