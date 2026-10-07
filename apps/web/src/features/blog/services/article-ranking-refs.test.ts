import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@stats47/r2-storage/server", () => ({ fetchFromR2AsJson: vi.fn() }));

import { extractChartRankingRefs, resolveArticleRankingRefs } from "./article-ranking-refs";

// 記事 → 指標の対応は 2 つに使う: ランキング・エリア・テーマから記事への回遊と、図の年が最新年より
// 古い記事の検出。実在する metric だけを採り、図に描いた年を落とさないことを固定する。
describe("extractChartRankingRefs", () => {
  it("ランキングの図は指標と図に描いた年を返す", () => {
    expect(extractChartRankingRefs({ kind: "ranking", rankingKey: "total-population", year: "2020" })).toEqual([
      { rankingKey: "total-population", year: "2020" },
    ]);
  });

  it("散布図は両軸の指標を返し、実在しない metric は落とす", () => {
    const refs = extractChartRankingRefs({ kind: "scatter", xKey: "total-population", yKey: "no-such-metric", year: 2022 });
    expect(refs).toEqual([{ rankingKey: "total-population", year: "2022" }]);
  });

  it("年が無い・4 桁でない図は年を持たない", () => {
    expect(extractChartRankingRefs({ kind: "ranking", rankingKey: "total-population", year: "最新" })).toEqual([
      { rankingKey: "total-population" },
    ]);
    expect(extractChartRankingRefs(null)).toEqual([]);
  });

  it("年を固定した図 (yearPinnedReason) は指標だけを返し、古い図として扱わない", () => {
    const source = { kind: "ranking", rankingKey: "total-population", year: "2011", yearPinnedReason: "2011 年の震災直後を主題にした図" };
    expect(extractChartRankingRefs(source)).toEqual([{ rankingKey: "total-population" }]);
    expect(extractChartRankingRefs({ ...source, yearPinnedReason: " " })).toEqual([
      { rankingKey: "total-population", year: "2011" },
    ]);
  });
});

describe("resolveArticleRankingRefs", () => {
  it("図と本文のリンクから指標をまとめ、同じ指標を複数の年で描いたら最も古い年を残す", async () => {
    const sources: Record<string, unknown> = {
      "app/blog/article/data/a.source.json": { kind: "ranking", rankingKey: "total-population", year: "2022" },
      "app/blog/article/data/b.source.json": { kind: "ranking", rankingKey: "total-population", year: "2020" },
    };
    const fetcher = vi.fn(async (key: string) => sources[key] ?? null);

    const refs = await resolveArticleRankingRefs(
      {
        slug: "article",
        content: "![a](data/a.svg)\n![b](data/b.svg)\n[面積](/ranking/total-area-including-northern-territories-and-takeshima)",
      },
      fetcher,
    );

    expect(refs).toEqual([
      { rankingKey: "total-area-including-northern-territories-and-takeshima" },
      { rankingKey: "total-population", year: "2020" },
    ]);
  });
});
