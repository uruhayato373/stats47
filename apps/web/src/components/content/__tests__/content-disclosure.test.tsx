import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ContentDisclosure, FaqSection } from "../index";

describe("ContentDisclosure", () => {
  it("JS不要のdetailsと統一タイポグラフィ・開閉アイコンを出力する", () => {
    const { container } = render(
      <ContentDisclosure title="地域別の傾向">本文</ContentDisclosure>,
    );

    const details = container.querySelector("details");
    expect(details).not.toHaveAttribute("open");
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("text-sm");
    expect(container.querySelector('[data-slot="disclosure-icon"]')).toHaveClass(
      "h-3",
      "w-3",
    );
    expect(container.textContent).not.toContain("▼");
    expect(container.textContent).toContain("本文");
  });

  it("bordered=falseでも同じdetails契約を維持する", () => {
    const { container } = render(
      <ContentDisclosure title="定義" bordered={false} defaultOpen>
        内容
      </ContentDisclosure>,
    );

    expect(container.querySelector("section")).toBeNull();
    expect(container.querySelector("details")).toHaveAttribute("open");
  });
});

describe("FaqSection", () => {
  it("セクションは常時表示し、質問ごとにdetailsを出力する", () => {
    const { container } = render(
      <FaqSection
        title="よくある質問"
        subtitle="2問"
        items={[
          { question: "質問1", answer: "回答1" },
          { question: "質問2", answer: "回答2" },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { level: 2, name: "よくある質問" })).toHaveClass(
      "text-sm",
    );
    expect(container.querySelectorAll("details")).toHaveLength(2);
    expect(screen.getByText("Q. 質問1")).toHaveClass("text-sm", "font-normal");
    expect(screen.getByText("A. 回答1")).toBeInTheDocument();
    expect(container.textContent).not.toContain("▼");
  });
});
