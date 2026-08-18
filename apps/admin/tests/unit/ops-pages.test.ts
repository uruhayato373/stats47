import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * 管理 4 ページのサーバー層 (ads / revenue / quality / ops-ledger)。
 *
 * ★各モジュールで必ず 2 方向を見る:
 *   ①正常系の集計値が意図どおりか ②ファイル欠損で throw せず {error} に畳むか。
 *   ②が落ちると、cron が生成していない state 1 つで画面全体が 500 になる。
 * ★巨大 JSON を raw のまま返していないことも固定する (返り値の肥大を防ぐ)。
 */

const OPERATIONS = JSON.stringify({
  schemaVersion: 2,
  generatedAt: "2026-08-16T13:30:52.636Z",
  freshness: { inventoryDays: 0, ga4Days: 1 },
  measurementGate: { status: "blocked", reasons: ["ga4-variant-dimension-missing"] },
  publishGate: { status: "ready", reasons: [] },
  coverage: { gapVerticals: ["ict"], thinVerticals: [] },
  directPlacements: { total: 2, orphaned: [], missingDisclosure: [] },
  experiments: {
    active: [
      {
        experimentId: "exp-a",
        kind: "code",
        startedAt: "2026-08-04",
        daysElapsed: 12,
        sampleReached: false,
        status: "collecting",
        variants: [{ variantId: "text", impressions: 10, clicks: 1, ctr: 0.1 }],
      },
    ],
    readyToDecide: [{ experimentId: "exp-b", kind: "creative", variants: [] }],
    invalid: [],
    inconclusive: [],
    closed: [],
  },
  recommendedActions: [{ id: "fix-gate", reason: "why", command: "cmd" }],
  ga4Totals: { impressions: 12020, clicks: 3, ctr: 0.00025 },
});

const INVENTORY = JSON.stringify({
  generatedAt: "2026-08-16T12:00:00.000Z",
  totals: { entries: 260, active: 260, uniqueAdvertisers: 160 },
  byVertical: { travel: 51, labor: 50 },
  byAdType: { banner: 138, text: 122 },
  coverage: { verticalsCovered: 9, verticalsTotal: 10, gapVerticals: ["ict"], thinVerticals: [] },
  sizeViolations: [{ id: "x", size: "728x90" }],
});

/** entries が 3 件だけの縮小版。raw を返していないことの検証に使う */
const A8_CATALOG = JSON.stringify({
  entries: {
    p1: { programId: "p1", status: "approved", name: "A" },
    p2: { programId: "p2", status: "approved", name: "B" },
    p3: { programId: "p3", status: "candidate", name: "C" },
  },
});

const GA4 = JSON.stringify({
  date: "2026-08-16",
  days: 28,
  totals: { impressions: 100, clicks: 2, ctr: 0.02 },
  quality: { unsetVerticalRatio: 0 },
  hasVariantBreakdown: false,
  rows: [
    { ad_id: "a", affiliate_vertical: "travel", link_position: "blog-bottom", impressions: 60, clicks: 2 },
    { ad_id: "b", affiliate_vertical: "labor", link_position: "sidebar", impressions: 40, clicks: 0 },
  ],
});

async function load(root: string, mod: string) {
  process.env.STATS47_PROJECT_ROOT = root;
  vi.resetModules();
  return import(mod);
}

afterEach(() => {
  delete process.env.STATS47_PROJECT_ROOT;
});

describe("ads server", () => {
  let root: string;
  afterEach(() => root && cleanupFixtureRoot(root));

  it("集約 state・在庫・GA4 を読み、実験を bucket 付きで平坦化する", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        ".claude/state/ads/affiliate-operations-latest.json": OPERATIONS,
        ".claude/state/ads/inventory-latest.json": INVENTORY,
        ".claude/state/ads/ga4-affiliate-2026-08-16.json": GA4,
      },
    });
    const { adsSummary } = await load(root, "@/lib/server/ads");
    const d = adsSummary();

    expect(d.operations).toMatchObject({
      measurementGate: { status: "blocked" },
      publishGate: { status: "ready" },
    });
    expect(d.operations.experiments.map((e: any) => [e.experimentId, e.bucket])).toEqual([
      ["exp-a", "active"],
      ["exp-b", "readyToDecide"],
    ]);
    expect(d.inventory).toMatchObject({ totals: { entries: 260, uniqueAdvertisers: 160 } });
    // オブジェクト → 降順の配列に畳んでいる
    expect(d.inventory.byVertical[0]).toEqual({ vertical: "travel", count: 51 });
    // GA4 は行を vertical / position で集計する
    expect(d.ga4.byVertical[0]).toMatchObject({ vertical: "travel", impressions: 60, clicks: 2 });
    expect(d.ga4.byPosition.map((r: any) => r.position)).toEqual(["blog-bottom", "sidebar"]);
  });

  it("★巨大カタログは件数と status 内訳だけ返す (raw entries を渡さない)", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        ".claude/state/ads/affiliate-operations-latest.json": OPERATIONS,
        ".claude/state/ads/inventory-latest.json": INVENTORY,
        ".claude/state/ads/ga4-affiliate-2026-08-16.json": GA4,
        ".claude/state/ads/a8-catalog.json": A8_CATALOG,
      },
    });
    const { adsSummary } = await load(root, "@/lib/server/ads");
    const d = adsSummary();

    expect(d.catalogs).toEqual([
      {
        file: "a8-catalog.json",
        total: 3,
        byStatus: [
          { status: "approved", count: 2 },
          { status: "candidate", count: 1 },
        ],
      },
    ]);
    // 返り値のどこにも個々の program 名が出てこない
    expect(JSON.stringify(d.catalogs)).not.toContain("programId");
  });

  it("state が 1 つも無くても throw せず {error} に畳む", async () => {
    root = makeFixtureRoot({});
    const { adsSummary } = await load(root, "@/lib/server/ads");
    const d = adsSummary();
    for (const k of ["operations", "inventory", "compliance", "ga4"] as const) {
      expect(d[k]).toHaveProperty("error");
    }
  });
});

describe("revenue server", () => {
  let root: string;
  afterEach(() => root && cleanupFixtureRoot(root));

  const HISTORY = "week,earnings,page_views,rpm,clicks,ctr\n2026-W32,100,1000,100,10,0.01\n2026-W33,120,1100,109,12,0.011\n";

  it("週次 CSV を新しい順に返す", async () => {
    root = makeFixtureRoot({
      stateFiles: { ".claude/state/metrics/adsense/history.csv": HISTORY },
    });
    const { revenueSummary } = await load(root, "@/lib/server/revenue");
    const d = revenueSummary();
    expect(d.adsense.weeks.map((w: any) => w.week)).toEqual(["2026-W33", "2026-W32"]);
    expect(d.adsense.columns).toContain("earnings");
  });

  it("★計測できないチャネルを unmeasured として明示する (0 円にしない)", async () => {
    root = makeFixtureRoot({ stateFiles: {} });
    const { revenueSummary, REVENUE_COVERAGE } = await load(root, "@/lib/server/revenue");
    const d = revenueSummary();

    const unmeasured = REVENUE_COVERAGE.filter((c: any) => c.state === "unmeasured").map(
      (c: any) => c.channel,
    );
    expect(unmeasured).toEqual(["アフィリエイト", "Kindle (KDP)", "ココナラ"]);
    // 金額 0 を返していない (CSV が無ければ error に畳む)
    expect(d.adsense).toHaveProperty("error");
  });
});

describe("quality server", () => {
  let root: string;
  afterEach(() => root && cleanupFixtureRoot(root));

  it("キューごとに欠陥数と鮮度を出し、未生成は exists:false で返す", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        ".claude/state/blog/svg-lineage-queue.json": JSON.stringify({
          generatedAt: "2026-08-10T00:00:00.000Z",
          total: 1080,
          byStatus: { both: 974, jsonOnly: 0, neither: 106 },
        }),
      },
    });
    const { qualitySummary } = await load(root, "@/lib/server/quality");
    const d = qualitySummary();

    const svg = d.queues.find((q: any) => q.key === "svg-lineage");
    expect(svg).toMatchObject({ exists: true, total: 1080, defects: 106 });
    // 撒いていないキューは存在しないと分かる形で返る (throw しない)
    expect(d.queues.filter((q: any) => !q.exists).length).toBeGreaterThan(0);
    expect(d.queuesWithDefects).toBe(1);
  });
});

describe("ops-ledger server", () => {
  let root: string;
  afterEach(() => root && cleanupFixtureRoot(root));

  it("不健全な workflow を先頭に並べ、台帳は frontmatter だけ読む", async () => {
    root = makeFixtureRoot({
      stateFiles: {
        ".claude/state/ci/workflow-health.json": JSON.stringify({
          generatedAt: "2026-08-18T00:00:00.000Z",
          checked: 3,
          results: [
            { workflow: "ok.yml", unhealthy: false, failureStreak: 0, everSucceeded: true },
            { workflow: "bad.yml", unhealthy: true, failureStreak: 12, everSucceeded: false },
            { workflow: "warn.yml", unhealthy: true, failureStreak: 2, everSucceeded: true },
          ],
        }),
        ".claude/agents/alpha.md":
          "---\nname: alpha\ndescription: A エージェント\nmodel: sonnet\n---\n\n" + "本文".repeat(5000),
      },
    });
    const { opsSummary } = await load(root, "@/lib/server/ops-ledger");
    const d = opsSummary();

    expect(d.ci.unhealthyCount).toBe(2);
    expect(d.ci.workflows.map((w: any) => w.workflow)).toEqual(["bad.yml", "warn.yml", "ok.yml"]);

    expect(d.agents).toEqual([
      expect.objectContaining({ name: "alpha", model: "sonnet", description: "A エージェント" }),
    ]);
    // 本文は読み込んでいない (description は frontmatter 由来で 200 字以内)
    expect(d.agents[0].description.length).toBeLessThanOrEqual(200);
    expect(JSON.stringify(d.agents)).not.toContain("本文本文");
  });

  it("CI state が無くても {error} に畳む", async () => {
    root = makeFixtureRoot({});
    const { opsSummary } = await load(root, "@/lib/server/ops-ledger");
    const d = opsSummary();
    expect(d.ci).toHaveProperty("error");
    expect(d.usage).toHaveProperty("error");
  });
});
