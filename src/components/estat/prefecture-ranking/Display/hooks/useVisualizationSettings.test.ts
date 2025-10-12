import { renderHook, waitFor } from "@testing-library/react";
import { useVisualizationSettings } from "./useVisualizationSettings";

// Mock fetch
global.fetch = jest.fn();

describe("useVisualizationSettings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with null settings", () => {
    const { result } = renderHook(() =>
      useVisualizationSettings({
        statsDataId: "test-id",
        categoryCode: "test-category",
      })
    );

    expect(result.current.settings).toBeNull();
    expect(result.current.editableSettings).toEqual({});
    expect(result.current.loading).toBe(false);
    expect(result.current.saving).toBe(false);
    expect(result.current.saveSuccess).toBe(false);
  });

  it("should load settings when statsDataId and categoryCode are provided", async () => {
    const mockSettings = {
      stats_data_id: "test-id",
      cat01: "test-category",
      map_color_scheme: "viridis",
      map_diverging_midpoint: "mean",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockSettings,
    });

    const { result } = renderHook(() =>
      useVisualizationSettings({
        statsDataId: "test-id",
        categoryCode: "test-category",
      })
    );

    await waitFor(() => {
      expect(result.current.settings).toEqual(mockSettings);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/estat/prefecture-ranking/visualization-settings?statsDataId=test-id&categoryCode=test-category"
    );
  });

  it("should handle API error gracefully", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    const { result } = renderHook(() =>
      useVisualizationSettings({
        statsDataId: "test-id",
        categoryCode: "test-category",
      })
    );

    await waitFor(() => {
      expect(result.current.settings).toBeNull();
    });
  });

  it("should save settings successfully", async () => {
    const mockSettings = {
      stats_data_id: "test-id",
      cat01: "test-category",
      map_color_scheme: "viridis",
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    const { result } = renderHook(() =>
      useVisualizationSettings({
        statsDataId: "test-id",
        categoryCode: "test-category",
      })
    );

    await result.current.saveSettings(mockSettings);

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/estat/prefecture-ranking/visualization-settings",
      expect.objectContaining({
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockSettings),
      })
    );
  });
});
