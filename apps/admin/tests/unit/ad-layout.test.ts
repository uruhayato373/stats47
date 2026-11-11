import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * 広告の配置 (/affiliate/layout) のサーバー層。
 *
 * 意図: ①撮影は日付ごとに残るので、manifest のある最新の日付を読む (撮影の途中で止まった日・日付でない置き場を拾わない)
 *   ②台帳の行の AdSense のユニットは撮影スクリプトと同じ規則で決める (adsenseSlot → marker の定数名 → ページ末の枠)。
 *   違う規則で決めると、画面の「台帳にあり写っていない」が実際と食い違う ③PR の行にユニットを付けない
 *   ④撮影が番号で記録したユニットは、台帳と同じ定数名に直して読む (直さないと段の正しい枠まで「台帳に無い」と出る)
 */

const ADSENSE_CONSTANTS = "apps/web/src/lib/google-adsense/constants.ts";
const CONSTANTS = 'export const HUB_INCONTENT: AdSlotConfig = {\n  slotId: "9995373035",\n};\n';

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
        [ADSENSE_CONSTANTS]: CONSTANTS,
        ".local/ad-layout/2026-11-01/manifest.json": manifest("2026-11-01"),
        ".local/ad-layout/2026-11-02/manifest.json": manifest("2026-11-02"),
        ".local/ad-layout/2026-11-03/survey-390.png": "x",
        ".local/ad-layout/latest/manifest.json": manifest("2099-01-01"),
      },
    });
    expect((await load(root)).latestAdLayoutManifest()?.date).toBe("2026-11-02");
  });

  it("番号で記録したユニットを定数名に直し、表示の文字も合わせる", async () => {
    const ad = { kind: "adsense", slotType: null, unit: "9995373035", label: "広告 (AdSense: 9995373035)", region: "body", x: 0, y: 0, width: 300, height: 250 };
    root = makeFixtureRoot({
      stateFiles: {
        [ADSENSE_CONSTANTS]: CONSTANTS,
        ".local/ad-layout/2026-11-02/manifest.json": JSON.stringify({ ...JSON.parse(manifest("2026-11-02")), shots: [{ ads: [ad] }] }),
      },
    });
    const loaded = (await load(root)).latestAdLayoutManifest()?.shots[0].ads[0];
    expect([loaded?.unit, loaded?.label]).toEqual(["HUB_INCONTENT", "広告 (AdSense: HUB_INCONTENT)"]);
  });

  it("まだ撮影していなければ null", async () => {
    root = makeFixtureRoot();
    expect((await load(root)).latestAdLayoutManifest()).toBeNull();
  });
});

describe("placementDefinitions", () => {
  it("AdSense の行は adsenseSlot か marker の定数名からユニットを決め、PR の行にはユニットを付けない", async () => {
    root = makeFixtureRoot({ stateFiles: { "data/ads/placements.json": LEDGER } });
    const defs = (await load(root)).placementDefinitions();
    expect(defs.survey.map((d) => [d.slotName, d.unit, d.condition])).toEqual([
      ["本文の AdSense", "HUB_INCONTENT", null],
      ["本文の PR の列", null, null],
      ["ページ末の AdSense", "CONTENT_FOOTER", "注意がある調査だけ"],
    ]);
    expect(defs.ranking[0].unit).toBe("RANKING_INCONTENT_MOBILE");
  });

  it("広告の段の枠を左から順に読み、ユニットを決めていない枠は null にする", async () => {
    const ledger = JSON.stringify({
      slotTypes: [{ id: "ad-row", name: "本文の広告の段", provider: "mixed", devices: ["desktop", "mobile"] }],
      pages: { blog: [{ slot: "ad-row", region: "body", position: "上", marker: "x", cells: [{ kind: "adsense" }, { kind: "affiliate" }, { kind: "adsense", adsenseSlot: "HUB_INCONTENT" }] }] },
    });
    root = makeFixtureRoot({ stateFiles: { "data/ads/placements.json": ledger } });
    expect((await load(root)).placementDefinitions().blog[0].cells).toEqual([
      { kind: "adsense", unit: null },
      { kind: "affiliate", unit: null },
      { kind: "adsense", unit: "HUB_INCONTENT" },
    ]);
  });
});
