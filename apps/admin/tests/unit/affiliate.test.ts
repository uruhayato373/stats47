import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * アフィリエイト 3 画面 (成果 / 掲載先 / 提携・案件) のサーバー層。
 *
 * 意図: ①成果は ASP ごとに取得できない理由を 0 円にせず出す ②掲載位置の表は GA4 履歴の最新日を
 *   位置ごとに足し、全体行と合計が一致する ③表示が多いのにクリック 0 の位置を強調する
 *   ④掲載先・案件は配信と同じ広告定義 (git TS) から「配信中」を判定する
 */

const HISTORY = [
  "date,days,affiliate_vertical,link_position,impressions,clicks,ctr",
  "2026-09-12,7,_all,_all,10,1,0.1",
  "2026-09-19,7,_all,_all,1700,3,0.0018",
  "2026-09-19,7,travel,ranking-sidebar,900,0,0",
  "2026-09-19,7,economy,ranking-sidebar,300,0,0",
  "2026-09-19,7,economy,article-inline,500,3,0.006",
].join("\n");

const A8_RESULTS = JSON.stringify({
  records: [
    { month: "2026-07", program: "old", programId: "s1", programRef: "a8:s1", clicks: 1, conversions: 9, approved: 9, revenueYen: 9 },
    { month: "2026-08", program: "af_x", programId: "s2", programRef: "a8:s2", clicks: 10, conversions: 1, approved: 1, revenueYen: 1500, note: "A8 レポート自動取込（案件X）" },
    { month: "2026-08", program: "af_y", programId: "s3", programRef: "a8:s3", clicks: 20, conversions: 0, approved: 0, revenueYen: 0 },
  ],
});

const REPORT_LOG = JSON.stringify({
  // 期間ごとに upsert され、先頭が古い月のことがある (2026-09-27 に 8 月を表示していた不具合の再発防止)
  siteSummary: [
    { period: "202608-202608", clicks: 294, conversions: 0, approved: 0, revenueYen: 0, pendingRevenueYen: 0, fetchedAt: "2026-08-28T03:35:52.936Z" },
    { period: "202609-202609", clicks: 141, conversions: 1, approved: 1, revenueYen: 1500, pendingRevenueYen: 300, fetchedAt: "2026-09-26T13:47:10.921Z" },
  ],
  unmapped: [{ programId: "s9" }],
  notAttributable: [{ programId: "s8" }, { programId: "s7" }],
});

const AUTH = JSON.stringify({
  sources: [
    { source: "a8", status: "pass", observedAt: "2026-09-26T13:47:09.448Z" },
    { source: "moshimo", status: "failed", code: "auth_required", observedAt: "2026-09-26T13:47:48.751Z" },
  ],
});

/** Wrapped<T> の失敗側ならテストを落とし、成功側の値を返す (読み取り失敗を 0 件として読み流さない) */
function ok<T>(v: T | { error: string }): T {
  if (v && typeof v === "object" && "error" in v) throw new Error(`読み取り失敗: ${(v as { error: string }).error}`);
  return v as T;
}

async function load(root: string) {
  process.env.STATS47_PROJECT_ROOT = root;
  vi.resetModules();
  return import("@/lib/server/affiliate");
}

let root: string | null = null;
afterEach(() => {
  delete process.env.STATS47_PROJECT_ROOT;
  if (root) cleanupFixtureRoot(root);
  root = null;
});

describe("affiliateResults", () => {
  it("A8 は最新月の案件を収益順に並べ、名前は取込メモから引く", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        "data/affiliate/a8-results.json": A8_RESULTS,
        "data/affiliate/a8-report-log.json": REPORT_LOG,
        "data/authenticated/latest.json": AUTH,
        "data/affiliate/ga4-affiliate-history.csv": HISTORY,
      },
    });
    const r = ok((await load(root)).affiliateResults());
    expect(r.a8.month).toBe("2026-08");
    expect(r.a8.programs.map((p: any) => p.name)).toEqual(["案件X", "af_y"]);
    expect(r.a8.site?.revenueYen).toBe(1500);
    expect(r.a8.site?.clicks).toBe(141);
    expect(r.a8.sitePeriod).toBe("2026-09");
    expect(r.a8.unmapped).toBe(1);
    expect(r.a8.notAttributable).toBe(2);
  });

  it("掲載位置は最新日の行を位置ごとに足し、全体行と合計が一致する。表示 1000 以上でクリック 0 を強調する", async () => {
    root = makeFixtureRoot({ stateFiles: { "data/affiliate/ga4-affiliate-history.csv": HISTORY } });
    const r = ok((await load(root)).affiliateResults());
    const positions = r.positions;
    if (!positions) throw new Error("掲載位置の表が作られていない");
    expect(positions.date).toBe("2026-09-19");
    const rows = Object.fromEntries(positions.rows.map((p: any) => [p.position, p]));
    expect(rows["ranking-sidebar"]).toMatchObject({ impressions: 1200, clicks: 0, zeroClickWarning: true });
    expect(rows["article-inline"]).toMatchObject({ impressions: 500, clicks: 3, zeroClickWarning: false });
    const total = positions.rows.reduce((s: number, p: any) => s + p.impressions, 0);
    expect(total).toBe(1700);
  });

  it("取得できていない ASP は 0 円ではなく取得状態と理由を返す。state が無ければ未取得として返す", async () => {
    root = makeFixtureRoot({ stateFiles: { "data/authenticated/latest.json": AUTH } });
    const r = ok((await load(root)).affiliateResults());
    expect(r.collections).toEqual([
      expect.objectContaining({ asp: "a8", status: "pass" }),
      expect.objectContaining({ asp: "moshimo", status: "failed", code: "auth_required" }),
      expect.objectContaining({ asp: "afb", status: "未記録" }),
    ]);
    expect(r.a8.site).toBeNull();
    expect(r.moshimo).toBeNull();
    expect(r.positions).toBeNull();
  });
});

describe("affiliatePlacements / affiliatePrograms (配信と同じ広告定義を読む)", () => {
  it("自動配置は配信中の広告だけを置き場所ごとに数え、直貼りは記事ごとに並べる", async () => {
    root = makeFixtureRoot();
    const { affiliatePlacements } = await load(root);
    const { AFFILIATE_ADS } = await import("../../../web/scripts/affiliate-ads-data");
    const { isAffiliateActive } = await import("../../../web/src/features/ads/constants/affiliate-delivery-policy");
    const p = ok(affiliatePlacements());
    const today = new Date().toISOString().slice(0, 10);
    const active = AFFILIATE_ADS.filter((ad: any) => isAffiliateActive(ad, today)).length;
    expect(p.autoTotals.activeAds).toBe(active);
    expect(p.auto.reduce((s: number, r: any) => s + r.ads, 0)).toBe(active);
    expect(p.direct.every((d: any) => d.slug && d.channel)).toBe(true);
  });

  it("案件は配信中を先頭に並べ、配信中の案件は広告定義に同じ programRef の配信中広告がある", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        "data/affiliate/a8-catalog.json": JSON.stringify({
          entries: {
            none: { programId: "s00000000000000", name: "配信なし案件", status: "applied", rewardYen: 100 },
          },
        }),
        "data/affiliate/affiliate-catalog.json": JSON.stringify({
          programs: { "afb-1": { name: "afb 案件", vertical: "furusato", asps: { afb: { promotionId: "1", status: "applying", rewardYen: 295 } } } },
        }),
      },
    });
    const p = ok((await load(root)).affiliatePrograms());
    expect(p.rows.map((r: any) => r.programRef).sort()).toEqual(["a8:s00000000000000", "afb:1"]);
    expect(p.rows.every((r: any) => r.live === false)).toBe(true);
    expect(p.byStatus).toEqual(
      expect.arrayContaining([
        { asp: "a8", status: "applied", count: 1 },
        { asp: "afb", status: "applying", count: 1 },
      ]),
    );
  });

  it("実データ: 配信中と判定した案件は、配信中の広告定義の programRef と一致し、1 件以上ある", async () => {
    vi.resetModules();
    const { affiliatePrograms } = await import("@/lib/server/affiliate");
    const { AFFILIATE_ADS } = await import("../../../web/scripts/affiliate-ads-data");
    const { isAffiliateActive } = await import("../../../web/src/features/ads/constants/affiliate-delivery-policy");
    const today = new Date().toISOString().slice(0, 10);
    const activeRefs = new Set(AFFILIATE_ADS.filter((ad: any) => ad.programRef && isAffiliateActive(ad, today)).map((ad: any) => ad.programRef));
    const live = ok(affiliatePrograms()).rows.filter((r: any) => r.live);
    expect(live.length).toBeGreaterThan(0);
    expect(live.every((r: any) => activeRefs.has(r.programRef))).toBe(true);
  });
});
