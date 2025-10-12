import { renderHook, waitFor } from "@testing-library/react";
import { useItemNames } from "./useItemNames";

// Mock fetch
global.fetch = jest.fn();

describe("useItemNames", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should initialize with empty itemNames", () => {
    const { result } = renderHook(() => useItemNames());

    expect(result.current.itemNames).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it("should fetch item names successfully", async () => {
    const mockItemNames = ["項目1", "項目2", "項目3"];

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ itemNames: mockItemNames }),
    });

    const { result } = renderHook(() => useItemNames());

    await result.current.fetchItemNames("test-stats-id");

    expect(result.current.itemNames).toEqual(mockItemNames);
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/estat/metainfo/items?statsDataId=test-stats-id"
    );
  });

  it("should handle API error", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("API Error"));

    const { result } = renderHook(() => useItemNames());

    await result.current.fetchItemNames("test-stats-id");

    expect(result.current.itemNames).toEqual([]);
  });

  it("should handle non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useItemNames());

    await result.current.fetchItemNames("test-stats-id");

    expect(result.current.itemNames).toEqual([]);
  });

  it("should reset itemNames", () => {
    const { result } = renderHook(() => useItemNames());

    // Set some data first
    result.current.itemNames = ["項目1", "項目2"];

    result.current.reset();

    expect(result.current.itemNames).toEqual([]);
  });

  it("should set loading state during fetch", async () => {
    let resolvePromise: (value: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    (global.fetch as jest.Mock).mockReturnValueOnce(promise);

    const { result } = renderHook(() => useItemNames());

    const fetchPromise = result.current.fetchItemNames("test-stats-id");

    expect(result.current.loading).toBe(true);

    resolvePromise!({
      ok: true,
      json: async () => ({ itemNames: [] }),
    });

    await fetchPromise;

    expect(result.current.loading).toBe(false);
  });
});
