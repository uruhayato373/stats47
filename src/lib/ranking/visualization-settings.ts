/**
 * @deprecated このファイルは非推奨です。
 * 可視化設定はranking_itemsテーブルに統合されました。
 * 代わりに src/lib/ranking/ranking-items.ts を使用してください。
 *
 * 移行ガイド: ranking-tables-consolidation-guide.md
 */

// 後方互換性のため、一時的に残す
// TODO: すべてのコードを移行後に削除

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
      const data = (await response.json()) as VisualizationSettingsResponse;

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

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
      };

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
      const data = (await response.json()) as VisualizationSettingsResponse;

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

      const data = (await response.json()) as {
        success: boolean;
        message?: string;
        error?: string;
      };

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
