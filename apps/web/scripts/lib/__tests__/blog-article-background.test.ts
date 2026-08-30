import { describe, expect, it } from "vitest";

import { parseBlogArticleImageContext } from "../blog-article-background";

describe("parseBlogArticleImageContext", () => {
  it("入れ子状のHTML断片から山括弧を残さない", () => {
    const context = parseBlogArticleImageContext(
      "example",
      `---
title: Example
---

<script<script>>alert(1)</script>
`,
    );

    expect(context.introduction).not.toMatch(/[<>]/);
  });
});
