import { createElement } from "react";

import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { RankingFaqSection } from "../components/RankingFaqSection";

/** コンポーネントを静的 HTML にレンダリング（null → "" になる） */
function renderFaq(faqJson: string | null, rankingName = "テスト") {
  return renderToStaticMarkup(
    createElement(RankingFaqSection, { faqJson, rankingName }),
  );
}

describe("RankingFaqSection", () => {
  it("faqJson が null の場合は何も出力しない", () => {
    expect(renderFaq(null)).toBe("");
  });

  it("不正な JSON の場合は何も出力しない", () => {
    expect(renderFaq("{invalid json}")).toBe("");
  });

  it("items が空配列の場合は何も出力しない", () => {
    expect(renderFaq(JSON.stringify({ items: [] }))).toBe("");
  });

  it("items プロパティがない場合は何も出力しない", () => {
    expect(renderFaq(JSON.stringify({ other: "data" }))).toBe("");
  });

  it("question が空文字列の場合は何も出力しない", () => {
    expect(renderFaq(JSON.stringify({
      items: [{ question: "", answer: "回答", type: "custom" }],
    }))).toBe("");
  });

  it("有効な FAQ データから JSON-LD script タグを生成する", () => {
    const faqJson = JSON.stringify({
      items: [
        { question: "Q1", answer: "A1", type: "custom" },
        { question: "Q2", answer: "A2", type: "trend" },
      ],
    });

    const html = renderFaq(faqJson, "人口ランキング");
    expect(html).toContain("application/ld+json");
    expect(html).toContain("FAQPage");
    expect(html).toContain("Q1");
    expect(html).toContain("A1");
    expect(html).toContain("Q2");
  });

  it("< 文字を \\u003c にエスケープする（XSS 対策）", () => {
    const faqJson = JSON.stringify({
      items: [
        { question: "テスト</script>", answer: "回答", type: "custom" },
      ],
    });

    const html = renderFaq(faqJson);
    expect(html).not.toContain("</script><");
    expect(html).toContain("\\u003c");
  });
});
