// @vitest-environment jsdom
/**
 * ブログ記事末の Amazon 関連書籍。vertical に書籍が無い記事では何も出さず、
 * 出す場合はアソシエイトタグ・sponsored・案件単位の ad_id を保証する。
 */
import type { ReactNode } from "react";

import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { RelatedAmazonBook } from "../components/RelatedAmazonBook";

vi.mock("../components/AdImpressionTracker", () => ({
  AdImpressionTracker: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

describe("RelatedAmazonBook", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("vertical が無い・書籍が無い vertical では描画しない", () => {
    const { container: none } = render(<RelatedAmazonBook vertical={null} />);
    expect(none.innerHTML).toBe("");
    const { container: noBook } = render(<RelatedAmazonBook vertical="mobility" />);
    expect(noBook.innerHTML).toBe("");
  });

  it("書籍がある vertical ではタグ付き Amazon リンクを PR 表記付きで出す", () => {
    vi.stubEnv("NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG", "stats47-22");
    render(<RelatedAmazonBook vertical="population" />);

    const link = screen.getByRole("link");
    expect(link.getAttribute("href")).toBe("https://www.amazon.co.jp/dp/4062884313?tag=stats47-22");
    expect(link.getAttribute("rel")).toContain("sponsored");
    expect(screen.getByText("PR・関連書籍")).toBeTruthy();
  });
});
