import { renderHook, waitFor } from "@testing-library/react";
import { useSavedMetadata } from "./useSavedMetadata";

// Mock fetch
global.fetch = jest.fn();

describe("useSavedMetadata", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with empty data", () => {
    const { result } = renderHook(() => useSavedMetadata());

    expect(result.current.data).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("should fetch data successfully", async () => {
    const mockData = [
      {
        id: 1,
        stats_data_id: "test-id",
        stat_name: "Test Stat",
        title: "Test Title",
        updated_at: "2023-01-01",
        created_at: "2023-01-01",
      },
    ];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: mockData }),
    });

    const { result } = renderHook(() => useSavedMetadata());

    await waitFor(() => {
      expect(result.current.data).toEqual(mockData);
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/estat/metainfo/stats-list?limit=100"
    );
  });

  it("should handle API error", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    const { result } = renderHook(() => useSavedMetadata());

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });

  it("should handle non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useSavedMetadata());

    await waitFor(() => {
      expect(result.current.data).toEqual([]);
    });
  });

  it("should refetch data when refetch is called", async () => {
    const { result } = renderHook(() => useSavedMetadata());

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ items: [] }),
    });

    await result.current.refetch();

    expect(global.fetch).toHaveBeenCalledTimes(2); // Initial + refetch
  });
});
