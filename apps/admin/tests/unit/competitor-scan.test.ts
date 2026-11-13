import fs from "node:fs";
import path from "node:path";

import { afterEach, describe, expect, it, vi } from "vitest";

import { buildCompetitorView, parseCompetitorScan, type CompetitorObservation } from "@/lib/competitor-scan";

import { datasetPath } from "../../../../config/datasets.mjs";
import { cleanupFixtureRoot, makeFixtureRoot } from "../helpers/fixture-root";

/**
 * 競合の観測 (data/products/competitor-scan.csv) を読む画面の集計。
 * 意図: 関心の目安は販売面ごとに別の数え方 (欲しいもの・評価数・スキ) なので、販売面をまたいで並べない。
 * 取れなかった値 (ランサーズの関心の目安・金額未確認) は 0 に読み替えず「未取得」のまま出す。
 */

const HEADER = "observed_at,platform,query,seller,title,price_yen,interest_metric,interest_value,url,category";

const obs = (over: Partial<CompetitorObservation>): CompetitorObservation => ({
  observedAt: "2026-11-05",
  platform: "booth",
  query: "都道府県 統計",
  seller: "",
  title: "出品",
  priceYen: 1000,
  interestMetric: "欲しいもの",
  interestValue: 0,
  url: "https://example.booth.pm/items/1",
  category: "stats-data",
  ...over,
});

describe("競合の観測の CSV の読み取り", () => {
  it("引用符の中のカンマを列の区切りにせず、空の価格と関心の目安は 0 でなく未取得 (null) にする", () => {
    const rows = parseCompetitorScan(
      [
        HEADER,
        '2026-11-05,coconala,地図 作成,,"何度も修正OK！3,000円でカラー地図作成します",3000,評価数,3663,https://coconala.com/services/348668,commission',
        "2026-11-05,lancers,Web 検索 (lancers.jp),,日本地図を県別に色分けするツール for Excel,,未取得,,https://www.lancers.jp/menu/detail/47377,map",
      ].join("\n"),
    );
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ title: "何度も修正OK！3,000円でカラー地図作成します", priceYen: 3000, interestValue: 3663, category: "commission" });
    expect(rows[1]).toMatchObject({ priceYen: null, interestValue: null, interestMetric: "未取得", category: "map" });
  });

  it("分類が空や未知の値の行は捨てずに未分類として残す (再調査で追記した行を画面から落とさない)", () => {
    const rows = parseCompetitorScan([HEADER, "2026-12-05,booth,統計,,新しい出品,500,欲しいもの,2,https://example.booth.pm/items/9,", "2026-12-05,booth,統計,,別の出品,500,欲しいもの,2,https://example.booth.pm/items/10,unknown"].join("\n"));
    expect(rows.map((row) => row.category)).toEqual(["unclassified", "unclassified"]);
  });

  it("必要な列が無い CSV は、黙って空の表にせず欠けた列名を挙げて止める", () => {
    expect(() => parseCompetitorScan("observed_at,platform,title\n2026-11-05,booth,出品")).toThrow(/query.*url|url/);
  });
});

describe("競合の観測の集計", () => {
  it("販売面ごとに件数・分類の内訳・価格の幅を出し、上位は同じ販売面の中の関心の目安で並べる", () => {
    const view = buildCompetitorView(
      [
        obs({ url: "b1", interestValue: 5, priceYen: 500, category: "map" }),
        obs({ url: "b2", interestValue: 677, priceYen: 980, category: "map" }),
        obs({ url: "b3", interestValue: 0, priceYen: 3980 }),
        obs({ platform: "coconala", url: "c1", interestMetric: "評価数", interestValue: 3663, priceYen: 3000, category: "commission" }),
        obs({ platform: "lancers", url: "l1", interestMetric: "未取得", interestValue: null, priceYen: null }),
      ],
      {},
      2,
    );
    expect(view.platforms.map((p) => [p.id, p.count])).toEqual([["booth", 3], ["coconala", 1], ["lancers", 1]]);
    const booth = view.platforms[0];
    expect(booth.byCategory).toMatchObject({ "stats-data": 1, map: 2, commission: 0 });
    expect([booth.priceMinYen, booth.priceMaxYen]).toEqual([500, 3980]);
    expect(booth.top.map((row) => row.url)).toEqual(["b2", "b1"]);
    // 取れなかった関心の目安は順位に入れず、価格も幅に数えない
    const lancers = view.platforms[2];
    expect(lancers.top).toEqual([]);
    expect([lancers.priceMinYen, lancers.priceMaxYen, lancers.priced]).toEqual([null, null, 0]);
  });

  it("販売面・検索語・分類で絞り込み、選択肢の件数は絞り込む前の全体で数える", () => {
    const rows = [
      obs({ url: "b1", query: "白地図", category: "map" }),
      obs({ url: "b2", query: "都道府県 統計" }),
      obs({ platform: "coconala", url: "c1", query: "白地図", category: "commission" }),
    ];
    const view = buildCompetitorView(rows, { platform: "booth", query: "白地図" });
    expect(view.listings.map((row) => row.url)).toEqual(["b1"]);
    expect(view.total).toBe(3);
    expect(view.options.queries).toEqual([{ id: "白地図", label: "白地図", count: 2 }, { id: "都道府県 統計", label: "都道府県 統計", count: 1 }]);
    expect(buildCompetitorView(rows, { category: "commission" }).listings.map((row) => row.url)).toEqual(["c1"]);
    // 選択肢に無い値は絞り込みに使わない (URL の打ち間違いで全件が消えたように見せない)
    expect(buildCompetitorView(rows, { platform: "mercari" }).listings).toHaveLength(3);
  });

  it("観測日が 1 つのあいだは増減を出さない", () => {
    const view = buildCompetitorView([obs({ url: "b1", interestValue: 3 })], {});
    expect(view.hasTrend).toBe(false);
    expect(view.listings[0]).toMatchObject({ previousObservedAt: null, interestDelta: null });
  });

  it("観測日が 2 つ以上になったら、同じ URL の最新と 1 つ前の関心の目安の差を出し、出品は最新の観測 1 行にまとめる", () => {
    const view = buildCompetitorView(
      [
        obs({ url: "b1", observedAt: "2026-11-05", interestValue: 271, priceYen: 1000 }),
        obs({ url: "b1", observedAt: "2027-02-05", interestValue: 300, priceYen: 1200 }),
        obs({ url: "b2", observedAt: "2027-02-05", interestValue: 4 }),
        obs({ url: "b3", observedAt: "2026-11-05", interestValue: 9 }),
        obs({ platform: "lancers", url: "l1", observedAt: "2026-11-05", interestMetric: "未取得", interestValue: null }),
        obs({ platform: "lancers", url: "l1", observedAt: "2027-02-05", interestMetric: "評価数", interestValue: 2 }),
      ],
      {},
    );
    expect(view.hasTrend).toBe(true);
    expect(view.observedDates).toEqual(["2026-11-05", "2027-02-05"]);
    const byUrl = Object.fromEntries(view.listings.map((row) => [row.url, row]));
    expect(view.listings).toHaveLength(4);
    expect(byUrl.b1).toMatchObject({ observedAt: "2027-02-05", priceYen: 1200, interestValue: 300, previousObservedAt: "2026-11-05", interestDelta: 29 });
    // 今回はじめて観測した出品と、再調査で見つからなかった出品は差を出さない
    expect(byUrl.b2).toMatchObject({ previousObservedAt: null, interestDelta: null });
    expect(byUrl.b3).toMatchObject({ observedAt: "2026-11-05", interestDelta: null });
    // 前回が未取得、または数え方が変わった出品は差を出さない (未取得を 0 と読まない)
    expect(byUrl.l1).toMatchObject({ previousObservedAt: "2026-11-05", interestDelta: null });
  });
});

describe("競合の観測の実データ", () => {
  const repoRoot = path.resolve(__dirname, "../../../..");
  const rows = parseCompetitorScan(fs.readFileSync(path.join(repoRoot, datasetPath("products.competitor-scan")), "utf8"));

  it("台帳の CSV を全行読めて、全行が統計データ・地図・受注・その他のどれかに分類されている", () => {
    expect(rows.length).toBeGreaterThanOrEqual(271);
    expect(rows.filter((row) => row.category === "unclassified").map((row) => row.url)).toEqual([]);
    expect(rows.every((row) => /^\d{4}-\d{2}-\d{2}$/.test(row.observedAt) && /^https:\/\//.test(row.url))).toBe(true);
  });

  it("2026-11-05 の観測は BOOTH 48・ココナラ 217・note 3・ランサーズ 3 で、統計データ・地図・受注のどれも 1 件以上ある", () => {
    const view = buildCompetitorView(rows.filter((row) => row.observedAt === "2026-11-05"), {});
    expect(Object.fromEntries(view.platforms.map((p) => [p.id, p.count]))).toEqual({ booth: 48, coconala: 217, note: 3, lancers: 3 });
    for (const id of ["stats-data", "map", "commission"]) expect(view.options.categories.find((c) => c.id === id)?.count, id).toBeGreaterThan(0);
  });
});

describe("競合の観測の読み込み口", () => {
  let root: string | null = null;
  afterEach(() => {
    if (root) cleanupFixtureRoot(root);
    root = null;
    delete process.env.STATS47_PROJECT_ROOT;
    vi.resetModules();
  });

  async function load(stateFiles: Record<string, string>) {
    root = makeFixtureRoot({ stateFiles });
    process.env.STATS47_PROJECT_ROOT = root;
    vi.resetModules();
    return import("@/lib/server/competitor-scan");
  }

  it("置き場は台帳の id (products.competitor-scan) で引き、CSV を読んで集計を返す", async () => {
    const mod = await load({ [datasetPath("products.competitor-scan")]: `${HEADER}\n2026-11-05,note,クリエイター API,出品者,データ集,980,スキ,11,https://note.com/example,stats-data\n` });
    expect(mod.COMPETITOR_SCAN_PATH).toBe(datasetPath("products.competitor-scan"));
    const result = mod.competitorScan({});
    expect(result.error).toBeNull();
    expect(result.view?.listings.map((row) => row.title)).toEqual(["データ集"]);
  });

  it("CSV が無いときは画面を落とさず、理由を返す", async () => {
    const mod = await load({});
    const result = mod.competitorScan({});
    expect(result.view).toBeNull();
    expect(result.error).toContain("competitor-scan.csv");
  });
});
