// @vitest-environment node
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { PREFECTURE_SVG_TOPOJSON_PATH } from "@/constants/static-assets";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../../..");

function source(path: string): string {
  return readFileSync(resolve(PROJECT_ROOT, path), "utf8");
}

const RANKING_MAP = "apps/web/src/features/ranking/components/RankingMapChart/RankingMapChartClient.tsx";
const PAGE_MODEL = "apps/web/src/features/ranking/services/load-ranking-page-model.ts";
const HEAD_ASSETS = "apps/web/src/features/ranking/components/RankingKeyPage/RankingPageHeadAssets.tsx";
const CLIENT_SHELL =
  "apps/web/src/features/ranking/components/RankingKeyPage/RankingPageClientShell.tsx";
const PUBLIC_TOPOJSON = "apps/web/public/prefecture-simple.topojson";

/**
 * ランキング地図の配信の契約。
 *
 * 2026-11-06 に背景タイルを外して SVG の地図にした。2026-08-02 にも背景を外したが、タイルの先読みだけが
 * ページに残り、描画されないタイルを高優先度で読んでいた (2026-08-03 に撤回)。先読みと描画を食い違わせない。
 */
describe("ranking map delivery contract", () => {
  it("does not preload map tiles for a map without tiles", () => {
    expect(source(HEAD_ASSETS)).not.toContain('rel="preload"');
    expect(source(PAGE_MODEL)).not.toContain("getInitialMapTileUrls");
    expect(source(RANKING_MAP)).not.toContain("tileUrl");
  });

  /**
   * 形データを RSC payload へ載せない契約。
   *
   * 経緯: サーバーが形データを props で client 境界へ渡しており、1,015,004 bytes が RSC payload へ
   * 直列化されていた (2026-08-05 実測で ranking HTML の約 82%)。
   */
  it("does not fetch the topology on the server", () => {
    const pageModel = source(PAGE_MODEL);
    expect(pageModel).not.toContain("fetchPrefectureTopology");
    expect(pageModel).not.toContain("topologyPromise");
  });

  it("does not hand the topology across the client boundary", () => {
    expect(source(CLIENT_SHELL)).not.toContain("topology=");
  });

  it("loads the simplified topology from a same-origin static asset", () => {
    expect(source(RANKING_MAP)).toContain("PREFECTURE_SVG_TOPOJSON_PATH");
    expect(PREFECTURE_SVG_TOPOJSON_PATH).toBe("/prefecture-simple.topojson");
    expect(existsSync(resolve(PROJECT_ROOT, PUBLIC_TOPOJSON))).toBe(true);
  });

  it("keeps the map code out of the initial JavaScript", () => {
    expect(source(RANKING_MAP)).toMatch(/dynamic\(\(\) => import\("\.\/RankingSvgMap"\)/);
  });
});
