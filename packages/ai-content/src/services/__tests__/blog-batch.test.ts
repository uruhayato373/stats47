import { describe, expect, it } from "vitest";

import {
  addRankingImpressions,
  classifyIngest,
  matchesSource,
  rankBatchTopics,
  renderBatchSummary,
  slugForTopic,
  type BatchRow,
  type TopicEntry,
} from "../blog-batch";

function topic(key: string, overrides: Partial<TopicEntry> = {}): TopicEntry {
  return {
    topicKey: `gap-${key}`,
    archetype: "D2",
    metricKeys: [key],
    label: key,
    suggestedTitle: key,
    status: "pending",
    lane: "opportunity",
    ...overrides,
  };
}

const NO_METRICS = new Map();

describe("addRankingImpressions", () => {
  it("ランキングページの表示回数を key ごとに週をまたいで足す", () => {
    const demand = new Map<string, number>();
    const csv = [
      "page,clicks,impressions,ctr,position",
      "https://stats47.jp/ranking/a,1,100,0.01,5",
      "https://stats47.jp/blog/a,1,999,0.01,5",
      "https://stats47.jp/ranking/b/,1,999,0.01,5",
    ].join("\n");
    addRankingImpressions(csv, demand);
    addRankingImpressions(csv, demand);
    expect([...demand]).toEqual([["a", 200]]);
  });
});

describe("matchesSource", () => {
  const metrics = new Map([["a", { sourceKind: "kakei-chousa", displayName: "家計調査" }]]);

  it("トピックの出どころ・source.kind・調査名のどれでも当たる", () => {
    expect(matchesSource(topic("b", { source: "kakei-rollout" }), "kakei-rollout", metrics)).toBe(true);
    expect(matchesSource(topic("a"), "kakei-chousa", metrics)).toBe(true);
    expect(matchesSource(topic("a"), "家計調査", metrics)).toBe(true);
    expect(matchesSource(topic("b"), "家計調査", metrics)).toBe(false);
  });
});

describe("rankBatchTopics", () => {
  const base = { source: null, metrics: NO_METRICS, takenSlugs: new Set<string>() };

  it("需要の大きい順に並べ、同じ需要はトピックのスコア順にする", () => {
    const ranked = rankBatchTopics({
      ...base,
      topics: [
        topic("low", { combinedScore: 0.9 }),
        topic("tie-a", { combinedScore: 0.1 }),
        topic("tie-b", { combinedScore: 0.5 }),
        topic("high"),
      ],
      demand: new Map([["high", 50], ["low", 1], ["tie-a", 2], ["tie-b", 2]]),
    });
    expect(ranked.map((r) => r.topic.metricKeys[0])).toEqual(["high", "tie-b", "tie-a", "low"]);
  });

  it("2 指標の需要は足す", () => {
    const [ranked] = rankBatchTopics({
      ...base,
      topics: [topic("a", { archetype: "B", metricKeys: ["a", "b"] })],
      demand: new Map([["a", 3], ["b", 4]]),
    });
    expect(ranked.demand).toBe(7);
  });

  it("★実行中の送り箱と公開済みの slug を外す", () => {
    const taken = slugForTopic(topic("busy"));
    const ranked = rankBatchTopics({
      ...base,
      topics: [topic("busy"), topic("free")],
      demand: new Map(),
      takenSlugs: new Set([taken]),
    });
    expect(ranked.map((r) => r.topic.metricKeys[0])).toEqual(["free"]);
  });

  it("pending 以外を外し、同じ slug のトピックは 1 本にする", () => {
    const ranked = rankBatchTopics({
      ...base,
      topics: [
        topic("a", { topicKey: "gap-a" }),
        topic("a", { topicKey: "kakei-a" }),
        topic("done", { status: "done" }),
      ],
      demand: new Map(),
    });
    expect(ranked.map((r) => r.topic.topicKey)).toEqual(["gap-a"]);
  });

  it("source を指定すると該当するトピックだけを選ぶ", () => {
    const ranked = rankBatchTopics({
      ...base,
      source: "kakei-chousa",
      metrics: new Map([["a", { sourceKind: "kakei-chousa" }]]),
      topics: [topic("a"), topic("b")],
      demand: new Map(),
    });
    expect(ranked.map((r) => r.topic.metricKeys[0])).toEqual(["a"]);
  });
});

describe("classifyIngest", () => {
  it("exit 0 は公開待ち", () => {
    expect(classifyIngest("[ok] x", 0)).toBe("ready");
  });

  it("公開フラグ後に背景の blocker だけが残れば背景待ち", () => {
    const out = "[reject] x: 公開フラグ後のゲートで落ちた\n    - 背景: 記事固有背景がありません";
    expect(classifyIngest(out, 1)).toBe("background-pending");
  });

  it("★背景以外の blocker が混ざれば落ちた扱いにする", () => {
    const out = "[reject] x: 公開フラグ後のゲートで落ちた\n    - 背景: 無し\n    - H2 sections < 4";
    expect(classifyIngest(out, 1)).toBe("rejected");
  });

  it("critic REVISE や公開フラグ前の blocker は落ちた扱いにする", () => {
    expect(classifyIngest("[reject] x: critic が REVISE", 1)).toBe("rejected");
    expect(classifyIngest("[reject] x: ゲート blocker 1 件\n    - 背景: 無し", 1)).toBe("rejected");
  });
});

describe("renderBatchSummary", () => {
  const rows: BatchRow[] = [
    { slug: "a", status: "ready", demand: 1200, authorCalls: 1, tokens: 3000, costUsd: 0.1, title: "題A", research: true },
    { slug: "b", status: "background-pending", demand: 5, authorCalls: 2, tokens: 5000, costUsd: 0.2 },
    { slug: "c", status: "gate-rejected", demand: 3, authorCalls: 3, tokens: 7000, costUsd: 0.3, note: "RANK_MISMATCH | 2位" },
    { slug: "d", status: "skipped", demand: 1, note: "上位と下位に差が無い" },
  ];

  it("件数の要約と全行の表を出す", () => {
    const text = renderBatchSummary(rows, (s) => `cmd ${s}`);
    expect(text).toContain("合格 2/3 本 (公開待ち 1 / 背景待ち 1) / 書かない 1 本 / 合計 15,000 トークン");
    expect(text).toContain("| a | 公開待ち | 題A | 1,200 | あり | 1 | 3,000 | $0.10 |");
    expect(text).toContain("RANK_MISMATCH / 2位");
  });

  it("背景が未生成の記事を一覧にし、それ以外を載せない", () => {
    const text = renderBatchSummary(rows, (s) => `cmd ${s}`);
    expect(text).toContain("背景が未生成の記事 1 本");
    expect(text).toContain("- cmd b");
    expect(text).not.toContain("- cmd a");
  });
});
