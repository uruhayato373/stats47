import { NextRequest } from "next/server";

import { describe, expect, it, vi } from "vitest";

const values = [
  { areaCode: "13000", areaName: "東京都", yearCode: "2025100000", yearName: "2025年", value: 100, unit: "人", rank: 1 },
  { areaCode: "01000", areaName: "北海道", yearCode: "2025100000", yearName: "2025年", value: 50, unit: "人", rank: 2 },
];

vi.mock("@stats47/ranking/server", () => ({
  getRankingDownloadSeries: vi.fn(async () => [{ basisKey: "original", basisLabel: "総数", values }]),
  buildSingleSeriesCsv: vi.fn(() => "﻿都道府県コード,都道府県名,2025年\n13000,東京都,100"),
  buildAllBasesCsv: vi.fn(() => ""),
}));

vi.mock("@stats47/visualization/server", () => ({
  readPrefectureFeatures: () => [
    { type: "Feature", properties: { N03_001: "東京都", N03_007: "13" }, geometry: { type: "Polygon", coordinates: [[[139, 35], [140, 35], [140, 36], [139, 35]]] } },
    { type: "Feature", properties: { N03_001: "北海道", N03_007: "01" }, geometry: { type: "Polygon", coordinates: [[[141, 43], [142, 43], [142, 44], [141, 43]]] } },
  ],
}));

const { GET } = await import("../route");

// テスト用の NextRequest (vitest.shims.ts) は nextUrl を持たないので、既存の route テストと同じく足す
const call = (query: string) => {
  const req = new NextRequest(`https://stats47.jp/api/ranking/total-population/download?${query}`);
  Object.defineProperty(req, "nextUrl", { value: new URL(req.url) });
  return GET(req, { params: Promise.resolve({ rankingKey: "total-population" }) });
};

describe("GET /api/ranking/[rankingKey]/download", () => {
  it("Shift_JIS 版は先頭の BOM を外し、見出しが「?」で始まらない", async () => {
    const res = await call("format=csv&basis=original&encoding=sjis");
    expect(res.headers.get("Content-Type")).toContain("Shift_JIS");
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes[0]).not.toBe(0x3f); // "?"
    const iconv = (await import("iconv-lite")).default;
    expect(iconv.decode(Buffer.from(bytes), "Shift_JIS").startsWith("都道府県コード")).toBe(true);
  });

  it("KML は地図用の Content-Type と全県の Placemark を返す", async () => {
    const res = await call("format=kml&basis=original");
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/vnd.google-earth.kml+xml");
    expect(res.headers.get("Content-Disposition")).toContain("total-population.kml");
    const body = await res.text();
    expect(body.match(/<Placemark>/g)).toHaveLength(2);
    expect(body).toContain("https://stats47.jp/ranking/total-population");
  });

  it("地図形式は全基準まとめ (all-bases) を受け付けない", async () => {
    const res = await call("format=geojson&basis=all-bases");
    expect(res.status).toBe(400);
  });
});
