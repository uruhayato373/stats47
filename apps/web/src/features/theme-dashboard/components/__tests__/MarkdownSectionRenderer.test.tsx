import { render, screen } from "@testing-library/react";
import { describe, expect, test } from "vitest";

import { MarkdownSectionRenderer } from "../MarkdownSectionRenderer";

import type { MarkdownSectionComponentProps } from "../../types";

describe("MarkdownSectionRenderer", () => {
  test("Markdown 本文を render する (H3 / ul / strong)", () => {
    // Arrange
    const props: MarkdownSectionComponentProps = {
      markdown: [
        "### 高齢化の主要因",
        "",
        "- **出生率低下** が長期トレンド",
        "- 平均寿命の延伸",
      ].join("\n"),
    };

    // Act
    render(<MarkdownSectionRenderer title="考察" props={props} />);

    // Assert
    expect(
      screen.getByRole("heading", { level: 3, name: "高齢化の主要因" })
    ).toBeInTheDocument();
    const items = screen.getAllByRole("listitem");
    expect(items.length).toBe(2);
    expect(screen.getByText("出生率低下")).toBeInTheDocument();
    expect(screen.getByText(/平均寿命の延伸/)).toBeInTheDocument();
  });

  test("sources が外部リンクとしてレンダリングされる", () => {
    // Arrange
    const props: MarkdownSectionComponentProps = {
      markdown: "本文",
      sources: [
        { label: "総務省統計局", url: "https://www.stat.go.jp/" },
        { label: "出典名のみ（URL なし）" },
      ],
    };

    // Act
    render(<MarkdownSectionRenderer title="関連トピック" props={props} />);

    // Assert: URL ありは <a target="_blank">
    const link = screen.getByRole("link", { name: "総務省統計局" });
    expect(link).toHaveAttribute("href", "https://www.stat.go.jp/");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");

    // URL なしはリンクにならない
    expect(screen.getByText("出典名のみ（URL なし）")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "出典名のみ（URL なし）" })
    ).not.toBeInTheDocument();

    // 「出典」見出しが付く
    expect(
      screen.getByRole("heading", { level: 3, name: "出典" })
    ).toBeInTheDocument();
  });

  test("subtitle が指定された場合に表示される", () => {
    // Arrange
    const props: MarkdownSectionComponentProps = {
      markdown: "本文",
      subtitle: "高齢化テーマの考察",
    };

    // Act
    render(<MarkdownSectionRenderer title="考察" props={props} />);

    // Assert
    expect(screen.getByText("高齢化テーマの考察")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "考察" })
    ).toBeInTheDocument();
  });

  test("section に aria-label が付与される", () => {
    // Arrange
    const props: MarkdownSectionComponentProps = { markdown: "本文" };

    // Act
    const { container } = render(
      <MarkdownSectionRenderer title="FAQ" props={props} />
    );

    // Assert
    const section = container.querySelector("section");
    expect(section).not.toBeNull();
    expect(section?.getAttribute("aria-label")).toBe("FAQ");
  });
});
