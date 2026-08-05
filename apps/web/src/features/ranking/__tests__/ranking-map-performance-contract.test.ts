import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const PROJECT_ROOT = resolve(import.meta.dirname, "../../../../../..");

function source(path: string): string {
  return readFileSync(resolve(PROJECT_ROOT, path), "utf8");
}

const RANKING_MAP = "apps/web/src/features/ranking/components/RankingMapChart/RankingMapChartClient.tsx";
const SHARED_MAP = "packages/visualization/src/leaflet/components/LeafletChoroplethMap.tsx";
const PAGE_MODEL = "apps/web/src/features/ranking/services/load-ranking-page-model.ts";
const CLIENT_SHELL =
  "apps/web/src/features/ranking/components/RankingKeyPage/RankingPageClientShell.tsx";
const PUBLIC_TOPOJSON = "apps/web/public/prefecture.topojson";

/**
 * ランキング地図のベースマップ契約。
 *
 * 経緯: 2026-08-02 の commit 2152490d が LCP 対策としてランキングページから
 * ベースマップタイルを外し、その状態を固定するテストを置いた。しかし
 * **タイルの preload だけがページモデルに残り**、描画されないタイルを
 * デスクトップで高優先度に 4 枚先読みする状態で本番配信されていた。
 * PSI は対策 16 時間後でも ranking 詳細が LCP 5.2〜7.0s のままで改善は確認できず、
 * 2026-08-03 にオーナー判断で対策を撤回した。
 *
 * このテストは「背景を消さない」ことではなく、**preload と描画が食い違わない**ことを
 * 守る。片方だけを消す変更は、どちらの方向でもここで落ちる。
 */
describe("ranking map base tile contract", () => {
  it("renders a base tile layer on the ranking map", () => {
    const rankingMap = source(RANKING_MAP);
    expect(rankingMap).toContain("tileUrl={currentTile.url}");
    expect(rankingMap).toContain("attribution={currentTile.attribution}");
  });

  it("lets the reader switch tile providers", () => {
    expect(source(RANKING_MAP)).toContain("<TileSwitcher");
  });

  it("requires a tile url on the shared map so a missing base map cannot type-check", () => {
    const sharedMap = source(SHARED_MAP);
    // optional (`tileUrl?:`) に戻すと、引数を落とす変更が型検査を通ってしまう
    expect(sharedMap).toContain("tileUrl: string;");
    expect(sharedMap).not.toContain("tileUrl?: string;");
    expect(sharedMap).toContain("<TileLayer url={tileUrl} attribution={attribution} />");
  });

  /**
   * 都道府県 TopoJSON を RSC payload へ載せない契約。
   *
   * 経緯: サーバーが fetchPrefectureTopology() の結果を props で client 境界へ渡しており、
   * 1,015,004 bytes が RSC payload へ直列化されていた。2026-08-05 実測で ranking HTML は
   * 非圧縮 1,232,628 bytes、その約 82% がこれ。地図は next/dynamic の ssr:false なので
   * サーバーでは一度も描画されず、hydration まで使われない純粋な無駄だった。
   */
  it("does not fetch the prefecture topology on the server", () => {
    const pageModel = source(PAGE_MODEL);
    expect(pageModel).not.toContain("fetchPrefectureTopology");
    expect(pageModel).not.toContain("topologyPromise");
  });

  it("does not hand the topology across the client boundary", () => {
    // ここで props に載せると 1MB が毎リクエストの HTML に戻る
    expect(source(CLIENT_SHELL)).not.toContain("topology=");
  });

  it("loads the prefecture topology from a same-origin static asset", () => {
    const mapClient = source(RANKING_MAP);
    expect(mapClient).toContain('"/prefecture.topojson"');
    expect(existsSync(resolve(PROJECT_ROOT, PUBLIC_TOPOJSON))).toBe(true);
  });

  it("keeps the tile preload and the tile layer in sync", () => {
    const preloadsTiles = source(PAGE_MODEL).includes("getInitialMapTileUrls");
    const rendersTiles = source(RANKING_MAP).includes("tileUrl=");
    // 先読みだけ残す / 描画だけ残す のどちらも無駄か表示欠落になる
    expect(preloadsTiles).toBe(rendersTiles);
  });
});
