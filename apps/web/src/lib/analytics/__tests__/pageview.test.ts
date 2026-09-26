import { describe, it, expect } from "vitest";

import { resolvePageReferrer, resolvePageViewTrigger } from "../pageview";

describe("page_view の参照元と送信理由", () => {
  it("着地では外部の参照元を使い、サイト内遷移では直前のサイト内 URL を使う", () => {
    expect(resolvePageReferrer(null, "https://stats47.jp", "https://www.google.com/")).toBe("https://www.google.com/");
    // document.referrer は SPA 遷移で変わらないため、使うとサイト内の回遊が参照元から消える
    expect(resolvePageReferrer("/ranking/births", "https://stats47.jp", "https://www.google.com/")).toBe(
      "https://stats47.jp/ranking/births"
    );
  });

  it("着地・ページ移動・クエリだけの変更を区別する", () => {
    expect(resolvePageViewTrigger(null, "/ranking/births")).toBe("landing");
    expect(resolvePageViewTrigger("/ranking/births", "/ranking/crude-birth-rate")).toBe("navigation");
    expect(resolvePageViewTrigger("/ranking/births", "/ranking/births?year=2020")).toBe("query_change");
    expect(resolvePageViewTrigger("/ranking/births?year=2020", "/ranking/births?year=2021")).toBe("query_change");
  });
});
