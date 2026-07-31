/**
 * ranking-content-prompt のテスト。
 *
 * ## なぜこのテストが要るか (2026-07-31)
 *
 * 決定的ゲート `audit-ai-content.mjs` の最頻 blocker は `paren-number` (括弧内への数値挿入) で、
 * 実測でも生成 3 件中 1 件がこれで REJECT、通過した 1 件も 1 回目は同じ理由で弾かれていた。
 *
 * 原因はルール不足ではなく **プロンプト自身が禁止パターンを実演していたこと**。禁止ルールは
 * 末尾に書かれていたが、**出力 JSON テンプレートのプレースホルダが `（…）` 形式**で、しかも
 * 中に数値を含んでいた (`"（60〜120字。…）"` 等)。モデルが最も忠実に真似るのは出力形式の例なので、
 * 括弧を使う癖がそこから入る。
 *
 * よって固定する不変条件は 2 つ:
 *   1. 出力テンプレートのプレースホルダに全角括弧を使わない (禁止パターンを実演しない)
 *   2. 括弧禁止ルールがプロンプト冒頭の「絶対ルール」にある
 *      (`.claude/rules/model-prompting.md`: 制約は末尾ではなく冒頭に置く)
 *
 * 実行: npm run test:ai-content --workspace apps/web
 */

import { describe, expect, it } from "vitest";

import {
  buildRankingContentPrompt,
  type RankingContentInput,
} from "../prompts/ranking-content-prompt";

const rows = [
  { rank: 1, areaName: "兵庫県", value: 43047 },
  { rank: 2, areaName: "京都府", value: 41000 },
  { rank: 47, areaName: "沖縄県", value: 20000 },
];

const input: RankingContentInput = {
  rankingName: "パン消費支出額",
  unit: "円",
  yearCode: "2024",
  top10: rows.slice(0, 2),
  bottom10: rows.slice(2),
  allPrefectures: rows,
  average: 30000,
  min: 20000,
  max: 43047,
  totalCount: 47,
};

/** プロンプト中の ```json … ``` ブロック (出力形式の指定) を取り出す */
function extractJsonTemplate(prompt: string): string {
  const m = prompt.match(/```json\n([\s\S]*?)```/);
  if (!m) throw new Error("出力形式の JSON テンプレートが見つからない");
  return m[1];
}

describe("出力テンプレートが禁止パターンを実演しない", () => {
  it("プレースホルダに全角括弧を使わない (paren-number を誘発する原因だった)", () => {
    const template = extractJsonTemplate(buildRankingContentPrompt(input));
    // `"（…` の形 = 値の先頭が全角括弧のプレースホルダ
    expect(template).not.toMatch(/"\s*（/);
  });

  it("プレースホルダは <…> 形式で書かれている", () => {
    const template = extractJsonTemplate(buildRankingContentPrompt(input));
    expect(template).toContain('"<都道府県名>"');
  });

  it("テンプレート自体が壊れていない (必須キーが残っている)", () => {
    const template = extractJsonTemplate(buildRankingContentPrompt(input));
    for (const key of ["faq", "regionalAnalysis", "insights", "prefectureCommentary", "areaCode"]) {
      expect(template).toContain(`"${key}"`);
    }
  });
});

describe("括弧禁止ルールの配置", () => {
  it("冒頭の絶対ルールに含まれる (末尾に埋もれた指示は効きが弱い)", () => {
    const prompt = buildRankingContentPrompt(input);
    const rulesSection = prompt.slice(
      prompt.indexOf("## 絶対ルール"),
      prompt.indexOf("## ランキングデータ"),
    );
    expect(rulesSection).toContain("括弧の中に数値を書かない");
  });

  it("NG / OK の対比例を示している (肯定形だけでは効きが弱い)", () => {
    const prompt = buildRankingContentPrompt(input);
    const rulesSection = prompt.slice(
      prompt.indexOf("## 絶対ルール"),
      prompt.indexOf("## ランキングデータ"),
    );
    expect(rulesSection).toContain("NG:");
    expect(rulesSection).toContain("OK:");
  });

  it("末尾の詳細ルールも残っている (冒頭は要約・詳細は文体ルール)", () => {
    const prompt = buildRankingContentPrompt(input);
    expect(prompt).toContain("括弧による数値挿入を全面禁止");
  });
});
