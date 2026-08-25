import { describe, expect, it } from "vitest";

import { parseFaqMarkdown } from "../faq-markdown";
import { listThemeCatalogs } from "../index";
import { catalogToPageComponentsJson } from "../transform";

describe("parseFaqMarkdown", () => {
  it("authored Markdown を質問・回答へ構造化する", () => {
    const result = parseFaqMarkdown(
      "### Q1: 最初の質問?\n\n最初の回答。\n\n### Q2：次の質問?\n\n**強調**を含む回答。",
    );

    expect(result).toEqual({
      ok: true,
      items: [
        { question: "最初の質問?", answer: "最初の回答。" },
        { question: "次の質問?", answer: "**強調**を含む回答。" },
      ],
    });
  });

  it.each([
    ["空本文", ""],
    ["見出し前の本文", "前置き\n### Q1: 質問\n\n回答"],
    ["不正な見出し", "### 質問\n\n回答"],
    ["空の回答", "### Q1: 質問"],
    ["重複質問", "### Q1: 質問\n\n回答1\n### Q2: 質問\n\n回答2"],
  ])("%s を拒否する", (_name, markdown) => {
    expect(parseFaqMarkdown(markdown).ok).toBe(false);
  });
});

describe("ThemeCatalog FAQ の配信契約", () => {
  it("全FAQを生成時に構造化し、runtimeへMarkdown原文を渡さない", () => {
    const faqRows: Array<Record<string, unknown>> = [];
    for (const catalog of listThemeCatalogs()) {
      const rows = JSON.parse(catalogToPageComponentsJson(catalog)) as Array<
        Record<string, unknown>
      >;
      faqRows.push(
        ...rows.filter((row) => {
          const props = row.componentProps as Record<string, unknown>;
          return props.displayMode === "faq";
        }),
      );
    }

    expect(faqRows).toHaveLength(8);
    for (const row of faqRows) {
      const props = row.componentProps as Record<string, unknown>;
      expect(Array.isArray(props.items)).toBe(true);
      expect((props.items as unknown[]).length).toBeGreaterThan(0);
      expect(props.markdown).toBeUndefined();
    }
  });
});
