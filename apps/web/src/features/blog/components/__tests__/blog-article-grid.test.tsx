import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BlogArticleGrid } from "../blog-article-grid";

import type { Article } from "../../types";

const ARTICLE = {
  slug: "population-change",
  title: "人口が増えている都道府県は？最新データを比較",
  description: "47都道府県の人口増減率を比較し、地域差の背景を読み解きます。",
  hasCharts: true,
  publishedAt: "2026-07-20T00:00:00.000Z",
  updatedAt: "2026-07-25T00:00:00.000Z",
} as Article;

describe("BlogArticleGrid", () => {
  it("画像に依存せず記事情報をDOMテキストで表示する", () => {
    const { container } = render(<BlogArticleGrid articles={[ARTICLE]} />);

    expect(screen.getByRole("link", { name: /人口が増えている都道府県/ })).toHaveAttribute(
      "href",
      "/blog/population-change",
    );
    expect(screen.getByText(ARTICLE.description!)).toBeInTheDocument();
    expect(screen.getByText("グラフあり")).toBeInTheDocument();
    expect(screen.getByText("更新 2026.07.25")).toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  it("記事がない場合は空状態を表示する", () => {
    render(<BlogArticleGrid articles={[]} />);
    expect(screen.getByText("条件に一致する記事が見つかりませんでした")).toBeInTheDocument();
  });
});
