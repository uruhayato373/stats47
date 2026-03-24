import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  fetchTopologyFromR2,
  isR2GeoshapeAvailable,
} from "../fetch-topology-from-r2";

import type { TopoJSONTopology } from "@stats47/types";

const createMockTopoJSON = (): TopoJSONTopology => ({
  type: "Topology",
  objects: {
    pref: {
      type: "GeometryCollection",
      geometries: [],
    },
  },
  arcs: [],
});

describe("fetch-topology-from-r2", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.NEXT_PUBLIC_R2_GEOSHAPE_URL;
    delete process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("isR2GeoshapeAvailable", () => {
    it("NEXT_PUBLIC_R2_GEOSHAPE_URL が設定されている場合に true を返す", () => {
      process.env.NEXT_PUBLIC_R2_GEOSHAPE_URL = "https://example.r2.dev";
      expect(isR2GeoshapeAvailable()).toBe(true);
    });

    it("NEXT_PUBLIC_R2_PUBLIC_URL が設定されている場合に true を返す", () => {
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://example.r2.dev";
      expect(isR2GeoshapeAvailable()).toBe(true);
    });

    it("いずれの環境変数も未設定の場合に false を返す", () => {
      expect(isR2GeoshapeAvailable()).toBe(false);
    });
  });

  describe("fetchTopologyFromR2", () => {
    it("R2 URL が未設定の場合にエラーを throw する", async () => {
      await expect(
        fetchTopologyFromR2({ areaType: "prefecture" })
      ).rejects.toThrow("R2 Geoshape のベース URL が未設定です");
    });

    it("正常な TopoJSON データを取得できる", async () => {
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://pub-example.r2.dev";
      const mockTopoJSON = createMockTopoJSON();
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(mockTopoJSON),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      const result = await fetchTopologyFromR2({ areaType: "prefecture" });

      expect(result).toEqual(mockTopoJSON);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://pub-example.r2.dev/gis/geoshape/20230101/jp_pref.l.topojson",
        expect.objectContaining({
          headers: { "User-Agent": "stats47-app/1.0" },
          signal: expect.any(AbortSignal),
        })
      );
    });

    it("NEXT_PUBLIC_R2_GEOSHAPE_URL を最優先で使用する", async () => {
      process.env.NEXT_PUBLIC_R2_GEOSHAPE_URL = "https://geoshape.r2.dev";
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://public.r2.dev";

      const mockTopoJSON = createMockTopoJSON();
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(mockTopoJSON),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      await fetchTopologyFromR2({ areaType: "prefecture" });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("geoshape.r2.dev"),
        expect.any(Object)
      );
    });

    it("末尾スラッシュを除去した URL を使用する", async () => {
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://pub-example.r2.dev/";
      const mockTopoJSON = createMockTopoJSON();
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(mockTopoJSON),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      await fetchTopologyFromR2({ areaType: "prefecture" });

      const calledUrl = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(calledUrl).not.toContain("//gis");
      expect(calledUrl).toBe(
        "https://pub-example.r2.dev/gis/geoshape/20230101/jp_pref.l.topojson"
      );
    });

    it("都道府県別市区町村の正しいパスでフェッチする", async () => {
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://pub-example.r2.dev";
      const mockTopoJSON = createMockTopoJSON();
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue(mockTopoJSON),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      await fetchTopologyFromR2({
        areaType: "city",
        prefCode: "47000",
        wardMode: "merged",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        "https://pub-example.r2.dev/gis/geoshape/20230101/47/47_city_dc.i.topojson",
        expect.any(Object)
      );
    });

    it("HTTP エラー（404）が発生した場合にエラーを throw する", async () => {
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://pub-example.r2.dev";
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: vi.fn(),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      await expect(
        fetchTopologyFromR2({ areaType: "prefecture" })
      ).rejects.toThrow("HTTP error: 404 Not Found");
    });

    it("HTTP エラー（403）が発生した場合にエラーを throw する", async () => {
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://pub-example.r2.dev";
      const mockResponse = {
        ok: false,
        status: 403,
        statusText: "Forbidden",
        json: vi.fn(),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      await expect(
        fetchTopologyFromR2({ areaType: "prefecture" })
      ).rejects.toThrow("HTTP error: 403 Forbidden");
    });

    it("無効な TopoJSON 形式の場合にエラーを throw する", async () => {
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://pub-example.r2.dev";
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: "OK",
        json: vi.fn().mockResolvedValue({ type: "Invalid" }),
      };
      global.fetch = vi.fn().mockResolvedValue(mockResponse as unknown as Response);

      await expect(
        fetchTopologyFromR2({ areaType: "prefecture" })
      ).rejects.toThrow("Invalid TopoJSON format");
    });

    it("タイムアウトが発生した場合にエラーを throw する", async () => {
      process.env.NEXT_PUBLIC_R2_PUBLIC_URL = "https://pub-example.r2.dev";
      const abortError = new Error("The operation was aborted");
      abortError.name = "AbortError";
      global.fetch = vi.fn().mockRejectedValue(abortError);

      await expect(
        fetchTopologyFromR2({ areaType: "prefecture" })
      ).rejects.toThrow();
    });
  });
});
