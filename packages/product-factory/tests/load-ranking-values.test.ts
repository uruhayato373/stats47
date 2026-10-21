import { describe, expect, it } from "vitest";

import { fetchRankingValues } from "../src/data/load-ranking-values";

const payload = {
  rankingKey: "k",
  areaType: "prefecture",
  partitions: [
    {
      yearCode: "2020",
      count: 47,
      values: Array.from({ length: 47 }, (_, i) => ({
        areaCode: String((i + 1) * 1000).padStart(5, "0"),
        value: i + 1,
        unit: "人",
      })),
    },
  ],
};

function respond(status: number): Response {
  return new Response(status === 200 ? JSON.stringify(payload) : "error", { status });
}

describe("fetchRankingValues", () => {
  const sleep = async () => {};

  it("接続の失敗と 5xx は取り直す (一時的な失敗で指標を落とさない)", async () => {
    const answers: Array<number | Error> = [new Error("fetch failed"), 503, 200];
    const fetchImpl = (async () => {
      const next = answers.shift()!;
      if (next instanceof Error) throw next;
      return respond(next);
    }) as typeof fetch;
    const result = await fetchRankingValues("k", { fetchImpl, sleep });
    expect(result.values).toHaveLength(47);
    expect(answers).toHaveLength(0);
  });

  it("4xx は元データが無いので取り直さずに失敗する", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return respond(404);
    }) as typeof fetch;
    await expect(fetchRankingValues("k", { fetchImpl, sleep })).rejects.toThrow("R2 fetch 失敗 (404)");
    expect(calls).toBe(1);
  });

  it("取り直しても失敗し続けたら 3 回で諦める", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return respond(503);
    }) as typeof fetch;
    await expect(fetchRankingValues("k", { fetchImpl, sleep })).rejects.toThrow("R2 fetch 失敗 (503)");
    expect(calls).toBe(3);
  });
});
