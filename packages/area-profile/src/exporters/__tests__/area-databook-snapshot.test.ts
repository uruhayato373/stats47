import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/logger/server", () => ({ logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } }));
vi.mock("@stats47/r2-storage/server", () => ({ writeR2Staging: vi.fn() }));
vi.mock("@stats47/stats-r2/readers", () => ({ readJapanSeries: vi.fn(async () => null) }));
vi.mock("@stats47/ranking/config", () => ({
  KNOWN_RANKING_KEYS: new Set(["pop", "gyoza-expenditure", "beef-expenditure", "beef-quantity", "hidden-item"]),
}));
vi.mock("@stats47/data-configs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@stats47/data-configs")>()),
  collectTemplateMetricKeys: () => ["pop"],
  listAllMetrics: () => [
    kakei("gyoza-expenditure", "010920070"),
    kakei("beef-expenditure", "010310010"),
    kakei("beef-quantity", "010310010"),
    kakei("food-total", "010000000"),
    kakei("not-published", "010999990"),
    { ...kakei("inactive-item", "010888880"), isActive: false },
  ],
}));

function kakei(key: string, cdCat01: string) {
  return { key, isActive: true, source: { kind: "kakei-chousa", filter: { cdCat01 } } };
}

/** 1 位 = 栃木 (09000)。順位の並びは areas の順。 */
const AREAS = [
  { areaCode: "09000", areaName: "栃木県" },
  { areaCode: "13000", areaName: "東京都" },
  { areaCode: "27000", areaName: "大阪府" },
  { areaCode: "01000", areaName: "北海道" },
];

function values(order: string[], base: number, step: number) {
  return AREAS.map((a) => {
    const idx = order.indexOf(a.areaCode);
    return { ...a, value: base - idx * step, rank: idx + 1 };
  });
}

const VALUES: Record<string, ReturnType<typeof values>> = {
  pop: values(["13000", "27000", "09000", "01000"], 100, 10),
  "gyoza-expenditure": values(["09000", "27000", "13000", "01000"], 5000, 500),
  // 牛肉は購入量では栃木 2 位、支出額では栃木 3 位 → 順位が上の購入量 1 件だけになる
  "beef-quantity": values(["27000", "09000", "13000", "01000"], 9000, 1000),
  "beef-expenditure": values(["27000", "13000", "09000", "01000"], 9000, 1000),
  "food-total": values(["09000", "27000", "13000", "01000"], 90, 1),
  "not-published": values(["09000", "27000", "13000", "01000"], 90, 1),
};

vi.mock("@stats47/ranking/server", () => ({
  readRankingItemFromR2: vi.fn(async (key: string) => ({
    success: true,
    data: {
      title: key === "gyoza-expenditure" ? "ぎょうざ消費支出額" : key,
      unit: key === "beef-quantity" ? "g" : "円",
      latestYear: { yearCode: "2025", yearName: "2025年" },
    },
  })),
  listRankingValues: vi.fn(async (key: string) =>
    VALUES[key] ? { success: true, data: VALUES[key] } : { success: false, error: new Error("none") },
  ),
}));

import { buildAreaDatabookSnapshots } from "../area-databook-snapshot";

describe("buildAreaDatabookSnapshots の家計調査の上位品目", () => {
  beforeEach(() => vi.clearAllMocks());

  it("県庁所在市の家計調査で全国 3 位以内の品目を県ごとに焼き込む", async () => {
    const { snapshots } = await buildAreaDatabookSnapshots();
    const tochigi = snapshots.find((s) => s.areaCode === "09000");
    expect(tochigi?.kakeiTopItems?.map((i) => [i.rankingKey, i.rank])).toEqual([
      ["gyoza-expenditure", 1],
      ["beef-quantity", 2],
    ]);
    expect(tochigi?.kakeiTopItems?.[0]).toMatchObject({ label: "ぎょうざ消費支出額", value: 5000, unit: "円", year: "2025年" });
  });

  it("集計区分・非公開・無効な指標と、4 位の県の品目は含めない", async () => {
    const { snapshots } = await buildAreaDatabookSnapshots();
    const keysOf = (code: string) => snapshots.find((s) => s.areaCode === code)?.kakeiTopItems?.map((i) => i.rankingKey) ?? [];
    for (const code of AREAS.map((a) => a.areaCode)) {
      expect(keysOf(code)).not.toContain("food-total");
      expect(keysOf(code)).not.toContain("not-published");
      expect(keysOf(code)).not.toContain("inactive-item");
    }
    // 北海道は全品目で 4 位
    expect(keysOf("01000")).toEqual([]);
  });

  it("県を絞った補完でも同じ品目が出る", async () => {
    const { snapshots } = await buildAreaDatabookSnapshots({ areaCodes: ["09000"] });
    expect(snapshots).toHaveLength(1);
    expect(snapshots[0].kakeiTopItems).toHaveLength(2);
  });
});
