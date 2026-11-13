import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MetricConfig } from "@stats47/data-configs";

/**
 * 正規化 snapshot (values-per-population.json 等) と national-trend.json も、観測値が変わらない限り
 * 同じバイト列でなければならない (CONTENT-FOLLOWUP-01)。
 *
 * 生成時刻を毎回書いていたので、push 段が R2 と中身を照合するようになった後も、正規化 snapshot は
 * 中身が同じでも毎回送り直しになっていた。値の snapshot (generate-ranking-values.ts) と同じく、
 * 前回配信と中身が同じなら前回の generatedAt を引き継ぐ。
 */

// 配信済みの R2 を模す。writeR2Staging が書いた内容を、次の生成の readPublishedSnapshot が返す
const published = new Map<string, string>();
const readFailures = new Set<string>();

vi.mock("@stats47/stats-r2/readers", () => ({ readStatsValues: vi.fn() }));
vi.mock("@stats47/r2-storage/server", async () => {
  const actual = await vi.importActual<typeof import("@stats47/r2-storage/tooling")>(
    "@stats47/r2-storage/tooling",
  );
  return {
    assertR2WriteAllowed: vi.fn(),
    carryTimestamp: actual.carryTimestamp,
    writeR2Staging: vi.fn(async (key: string, body: string) => {
      published.set(key, body);
      return { key, size: body.length };
    }),
    readPublishedSnapshot: vi.fn(async (key: string) => {
      if (readFailures.has(key)) throw new Error(`前回の snapshot を読めません (HTTP 403): ${key}`);
      const body = published.get(key);
      return body === undefined ? null : JSON.parse(body);
    }),
  };
});

import { readStatsValues } from "@stats47/stats-r2/readers";

import { generateOne } from "../generate-ranking-normalized-values";
import { buildDenominatorTable } from "../lib/normalized-values-core";
import { resolveDenominator } from "../../services/normalize-core";

const KEY = "sample-metric";
const PER_POPULATION_KEY = `app/ranking/${KEY}/values-per-population.json`;
const TREND_KEY = `app/ranking/${KEY}/national-trend.json`;
const config = {
  key: KEY,
  years: "all",
  unit: "人",
  calculation: { normalizationOptions: [{ type: "per_population", unit: "人/10万人", scaleFactor: 100000, label: "人口10万人あたり" }] },
} as unknown as MetricConfig;

const population = resolveDenominator("per_population", "prefecture")!;
const denominators = new Map([
  [
    population.key,
    buildDenominatorTable([
      { areaCode: "13000", yearCode: "2024", value: 14_000_000 },
      { areaCode: "27000", yearCode: "2024", value: 8_800_000 },
    ]),
  ],
]);

function mockStats(tokyo: number) {
  vi.mocked(readStatsValues).mockResolvedValue({
    rows: [
      { areaCode: "13000", areaName: "東京都", yearCode: "2024", yearName: "2024年", value: tokyo, unit: "人", rank: 1 },
      { areaCode: "27000", areaName: "大阪府", yearCode: "2024", yearName: "2024年", value: 80, unit: "人", rank: 2 },
    ],
  } as never);
}

describe("generateOne (正規化 snapshot と全国時系列)", () => {
  beforeEach(() => {
    published.clear();
    readFailures.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("観測値が同じなら、1 週間後に作り直しても正規化 snapshot と全国時系列のバイト列が前回の配信と一致する", async () => {
    mockStats(100);
    vi.setSystemTime(new Date("2026-11-02T03:00:00.000Z"));
    await expect(generateOne(config, denominators, false, false)).resolves.toMatchObject({ outcome: { status: "written" } });
    const firstValues = published.get(PER_POPULATION_KEY);
    const firstTrend = published.get(TREND_KEY);

    vi.setSystemTime(new Date("2026-11-09T03:00:00.000Z"));
    const result = await generateOne(config, denominators, false, false);

    expect(firstValues).toBeDefined();
    expect(firstTrend).toBeDefined();
    expect(published.get(PER_POPULATION_KEY)).toBe(firstValues);
    expect(published.get(TREND_KEY)).toBe(firstTrend);
    expect(JSON.parse(published.get(PER_POPULATION_KEY)!).generatedAt).toBe("2026-11-02T03:00:00.000Z");
    expect(result.outcome).toMatchObject({ status: "written", timestamps: { carried: 2, new: 0, unreadable: 0 } });
  });

  it("観測値が変わったら generatedAt を今回の時刻に進める", async () => {
    mockStats(100);
    vi.setSystemTime(new Date("2026-11-02T03:00:00.000Z"));
    await generateOne(config, denominators, false, false);

    mockStats(140);
    vi.setSystemTime(new Date("2026-11-09T03:00:00.000Z"));
    const result = await generateOne(config, denominators, false, false);

    expect(JSON.parse(published.get(PER_POPULATION_KEY)!).generatedAt).toBe("2026-11-09T03:00:00.000Z");
    expect(JSON.parse(published.get(TREND_KEY)!).generatedAt).toBe("2026-11-09T03:00:00.000Z");
    expect(result.outcome).toMatchObject({ timestamps: { carried: 0, new: 2, unreadable: 0 } });
  });

  it("前回の配信を読めなくても生成は止めず、今回の時刻で書いて読めなかった件数を返す", async () => {
    mockStats(100);
    vi.setSystemTime(new Date("2026-11-02T03:00:00.000Z"));
    await generateOne(config, denominators, false, false);

    readFailures.add(PER_POPULATION_KEY);
    vi.setSystemTime(new Date("2026-11-09T03:00:00.000Z"));
    const result = await generateOne(config, denominators, false, false);

    expect(result.outcome).toMatchObject({ status: "written", timestamps: { carried: 1, new: 0, unreadable: 1 } });
    expect(JSON.parse(published.get(PER_POPULATION_KEY)!).generatedAt).toBe("2026-11-09T03:00:00.000Z");
  });

  it("dry-run は書かず、前回の配信も読まない", async () => {
    mockStats(100);
    vi.setSystemTime(new Date("2026-11-09T03:00:00.000Z"));
    const { readPublishedSnapshot } = await import("@stats47/r2-storage/server");
    vi.mocked(readPublishedSnapshot).mockClear();
    await expect(generateOne(config, denominators, true, false)).resolves.toMatchObject({ outcome: { status: "written" } });
    expect(published.size).toBe(0);
    expect(readPublishedSnapshot).not.toHaveBeenCalled();
  });
});
