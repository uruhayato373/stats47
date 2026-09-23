import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/r2-storage/server", () => ({ fetchFromR2AsJson: vi.fn() }));

import { extractChartMetricPair, resolveArticleMetricPairs } from "./article-metric-pairs";

// ランキングページの「解説記事」導線はこのペアだけを根拠に張る。相関記事は tags が空なので
// ここで拾えない記事はランキングページからどこにも出ない。
describe("extractChartMetricPair", () => {
  it.each([
    [{ kind: "correlation", base: "b-key", pair: "a-key" }],
    [{ kind: "scatter", xKey: "a-key", yKey: "b-key" }],
    [{ kind: "composite", xMetric: { rankingKey: "b-key" }, yMetric: { rankingKey: "a-key" } }],
  ])("%o から昇順の 2 指標を取り出す", (source) => {
    expect(extractChartMetricPair(source)).toEqual(["a-key", "b-key"]);
  });

  it.each([
    ["ランキング単体の図", { kind: "ranking", rankingKey: "a-key" }],
    ["合成キー", { kind: "scatter", xKey: "a-key + b-key", yKey: "c-key" }],
    ["同一キー", { kind: "correlation", base: "a-key", pair: "a-key" }],
    ["キー欠落", { kind: "scatter", xKey: "a-key" }],
    ["source.json が無い", null],
  ])("%s は 2 指標の関係として扱わない", (_label, source) => {
    expect(extractChartMetricPair(source)).toBeNull();
  });
});

describe("resolveArticleMetricPairs", () => {
  it("本文の図の source.json だけを読み、重複ペアを 1 つにまとめる", async () => {
    const sources: Record<string, unknown> = {
      "app/blog/article/data/scatter.source.json": { kind: "scatter", xKey: "b-key", yKey: "a-key" },
      "app/blog/article/data/corr.source.json": { kind: "correlation", base: "a-key", pair: "b-key" },
      "app/blog/article/data/ranking.source.json": { kind: "ranking", rankingKey: "a-key" },
    };
    const fetcher = vi.fn(async (key: string) => sources[key] ?? null);

    const pairs = await resolveArticleMetricPairs(
      {
        slug: "article",
        content: "![a](data/scatter.svg)\n![b](data/corr.svg)\n![c](data/ranking.svg)",
      },
      fetcher,
    );

    expect(pairs).toEqual([["a-key", "b-key"]]);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });
});
