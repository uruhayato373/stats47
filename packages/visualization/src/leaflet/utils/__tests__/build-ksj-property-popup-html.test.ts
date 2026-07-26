import { describe, expect, it } from "vitest";

import { buildKsjPropertyPopupHtml } from "../build-ksj-property-popup-html";

describe("buildKsjPropertyPopupHtml", () => {
  it("共通Tableと同じ13px・36px・6px×8pxの密度で生成する", () => {
    const html = buildKsjPropertyPopupHtml({ 都道府県: "高知県" });

    expect(html).toContain("font-size:13px");
    expect(html).toContain("height:36px");
    expect(html).toContain("padding:6px 8px");
  });

  it("空値を除外し、外部データをHTMLエスケープする", () => {
    const html = buildKsjPropertyPopupHtml({
      "<名称>": '<script>alert("x")</script>',
      空文字: "",
      null値: null,
    });

    expect(html).toContain("&lt;名称&gt;");
    expect(html).toContain(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;",
    );
    expect(html).not.toContain("<script>");
    expect(html).not.toContain("空文字");
    expect(html).not.toContain("null値");
  });

  it("表示できるプロパティがなければ空状態を返す", () => {
    expect(buildKsjPropertyPopupHtml({ value: null })).toBe(
      "<em>プロパティなし</em>",
    );
  });
});
