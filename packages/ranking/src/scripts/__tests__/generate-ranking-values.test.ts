import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MetricConfig } from "@stats47/data-configs";

/**
 * 配信用 `app/ranking/<key>/values.json` は、観測値が変わらない限り同じバイト列でなければならない。
 *
 * 生成時刻を毎回書くと中身が同じでも全ファイルのバイト列が変わり、sync-snapshots と data-refresh が
 * 毎回 14,000 件余りを R2 へ送り直していた (2026-11-02 の run 41406400636 は 14,321 件、
 * 11-04 の run 41803105336 は 14,328 件)。R2 の書き込み回数と Last-Modified が毎回進む。
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

import { generateOne } from "../generate-ranking-values";

const KEY = "sample-metric";
const VALUES_KEY = `app/ranking/${KEY}/values.json`;
const config = { key: KEY, years: "all" } as unknown as MetricConfig;

function statsRows(tokyo: number) {
  return [
    { areaCode: "13000", areaName: "東京都", yearCode: "2024", yearName: "2024年", value: tokyo, unit: "人", rank: 1 },
    { areaCode: "27000", areaName: "大阪府", yearCode: "2024", yearName: "2024年", value: 80, unit: "人", rank: 2 },
    { areaCode: "13000", areaName: "東京都", yearCode: "2023", yearName: "2023年", value: 90, unit: "人", rank: 1 },
  ];
}

function mockStats(tokyo: number) {
  vi.mocked(readStatsValues).mockResolvedValue({ rows: statsRows(tokyo) } as never);
}

describe("generateOne (app/ranking/<key>/values.json)", () => {
  beforeEach(() => {
    published.clear();
    readFailures.clear();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("観測値が同じなら、1 週間後に作り直してもバイト列が前回の配信と一致する", async () => {
    mockStats(100);

    vi.setSystemTime(new Date("2026-11-02T03:00:00.000Z"));
    await expect(generateOne(config, false)).resolves.toMatchObject({ status: "written" });
    const first = published.get(VALUES_KEY);

    vi.setSystemTime(new Date("2026-11-09T03:00:00.000Z"));
    const outcome = await generateOne(config, false);
    const second = published.get(VALUES_KEY);

    expect(first).toBeDefined();
    expect(second).toBe(first);
    expect(JSON.parse(second!).generatedAt).toBe("2026-11-02T03:00:00.000Z");
    expect(outcome).toMatchObject({ status: "written", timestamp: "carried" });
  });

  it("観測値が変わったら generatedAt を今回の時刻に進める", async () => {
    mockStats(100);
    vi.setSystemTime(new Date("2026-11-02T03:00:00.000Z"));
    await generateOne(config, false);

    mockStats(101);
    vi.setSystemTime(new Date("2026-11-09T03:00:00.000Z"));
    await expect(generateOne(config, false)).resolves.toMatchObject({ status: "written", timestamp: "new" });

    const second = JSON.parse(published.get(VALUES_KEY)!);
    expect(second.generatedAt).toBe("2026-11-09T03:00:00.000Z");
    expect(second.partitions[0].values[0].value).toBe(101);
  });

  it("前回の配信が無い指標 (初回) は今回の時刻で書く", async () => {
    mockStats(100);
    vi.setSystemTime(new Date("2026-11-09T03:00:00.000Z"));
    await expect(generateOne(config, false)).resolves.toMatchObject({ status: "written", timestamp: "new" });
    expect(JSON.parse(published.get(VALUES_KEY)!).generatedAt).toBe("2026-11-09T03:00:00.000Z");
  });

  it("前回の配信を読めなくても生成は止めず、今回の時刻で書いて読めなかったことを返す", async () => {
    mockStats(100);
    vi.setSystemTime(new Date("2026-11-02T03:00:00.000Z"));
    await generateOne(config, false);

    readFailures.add(VALUES_KEY);
    vi.setSystemTime(new Date("2026-11-09T03:00:00.000Z"));
    await expect(generateOne(config, false)).resolves.toMatchObject({
      status: "written",
      timestamp: "previous-unreadable",
    });
    expect(JSON.parse(published.get(VALUES_KEY)!).generatedAt).toBe("2026-11-09T03:00:00.000Z");
  });

  it("dry-run は書かない", async () => {
    mockStats(100);
    vi.setSystemTime(new Date("2026-11-09T03:00:00.000Z"));
    await expect(generateOne(config, true)).resolves.toMatchObject({ status: "written" });
    expect(published.has(VALUES_KEY)).toBe(false);
  });
});
