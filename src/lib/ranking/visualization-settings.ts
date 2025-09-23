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
  settings: VisualizationSettings;
  isDefault: boolean;
  error?: string;
}

export class VisualizationSettingsService {
  private static readonly API_BASE = "/api/ranking/visualization-settings";

  static async fetchSettings(
    statsDataId: string,
    cat01: string
  ): Promise<VisualizationSettingsResponse> {
    try {
      const params = new URLSearchParams({
        statsDataId,
        cat01,
      });

      const response = await fetch(`${this.API_BASE}?${params}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch visualization settings");
      }

      return data;
    } catch (error) {
      console.error("Error fetching visualization settings:", error);
      return {
        success: false,
        settings: this.getDefaultSettings(statsDataId, cat01),
        isDefault: true,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  static async saveSettings(
    settings: Partial<VisualizationSettings>
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const response = await fetch(this.API_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(settings),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save visualization settings");
      }

      return data;
    } catch (error) {
      console.error("Error saving visualization settings:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

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

  static applyConversion(
    value: number,
    conversionFactor: number,
    decimalPlaces: number
  ): number {
    const converted = value * conversionFactor;
    return Number(converted.toFixed(decimalPlaces));
  }

  static formatValue(value: number, settings: VisualizationSettings): string {
    const converted = this.applyConversion(
      value,
      settings.conversion_factor,
      settings.decimal_places
    );
    return converted.toLocaleString();
  }
}
