import { NextRequest, NextResponse } from "next/server";

import { listAllMetrics } from "@stats47/data-configs/registry";
import { describe, expect, it, vi } from "vitest";

import { getRankingRetirementResponse } from "@/lib/ranking-retirement-response";

import { GONE_RANKING_KEYS } from "@/config/gone-ranking-keys";
import { KNOWN_RANKING_KEYS } from "@/config/known-ranking-keys";
import { SITEMAP_RANKING_KEYS } from "@/config/sitemap-ranking-keys";

import { GET as getDownload } from "@/app/api/ranking/[rankingKey]/download/route";
import { GET as getData } from "@/app/api/ranking-data/[rankingKey]/route";
import middleware from "@/middleware";

vi.mock("@stats47/ranking/server", () => ({
  readRankingValuesFromR2: vi.fn(() => { throw new Error("retired data must not be read"); }),
  readRankingItemFromR2: vi.fn(() => { throw new Error("retired item must not be read"); }),
  getRankingDownloadSeries: vi.fn(() => { throw new Error("retired download must not be read"); }),
  buildAllBasesCsv: vi.fn(),
  buildSingleSeriesCsv: vi.fn(),
}));

const RETIRED = [
  "dam-count", "hydroelectric-power-plant-count", "thermal-power-plant-count",
  "nuclear-power-plant-count", "geothermal-power-plant-count",
  "wind-power-plant-count-facility", "biomass-power-station-count", "tourism-resource-count",
];
const LIVE = ["roadside-station-count", "fishing-port-count-ksj", "fishing-port-count-by-type"];

function request(path: string): NextRequest {
  const req = new NextRequest(`https://stats47.jp${path}`);
  Object.defineProperty(req, "nextUrl", { value: new URL(req.url) });
  return req;
}

describe("legacy KSJ retirement boundary", () => {
  it.each([...RETIRED, "fishing-port-count"])("%s is excluded from every active inventory", (key) => {
    expect(listAllMetrics().find((m) => m.key === key)?.isActive).toBe(false);
    expect(GONE_RANKING_KEYS.has(key)).toBe(true);
    expect(KNOWN_RANKING_KEYS.has(key)).toBe(false);
    expect(SITEMAP_RANKING_KEYS.has(key)).toBe(false);
  });

  it.each(RETIRED)("%s returns 410 before reading any stale snapshot", async (key) => {
    expect(middleware(request(`/ranking/${key}`)).status).toBe(410);
    for (const [get, path] of [
      [getData, `/api/ranking-data/${key}`],
      [getDownload, `/api/ranking/${key}/download`],
    ] as const) {
      const response = await get(request(path), { params: Promise.resolve({ rankingKey: key }) });
      expect(response.status).toBe(410);
      expect(response.headers.get("Cache-Control")).toContain("no-store");
    }
  });

  it.each(["/ranking/", "/ranking/prefecture/", "/api/ranking-data/", "/api/ranking/"])(
    "%s redirects only the duplicate key, preserving the complete query",
    async (prefix) => {
      const suffix = prefix === "/api/ranking/" ? "/download" : "";
      const path = `${prefix}fishing-port-count${suffix}?year=2006&utm_source=x&format=json`;
      const req = request(path);
      const response = prefix.startsWith("/ranking/")
        ? middleware(req)
        : await (suffix ? getDownload : getData)(req, { params: Promise.resolve({ rankingKey: "fishing-port-count" }) });
      expect(response.status).toBe(301);
      const destinationPrefix = prefix === "/ranking/prefecture/" ? "/ranking/" : prefix;
      expect(response.headers.get("Location")).toBe(
        `https://stats47.jp${destinationPrefix}fishing-port-count-ksj${suffix}?year=2006&utm_source=x&format=json`,
      );
    },
  );

  it.each(LIVE)("%s stays active and is not blocked by retirement", (key) => {
    expect(listAllMetrics().find((m) => m.key === key)?.isActive).toBe(true);
    expect(KNOWN_RANKING_KEYS.has(key)).toBe(true);
    expect(getRankingRetirementResponse(request(`/api/ranking-data/${key}`), key)).toBeNull();
    const originalNext = NextResponse.next;
    NextResponse.next = () => new NextResponse();
    try { expect(middleware(request(`/ranking/${key}`)).status).toBe(200); }
    finally { NextResponse.next = originalNext; }
  });

  it("旧カテゴリ形式の漁港URLもクエリ保持で新版へ直接転送する", () => {
    const response = middleware(request("/agriculture/fishery/ranking/fishing-port-count?utm_source=x"));
    expect(response.status).toBe(301);
    expect(response.headers.get("Location")).toBe("https://stats47.jp/ranking/fishing-port-count-ksj?utm_source=x");
  });
});
