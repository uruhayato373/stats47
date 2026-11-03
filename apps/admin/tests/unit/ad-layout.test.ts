import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * 広告の配置 (/affiliate/layout) のサーバー層。
 *
 * 意図: ①撮影は日付ごとに残るので、manifest のある最新の日付を読む (撮影の途中で止まった日・日付でない置き場を拾わない)
 *   ②台帳の行の AdSense のユニットは撮影スクリプトと同じ規則で決める (adsenseSlot → marker の定数名 → ページ末の枠)。
 *   違う規則で決めると、画面の「台帳にあり写っていない」が実際と食い違う ③PR の行にユニットを付けない
 */

const LEDGER = JSON.stringify({
  slotTypes: [
    { id: "adsense-body", name: "本文の AdSense", provider: "adsense", devices: ["desktop"] },
    { id: "adsense-footer", name: "ページ末の AdSense", provider: "adsense", devices: ["desktop"] },
    { id: "affiliate-row", name: "本文の PR の列", provider: "affiliate", devices: ["desktop", "mobile"] },
  ],
  pages: {
    survey: [
      { slot: "adsense-body", region: "body", position: "上", marker: "<InContentAdSlot slot={HUB_INCONTENT} />" },
      { slot: "affiliate-row", region: "body", position: "中", marker: 'position="survey-native"' },
      { slot: "adsense-footer", region: "body", position: "下", marker: "<FooterAdSlot />", condition: "注意がある調査だけ" },
    ],
    ranking: [{ slot: "adsense-body", region: "body", position: "上", marker: "x", adsenseSlot: "RANKING_INCONTENT_MOBILE" }],
  },
});

const manifest = (date: string) => JSON.stringify({ generatedAt: `${date}T00:00:00Z`, date, baseUrl: "http://localhost:3000", widths: [390], pageTypes: [], shots: [] });

async function load(root: string) {
  process.env.STATS47_PROJECT_ROOT = root;
  vi.resetModules();
  return import("@/lib/server/ad-layout");
}

let root: string | null = null;
afterEach(() => {
  delete process.env.STATS47_PROJECT_ROOT;
  if (root) cleanupFixtureRoot(root);
  root = null;
});

describe("latestAdLayoutManifest", () => {
  it("manifest のある最新の日付を読み、manifest の無い日付・日付でない置き場は飛ばす", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        ".local/ad-layout/2026-11-01/manifest.json": manifest("2026-11-01"),
        ".local/ad-layout/2026-11-02/manifest.json": manifest("2026-11-02"),
        ".local/ad-layout/2026-11-03/survey-390.png": "x",
        ".local/ad-layout/latest/manifest.json": manifest("2099-01-01"),
      },
    });
    expect((await load(root)).latestAdLayoutManifest()?.date).toBe("2026-11-02");
  });

  it("まだ撮影していなければ null", async () => {
    root = makeFixtureRoot();
    expect((await load(root)).latestAdLayoutManifest()).toBeNull();
  });
});

describe("placementDefinitions", () => {
  it("AdSense の行は adsenseSlot か marker の定数名からユニットを決め、PR の行にはユニットを付けない", async () => {
    root = makeFixtureRoot({ stateFiles: { "config/ads/placements.json": LEDGER } });
    const defs = (await load(root)).placementDefinitions();
    expect(defs.survey.map((d) => [d.slotName, d.unit, d.condition])).toEqual([
      ["本文の AdSense", "HUB_INCONTENT", null],
      ["本文の PR の列", null, null],
      ["ページ末の AdSense", "CONTENT_FOOTER", "注意がある調査だけ"],
    ]);
    expect(defs.ranking[0].unit).toBe("RANKING_INCONTENT_MOBILE");
  });
});
