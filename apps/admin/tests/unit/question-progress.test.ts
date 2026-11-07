import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { buildQuestionProgress, stageOf, type ProgressInput } from "@/lib/question-progress";

/**
 * 問いの進み具合が守る意図:
 *   - どの段階で止まっているかを、分析と図の有無ではなく配信先の実際の状態で決める
 *   - 公開済みの配信先を「待ち」に数えない / 見送った問いを数えない
 *   - 有料 note は同じページを経由する到達として数え、ページの無い問いには数えない
 *   - 社会の問いと事業の問いを混ぜない (2026-11-06 オーナー判断)
 */

const base = (over: Partial<ProgressInput> = {}): ProgressInput => ({
  issues: [
    { id: "issue:H01", level: "major", question: "空き家の問い", status: "active" },
    { id: "issue:A01", level: "major", question: "答えのある問い", status: "active", products: ["note:paid"] },
    { id: "issue:B01", level: "major", question: "手つかずの問い", status: "active" },
    { id: "issue:C01", level: "major", question: "見送った問い", status: "dropped" },
  ],
  links: [
    { issue: "issue:A01", page: "blog:a", role: "answers" },
    { issue: "issue:A01", page: "ranking:x", role: "evidence" },
    { issue: "issue:C01", page: "blog:c", role: "answers" },
  ],
  analyses: [{ id: "analysis:H01", issue: "issue:H01", status: "draft" }],
  figures: [
    {
      id: "figure:H01-a",
      analysis: "analysis:H01",
      template: "grouped-bar",
      title: "空き家の図",
      destinations: [
        { channel: "site", status: "draft", slug: "vacant" },
        { channel: "x", status: "draft", postId: 1 },
        { channel: "site", status: "published", page: "blog:a" },
      ],
    },
  ],
  posts: [{ id: 1, status: "draft" }],
  pages: new Map([["blog:a", { published: true }]]),
  drafts: new Map([["vacant", "背景待ち"]]),
  externalLinks: [
    { from: "note:paid", to: "ranking:x" },
    { from: "note:free", to: "ranking:x" },
    { from: "sns:1", to: "blog:a" },
    { from: "note:paid", to: "blog:other" },
  ],
  paidNoteIds: new Set(["note:paid"]),
  ...over,
});

describe("buildQuestionProgress", () => {
  it("公開済みの配信先は待ちに数えない", () => {
    const { rows } = buildQuestionProgress(base());
    expect(rows.find((r) => r.id === "issue:H01")).toMatchObject({ stage: "配信待ち", analyses: 1, figures: 1, openDestinations: 2 });
  });

  it("全ての配信先が公開済みなら配信済みになる", () => {
    const figures = base().figures.map((f) => ({ ...f, destinations: [f.destinations[2]] }));
    expect(buildQuestionProgress(base({ figures })).rows.find((r) => r.id === "issue:H01")?.stage).toBe("配信済み");
  });

  it("見送った問いは数えない", () => {
    expect(buildQuestionProgress(base()).rows.map((r) => r.id)).toEqual(["issue:H01", "issue:A01", "issue:B01"]);
  });

  it("商品は問いが直接指す数を出し、ページ経由の有料 note は別に数える", () => {
    const { rows } = buildQuestionProgress(base());
    expect(rows.find((r) => r.id === "issue:A01")).toMatchObject({ stage: "既存記事のみ", products: 1, relatedNotes: 2, relatedPosts: 1, relatedPaidNotes: 1 });
    expect(rows.find((r) => r.id === "issue:B01")).toMatchObject({ stage: "答えなし", products: 0, relatedNotes: 0 });
  });
});

describe("段階", () => {
  it("図の配信先が無い分析は配信済みにしない", () => {
    expect(stageOf({ answers: 1, analyses: 1, destinations: 0, openDestinations: 0 })).toBe("分析中");
  });
});

describe("事業の問いと混ぜない", () => {
  it("問いの進み具合のコードは事業の台帳と収益の項目を読まない", () => {
    for (const file of ["lib/question-progress.ts", "lib/server/question-progress.ts", "app/content/questions/[id]/page.tsx"]) {
      const code = readFileSync(resolve(__dirname, "../..", file), "utf8").split("\n").filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join("\n");
      expect(code, file).not.toMatch(/business\.|issue-map|biz:|\.revenue|"revenue"/);
    }
  });
});
