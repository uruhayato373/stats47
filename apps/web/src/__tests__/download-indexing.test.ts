// @vitest-environment node
import { NextRequest } from "next/server";

import { getRankingDownloadSeries, buildSingleSeriesCsv, buildAllBasesCsv } from "@stats47/ranking/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/ranking/[rankingKey]/download/route";
import robots from "@/app/robots";

vi.mock("@stats47/ranking/server", () => ({
  getRankingDownloadSeries: vi.fn(),
  buildSingleSeriesCsv: vi.fn(() => "year,value\n2024,123\n"),
  buildAllBasesCsv: vi.fn(() => "year,original\n2024,123\n"),
  readRankingItemFromR2: vi.fn(async () => ({ success: true, data: null })),
}));

const values = [{ metricKey: "total-population", areaCode: "01000", areaName: "北海道", yearCode: "2024", yearName: "2024年", value: 123, unit: "人", rank: 1 }];

async function download(query: string, rankingKey = "total-population") {
  const req = new NextRequest(`https://stats47.jp/api/ranking/${rankingKey}/download?${query}`);
  Object.defineProperty(req, "nextUrl", { value: new URL(req.url) });
  return GET(req, { params: Promise.resolve({ rankingKey }) });
}

describe("公開ダウンロードの検索除外", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getRankingDownloadSeries).mockResolvedValue([{ basisKey: "original", basisLabel: "総数", values }]);
  });

  it.each(["format=csv", "format=json", "format=csv&basis=all-bases", "format=csv&encoding=sjis"])(
    "%s はダウンロードとキャッシュを維持し、検索除外をHTTPで伝える", async (query) => {
      const response = await download(query);
      expect(response.status).toBe(200);
      expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
      expect(response.headers.get("Content-Disposition")).toContain("attachment;");
      expect(response.headers.get("Cloudflare-CDN-Cache-Control")).toContain("max-age=");
      if (query.includes("json")) {
        expect(await response.json()).toEqual(values);
      } else {
        expect(response.headers.get("Content-Type")).toContain("text/csv");
        expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
        expect(query.includes("all-bases") ? buildAllBasesCsv : buildSingleSeriesCsv).toHaveBeenCalledOnce();
      }
    }
  );

  it.each(["", "format=html", "format=csv&basis=invalid", "format=csv&encoding=invalid"])(
    "不正パラメーター %s は取得処理前に400/noindex", async (query) => {
      const response = await download(query);
      expect(response.status).toBe(400);
      expect(response.headers.get("X-Robots-Tag")).toBe("noindex");
      expect(getRankingDownloadSeries).not.toHaveBeenCalled();
    }
  );

  it("データ不在は404/noindex、廃止は410を維持する", async () => {
    vi.mocked(getRankingDownloadSeries).mockResolvedValue([]);
    const missing = await download("format=csv");
    expect(missing.status).toBe(404);
    expect(missing.headers.get("X-Robots-Tag")).toBe("noindex");
    const retired = await download("format=csv", "dam-count");
    expect(retired.status).toBe(410);
    expect(retired.headers.get("X-Robots-Tag")).toBe("noindex");
  });

  it("noindexを読ませる例外をdownloadに限定し、内部API・管理画面とAI学習botは引き続き禁止する", () => {
    const rules = robots().rules;
    if (!Array.isArray(rules)) throw new Error("expected crawler groups");
    for (const userAgent of ["*", "Google-Extended"]) {
      const rule = rules.find((r) => r.userAgent === userAgent);
      expect(rule?.allow).toEqual(["/", "/ranking/*?norm=*", "/api/ranking/*/download$", "/api/ranking/*/download?"]);
      expect(rule?.disallow).toEqual(["/admin/*", "/api/*", "/profile/edit"]);
    }
    for (const userAgent of ["GPTBot", "CCBot"]) {
      expect(rules.find((r) => r.userAgent === userAgent)?.disallow).toEqual(["/"]);
    }
  });
});
