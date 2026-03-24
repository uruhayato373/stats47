import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { buildGeoshapeExternalUrl } from "../../utils/geoshape-url-builder";
import {
  fetchFromExternalAPI,
  isExternalAPIAvailable,
} from "../geoshape-api-client";

import type { GeoshapeOptions } from "../../types/geoshape-options";
import type { TopoJSONTopology } from "@stats47/types";

// buildGeoshapeExternalUrlをモック
vi.mock("../../utils/geoshape-url-builder", () => ({
  buildGeoshapeExternalUrl: vi.fn(),
}));

// モック用のTopoJSONデータ
const createMockTopoJSON = (): TopoJSONTopology => ({
  type: "Topology",
  objects: {
    prefectures: {
      type: "GeometryCollection",
      geometries: [],
    },
  },
  arcs: [],
});

describe("geoshape-api-client", () => {
  const mockBuildGeoshapeExternalUrl = vi.mocked(buildGeoshapeExternalUrl);

  beforeEach(() => {
    vi.clearAllMocks();
    // デフォルトで正常なURLを返す
    mockBuildGeoshapeExternalUrl.mockReturnValue(
      "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson"
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchFromExternalAPI", () => {
    it("正常なTopoJSONデータを取得できる", async () => {
      const mockTopoJSON = createMockTopoJSON();
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(mockTopoJSON),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      const result = await fetchFromExternalAPI(options);

      expect(result).toEqual(mockTopoJSON);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: { "User-Agent": "stats47-app/1.0" },
          signal: expect.any(AbortSignal),
        })
      );
      if (mockBuildGeoshapeExternalUrl) {
        expect(mockBuildGeoshapeExternalUrl).toHaveBeenCalledWith(options);
      }
    });

    it("HTTPエラー（404）が発生した場合にエラーを throw する", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: vi.fn(),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      await expect(fetchFromExternalAPI(options)).rejects.toThrow(
        "HTTP error: 404 Not Found"
      );
    });

    it("HTTPエラー（500）が発生した場合にエラーを throw する", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        json: vi.fn(),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      await expect(fetchFromExternalAPI(options)).rejects.toThrow(
        "HTTP error: 500 Internal Server Error"
      );
    });

    it("無効なTopoJSON形式の場合にエラーを throw する", async () => {
      const invalidData = { type: "Invalid", data: "test" };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(invalidData),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      await expect(fetchFromExternalAPI(options)).rejects.toThrow(
        "Invalid TopoJSON format"
      );
    });

    it("nullが返された場合にエラーを throw する", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(null),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      await expect(fetchFromExternalAPI(options)).rejects.toThrow(
        "Invalid TopoJSON format"
      );
    });

    it("typeプロパティがTopologyでない場合にエラーを throw する", async () => {
      const invalidData = {
        type: "FeatureCollection",
        features: [],
      };
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(invalidData),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      await expect(fetchFromExternalAPI(options)).rejects.toThrow(
        "Invalid TopoJSON format"
      );
    });

    it("タイムアウトが発生した場合にエラーを throw する", async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";

      global.fetch = vi.fn().mockRejectedValue(abortError);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      await expect(fetchFromExternalAPI(options)).rejects.toThrow();
    });

    it("正しいURLとヘッダーでfetchを呼び出す", async () => {
      const mockTopoJSON = createMockTopoJSON();
      const mockUrl = "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson";
      mockBuildGeoshapeExternalUrl.mockReturnValue(mockUrl);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(mockTopoJSON),
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "city",
        prefCode: "47000",
        wardMode: "merged",
      };

      await fetchFromExternalAPI(options);

      expect(global.fetch).toHaveBeenCalledWith(
        mockUrl,
        expect.objectContaining({
          headers: { "User-Agent": "stats47-app/1.0" },
          signal: expect.any(AbortSignal),
        })
      );
    });
  });

  describe("isExternalAPIAvailable", () => {
    it("APIが利用可能な場合にtrueを返す", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      const result = await isExternalAPIAvailable(options);

      expect(result).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "HEAD",
          signal: expect.any(AbortSignal),
        })
      );
    });

    it("APIが利用不可（404）の場合にfalseを返す", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      const result = await isExternalAPIAvailable(options);

      expect(result).toBe(false);
    });

    it("APIが利用不可（500）の場合にfalseを返す", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      const result = await isExternalAPIAvailable(options);

      expect(result).toBe(false);
    });

    it("ネットワークエラーが発生した場合にfalseを返す", async () => {
      const networkError = new Error("Network error");
      global.fetch = vi.fn().mockRejectedValue(networkError);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      const result = await isExternalAPIAvailable(options);

      expect(result).toBe(false);
    });

    it("タイムアウトが発生した場合にfalseを返す", async () => {
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";

      global.fetch = vi.fn().mockRejectedValue(abortError);

      const options: GeoshapeOptions = {
        areaType: "prefecture",
      };

      const result = await isExternalAPIAvailable(options);

      expect(result).toBe(false);
    });

    it("正しいURLとHEADメソッドでfetchを呼び出す", async () => {
      const mockUrl = "https://geoshape.ex.nii.ac.jp/city/topojson/20230101/jp_pref.l.topojson";
      mockBuildGeoshapeExternalUrl.mockReturnValue(mockUrl);

      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
      };

      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const options: GeoshapeOptions = {
        areaType: "city",
        prefCode: "47000",
        wardMode: "merged",
      };

      await isExternalAPIAvailable(options);

      expect(global.fetch).toHaveBeenCalledWith(
        mockUrl,
        expect.objectContaining({
          method: "HEAD",
          signal: expect.any(AbortSignal),
        })
      );
      expect(mockBuildGeoshapeExternalUrl).toHaveBeenCalledWith(options);
    });
  });
});
