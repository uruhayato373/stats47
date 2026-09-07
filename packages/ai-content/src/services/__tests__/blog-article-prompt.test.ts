import { describe, expect, it } from "vitest";

import {
  buildBlogArticlePrompt,
  type BlogArticlePromptInput,
  type GroundTruthMetric,
} from "../prompts/blog-article-prompt";

/**
 * 読者向けコピー (readerLabel / hook) が prompt に届いているかを固定する。
 *
 * 配線が切れても prompt は組み上がってしまい、出来上がった記事を読むまで気づけない
 * (実際 2026-09-07 まで、item.json に readerLabel が焼かれているのにブログ側が
 * 一度も読んでいなかった)。ここで「実データの見出しが平易な呼び方になっていること」と
 * 「正式名も同時に渡っていること」の両方を assert する。
 */
const METRIC: GroundTruthMetric = {
  rankingKey: "beef-consumption-expenditure",
  label: "牛肉消費支出額",
  readerLabel: "牛肉への支出",
  hook: "牛肉への支出が最も多い県は？",
  unit: "円",
  year: "2024",
  source: "家計調査",
  rows: [
    { rank: 1, areaName: "京都府", value: 24000 },
    { rank: 2, areaName: "奈良県", value: 23000 },
  ],
};

function buildInput(
  overrides: Partial<BlogArticlePromptInput> = {},
): BlogArticlePromptInput {
  return {
    slug: "beef-consumption-expenditure-prefecture-gap",
    archetype: "D2",
    suggestedTitle: "牛肉にお金を使う県はどこか",
    metrics: [METRIC],
    figures: [
      {
        caption: "ランキング (上位5+下位5)",
        markdown: "![牛肉への支出の上位と下位](data/x-prefecture-rankings.svg)",
      },
    ],
    sourceLinkHref: "/ranking/beef-consumption-expenditure",
    sourceLinkLabel: "牛肉への支出ランキングをもっと見る",
    allowedLinks: [{ href: "/category/economy", label: "同じカテゴリの統計一覧" }],
    ...overrides,
  };
}

describe("buildBlogArticlePrompt — 読者向けコピーの配線", () => {
  it("実データの見出しに平易な呼び方を使い、正式な統計名も併記する", () => {
    const prompt = buildBlogArticlePrompt(buildInput());

    expect(prompt).toContain("## 牛肉への支出");
    // 正式名は出典・定義のために残す (readerLabel だけにすると照合できなくなる)
    expect(prompt).toContain("正式な統計名: 牛肉消費支出額");
  });

  it("hook をタイトルの種として渡す", () => {
    const prompt = buildBlogArticlePrompt(buildInput());

    expect(prompt).toContain("牛肉への支出が最も多い県は？");
    // そのまま題にさせない (hook は 47 都道府県の並びを問う汎用文)
    expect(prompt).toContain("語彙を揃える参考");
  });

  it("readerLabel が無い指標は正準名にフォールバックする", () => {
    const prompt = buildBlogArticlePrompt(
      buildInput({
        metrics: [{ ...METRIC, readerLabel: undefined, hook: undefined }],
      }),
    );

    expect(prompt).toContain("## 牛肉消費支出額");
    expect(prompt).toContain("正式な統計名: 牛肉消費支出額");
    // hook が無ければ種の行自体を出さない (空の見出しを渡さない)
    expect(prompt).not.toContain("語彙を揃える参考");
  });

  it("複数指標の hook をすべて種として渡す", () => {
    const second: GroundTruthMetric = {
      ...METRIC,
      rankingKey: "pork-consumption-expenditure",
      label: "豚肉消費支出額",
      readerLabel: "豚肉への支出",
      hook: "豚肉への支出が最も多い県は？",
    };
    const prompt = buildBlogArticlePrompt(
      buildInput({ archetype: "B", metrics: [METRIC, second] }),
    );

    expect(prompt).toContain("牛肉への支出が最も多い県は？");
    expect(prompt).toContain("豚肉への支出が最も多い県は？");
  });
});
