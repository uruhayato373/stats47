// @vitest-environment node
import { GIS_DATASETS_BY_ID, getKsjLicensePolicy } from "@stats47/gis/mlit-ksj/catalog";
import { describe, expect, it } from "vitest";

import { AD_FREE_PATH_PREFIXES } from "../ad-free-paths";
import { isAdFreePath } from "../constants";

/**
 * 広告を出さないページは GIS 台帳の利用条件から決まる (ad-free-paths.ts)。
 * 非商用の時系列 (高速道路 N06・鉄道 N05) と、公開している非商用・一部制限の単体 GIS ページは広告なし、
 * 商用可の空港時系列 (N08) や商用可の単体 GIS ページは広告を出せる。
 */
describe("isAdFreePath (台帳から導いた接頭辞)", () => {
  const isAdFree = (pathname: string | null) => isAdFreePath(pathname, AD_FREE_PATH_PREFIXES);

  it("非商用の時系列の路線網は、範囲のページも含めて広告なし", () => {
    expect(isAdFree("/geo/history/railway")).toBe(true);
    expect(isAdFree("/geo/history/expressway/kanto")).toBe(true);
    expect(isAdFree("/geo/history/expressway/28")).toBe(true);
  });

  it("重ね合わせ画面は、非商用の主題をクエリで足せるので常に広告なし", () => {
    expect(isAdFree("/geo/map")).toBe(true);
    expect(isAdFree("/geo/mapx")).toBe(false);
  });

  it("商用可の空港時系列と、データを描かない一覧ページは広告を出せる", () => {
    expect(isAdFree("/geo/history/airport")).toBe(false);
    expect(isAdFree("/geo/history/airport/01")).toBe(false);
    expect(isAdFree("/geo/history")).toBe(false);
  });

  it("単体 GIS ページは原典の利用条件で決まる (商用可の空港は広告可)", () => {
    expect(isAdFree("/geo/datasets/C28")).toBe(false);
    expect(isAdFree("/geo/datasets/N08")).toBe(false);
  });

  it("存在しない単体 GIS ページ (公開できない非商用のダム W01 など) を載せない", () => {
    // 一覧は全ページの RSC データに入るので、載せると Googlebot が 404 の URL を拾う (2026-11-23・GSC の 404 に 22 件)
    expect(isAdFree("/geo/datasets/W01")).toBe(false);
    for (const prefix of AD_FREE_PATH_PREFIXES.filter((p) => p.startsWith("/geo/datasets/"))) {
      const dataId = prefix.slice("/geo/datasets/".length);
      const meta = GIS_DATASETS_BY_ID.get(dataId);
      expect(meta && getKsjLicensePolicy(meta.license).sourcePublication).toBe("public-r2-eligible");
    }
  });

  it("高速道路網の変遷の節 (非商用の時系列) を埋め込む道路のテーマは広告なし", () => {
    expect(isAdFree("/themes/roads")).toBe(true);
  });

  it("同じ接頭辞で始まる別のページや他の地域分析には影響しない", () => {
    expect(isAdFree("/geo/history/railwayx")).toBe(false);
    expect(isAdFree("/geo/population-station-access")).toBe(false);
    expect(isAdFree("/themes/roadsx")).toBe(false);
    expect(isAdFree("/themes/railway")).toBe(false);
    expect(isAdFree(null)).toBe(false);
  });
});
