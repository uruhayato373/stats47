import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AD_INTENT_SKIP_CLASS, isAdIntentAllowedPath } from "../ad-intent-scope";
import { AdIntentScope } from "../components/AdIntentScope";

let pathname: string | null = "/";
vi.mock("next/navigation", () => ({ usePathname: () => pathname }));

/**
 * 広告インテントの範囲の契約。守りたいのは、ブログの個別記事以外では拒否の目印が必ず body に残ること
 * (2026-08 に本文と出典の語が広告リンクへ書き換えられた事故の再発防止)。
 */
describe("isAdIntentAllowedPath", () => {
  it("ブログの個別記事だけを許す", () => {
    expect(isAdIntentAllowedPath("/blog/beer-happoshu-liquor-tax")).toBe(true);
    expect(isAdIntentAllowedPath("/blog/beer-happoshu-liquor-tax/")).toBe(true);
  });

  it("一覧・タグ・他のページ種別・不明な値は許さない", () => {
    for (const p of ["/blog", "/blog/", "/blog/tags", "/blog/tags/food", "/blog/a/b", "/ranking/total-population", "/themes/population-dynamics", "/", "", null, undefined]) {
      expect(isAdIntentAllowedPath(p), String(p)).toBe(false);
    }
  });
});

describe("AdIntentScope", () => {
  beforeEach(() => {
    document.body.className = `${AD_INTENT_SKIP_CLASS} antialiased`;
  });

  it("ブログの個別記事では body の目印を外し、他の class は残す", () => {
    pathname = "/blog/some-article";
    render(<AdIntentScope />);
    expect(document.body.classList.contains(AD_INTENT_SKIP_CLASS)).toBe(false);
    expect(document.body.classList.contains("antialiased")).toBe(true);
  });

  it("対象外のページでは目印を残す", () => {
    pathname = "/ranking/total-population";
    render(<AdIntentScope />);
    expect(document.body.classList.contains(AD_INTENT_SKIP_CLASS)).toBe(true);
  });

  it("記事から対象外のページへ移ると目印を付け直す", () => {
    pathname = "/blog/some-article";
    const view = render(<AdIntentScope />);
    expect(document.body.classList.contains(AD_INTENT_SKIP_CLASS)).toBe(false);
    pathname = "/themes/population-dynamics";
    view.rerender(<AdIntentScope />);
    expect(document.body.classList.contains(AD_INTENT_SKIP_CLASS)).toBe(true);
  });

  it("pathname が取れないときは拒否のままにする", () => {
    pathname = null;
    render(<AdIntentScope />);
    expect(document.body.classList.contains(AD_INTENT_SKIP_CLASS)).toBe(true);
  });
});
