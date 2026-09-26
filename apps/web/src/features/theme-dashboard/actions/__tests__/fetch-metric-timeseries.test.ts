import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * fetchMetricTimeseriesAction の「どこから読むか」の契約。
 *
 * 集約そのもの (全国行 vs 47 県平均) は純粋関数 `aggregateMetricTimeseries` の
 * テストで固定してあるので、ここは経路の選択だけを見る。
 *
 * 守りたいのは 2 方向:
 *  (a) Web runtime はどのmetricでも e-Stat を叩かない … 計算型・derived・scale迂回を防ぐ
 *  (b) external 種も正典 R2 に年次があるならチャートにする
 *      (2026-08-05 の是正。external 種が即 EMPTY で、R2 に 14 年あるラスパイレス指数の
 *       チャートが空だった)
 */

const { readRankingItemFromR2, readStatsValues, fetchFormattedStats } = vi.hoisted(() => ({
  readRankingItemFromR2: vi.fn(),
  readStatsValues: vi.fn(),
  fetchFormattedStats: vi.fn(),
}));

vi.mock("@stats47/ranking/server", async () => {
  // resolveEstatParams / isDerivedSource は本物を使う。ここを mock すると
  // 「params が null になる条件」自体がテストから消えてしまう。
  const actual =
    await vi.importActual<typeof import("@stats47/ranking/server")>("@stats47/ranking/server");
  return { ...actual, readRankingItemFromR2: (...a: unknown[]) => readRankingItemFromR2(...a) };
});

vi.mock("@stats47/stats-r2/readers", () => ({
  readStatsValues: (...a: unknown[]) => readStatsValues(...a),
}));

vi.mock("@stats47/estat-api/server", () => ({
  fetchFormattedStats: (...a: unknown[]) => fetchFormattedStats(...a),
}));

vi.mock("@/components/stat-charts/server", () => ({
  getEstatCacheStorage: vi.fn(async () => undefined),
}));

import {
  fetchMetricTimeseriesAction,
  fetchMetricTimeseriesBatchAction,
} from "../fetch-metric-timeseries";

/** 全国行を持たない 47 県観測 (平均で全国系列を作る形) */
function rows(years: string[]) {
  return years.flatMap((y) => [
    { areaCode: "13000", yearCode: y, yearName: `${y}年`, value: 100 },
    { areaCode: "01000", yearCode: y, yearName: `${y}年`, value: 200 },
  ]);
}

/** readRankingItemFromR2 の戻り (Result<RankingItem>)。判定は success フラグ */
function item(sourceConfig: unknown, calculation?: unknown) {
  return { success: true, data: { sourceConfig, calculation } };
}

/** e-Stat で普通に取れる metric (statsDataId あり・derived でない) */
const ESTAT_CONFIG = { estatParams: { statsDataId: "0000010101", cdCat01: "A1101" } };
/** 国土数値情報など。クエリキーが 1 つも無い = e-Stat を叩けない */
const EXTERNAL_CONFIG = {
  source: { name: "国土数値情報 駅別乗降客数", url: "https://nlftp.mlit.go.jp/" },
  ksjDataId: "S12",
};

beforeEach(() => {
  readRankingItemFromR2.mockReset();
  readStatsValues.mockReset();
  fetchFormattedStats.mockReset();
  readStatsValues.mockResolvedValue({ rows: rows(["2022", "2023", "2024"]) });
  fetchFormattedStats.mockResolvedValue(rows(["2022", "2023", "2024"]));
});

describe("fetchMetricTimeseriesAction — 取得元の選択", () => {
  it("e-Stat由来metricも正規化済みR2だけを読み、直APIへ戻らない", async () => {
    readRankingItemFromR2.mockResolvedValue(item(ESTAT_CONFIG));

    const result = await fetchMetricTimeseriesAction("total-population", "00000");

    expect(readStatsValues).toHaveBeenCalledWith("total-population", "prefecture");
    expect(fetchFormattedStats).not.toHaveBeenCalled();
    expect(result.points).toHaveLength(3);
  });

  /**
   * ★これが 2026-08-05 の是正本体。
   * 旧実装は resolveEstatParams が null の時点で EMPTY を返していた。
   */
  it("e-Stat パラメータを持たない external 種は正典 R2 から読む (空で諦めない)", async () => {
    readRankingItemFromR2.mockResolvedValue(item(EXTERNAL_CONFIG));

    const result = await fetchMetricTimeseriesAction("railway-passengers", "00000");

    expect(readStatsValues).toHaveBeenCalledWith("railway-passengers", "prefecture");
    expect(fetchFormattedStats).not.toHaveBeenCalled();
    expect(result.points.map((p) => p.year)).toEqual(["2022", "2023", "2024"]);
  });

  it("計算型は e-Stat を叩かない (分子の生値が出る事故を防ぐ)", async () => {
    // 分子の statsDataId が残っていても叩いてはならない
    readRankingItemFromR2.mockResolvedValue(
      item(ESTAT_CONFIG, { isCalculated: true, type: "ratio" }),
    );

    const result = await fetchMetricTimeseriesAction("engel-coefficient", "00000");

    expect(fetchFormattedStats).not.toHaveBeenCalled();
    expect(readStatsValues).toHaveBeenCalledWith("engel-coefficient", "prefecture");
    expect(result.points).toHaveLength(3);
  });

  it("derived (宣言演算) は e-Stat を叩かず正典 R2 から読む", async () => {
    // parseRecipe は configHash 必須 (欠けると recipe 全体が無効 = derived 判定できない)
    readRankingItemFromR2.mockResolvedValue(
      item({
        ...ESTAT_CONFIG,
        recipe: { kind: "estat", derived: true, configHash: "abc123" },
      }),
    );

    await fetchMetricTimeseriesAction("annual-income", "00000");

    expect(fetchFormattedStats).not.toHaveBeenCalled();
    expect(readStatsValues).toHaveBeenCalled();
  });
});

describe("fetchMetricTimeseriesAction — データが無いとき", () => {
  it("R2 に単年しか無ければ 1 点だけ返す (呼び出し側が空状態を出す)", async () => {
    readRankingItemFromR2.mockResolvedValue(item(EXTERNAL_CONFIG));
    readStatsValues.mockResolvedValue({ rows: rows(["2024"]) });

    const result = await fetchMetricTimeseriesAction("railway-station-count", "00000");

    expect(result.points).toHaveLength(1);
  });

  it("R2 にも無ければ空を返す", async () => {
    readRankingItemFromR2.mockResolvedValue(item(EXTERNAL_CONFIG));
    readStatsValues.mockResolvedValue(null);

    const result = await fetchMetricTimeseriesAction("unknown", "00000");

    expect(result).toEqual({ points: [], source: "none" });
  });

  it("ranking item 自体が無ければ空を返す", async () => {
    readRankingItemFromR2.mockResolvedValue(null);

    const result = await fetchMetricTimeseriesAction("unknown", "00000");

    expect(result.points).toHaveLength(0);
    expect(readStatsValues).not.toHaveBeenCalled();
  });
});

it('暦年の気象指標は旧snapshotの年度ラベルを補正する', async () => {
  readRankingItemFromR2.mockResolvedValue(item(ESTAT_CONFIG));
  readStatsValues.mockResolvedValue({ rows: [
    { areaCode: '13000', yearCode: '2024100000', yearName: '2024年度（暫定値）', value: 18.5 },
  ] });
  const result = await fetchMetricTimeseriesAction('average-temperature', '13000');
  expect(result.points).toEqual([{ year: '2024100000', yearName: '2024年（暫定値）', value: 18.5 }]);
  expect(fetchFormattedStats).not.toHaveBeenCalled();
});

/**
 * まとめて取る経路 (2026-09-25)。指標カードごとに 1 件ずつ呼ぶと、ブラウザがサーバーアクションを
 * 順番に処理するためテーマページで 48 件が一列に並び約 19 秒かかった。束ねた要求は
 * 指標ごとに R2 を 1 回だけ読み、選択県と全国を同じ読み込みから作る。
 */
describe("fetchMetricTimeseriesBatchAction — まとめて取る", () => {
  it("同じ指標の選択県と全国は R2 を 1 回だけ読み、要求と同じ順で返す", async () => {
    readRankingItemFromR2.mockResolvedValue(item(ESTAT_CONFIG));

    const results = await fetchMetricTimeseriesBatchAction([
      { rankingKey: "total-population", areaCode: "13000" },
      { rankingKey: "births", areaCode: "00000" },
      { rankingKey: "total-population", areaCode: "00000" },
    ]);

    expect(readStatsValues).toHaveBeenCalledTimes(2);
    expect(results).toHaveLength(3);
    expect(results[0].points.map((p) => p.value)).toEqual([100, 100, 100]);
    expect(results[2].points.map((p) => p.value)).toEqual([150, 150, 150]);
    expect(results[0]).toEqual(await fetchMetricTimeseriesAction("total-population", "13000"));
  });

  it("上限を超える件数と不正な要求は受け付けない", async () => {
    const tooMany = Array.from({ length: 61 }, (_, i) => ({ rankingKey: `k${i}`, areaCode: "00000" }));
    await expect(fetchMetricTimeseriesBatchAction(tooMany)).rejects.toThrow();
    await expect(
      fetchMetricTimeseriesBatchAction([{ rankingKey: 1, areaCode: "00000" } as never]),
    ).rejects.toThrow();
  });
});
