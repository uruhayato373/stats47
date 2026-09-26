import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataSourceList } from "../DataSourceList";

describe("DataSourceList", () => {
  it("調査名はサイト内の調査ページへ、統計表は e-Stat へリンクする", () => {
    render(
      <DataSourceList
        surface="blog_source"
        sources={[
          {
            label: "家計調査（品目別）",
            organization: "総務省統計局",
            surveyId: "kakei-chousa",
            tables: [
              { label: "家計調査 月次 (金額)", url: "https://www.e-stat.go.jp/dbview?sid=0003343671" },
              { label: "家計調査 月次 (数量)", url: "https://www.e-stat.go.jp/dbview?sid=0003343670" },
            ],
          },
        ]}
      />,
    );

    const section = screen.getByTestId("data-source-section");
    expect(within(section).getByRole("heading", { name: "データ出典" })).toBeInTheDocument();
    const surveyLink = within(section).getByRole("link", { name: /^家計調査（品目別）/ });
    expect(surveyLink).toHaveAttribute("href", "/survey/kakei-chousa");
    // 出典の確認から本文へ戻れるよう、サイト内の調査ページも新しいタブで開く
    expect(surveyLink).toHaveAttribute("target", "_blank");
    expect(section).toHaveTextContent("（総務省統計局）");
    const tables = within(section).getAllByRole("link", { name: /家計調査 月次/ });
    expect(tables.map((link) => link.getAttribute("href"))).toEqual([
      "https://www.e-stat.go.jp/dbview?sid=0003343671",
      "https://www.e-stat.go.jp/dbview?sid=0003343670",
    ]);
    expect(tables.map((link) => link.textContent)).toEqual(["統計表1", "統計表2"]);
    expect(tables[0]).toHaveAttribute("target", "_blank");
  });

  it("合成 id の調査はサイト内リンクにせず、外部 URL があればそちらへリンクする", () => {
    render(
      <DataSourceList
        surface="geo_source"
        sources={[
          {
            label: "国土数値情報",
            surveyId: "ssds-src:国土数値情報",
            url: "https://nlftp.mlit.go.jp/ksj/",
            tables: [],
            license: "CC BY 4.0",
          },
        ]}
      />,
    );
    const link = screen.getByRole("link", { name: /国土数値情報/ });
    expect(link).toHaveAttribute("href", "https://nlftp.mlit.go.jp/ksj/");
    expect(screen.getByText("ライセンス: CC BY 4.0")).toBeInTheDocument();
  });

  it("出典が無ければ何も描画しない", () => {
    const { container } = render(<DataSourceList surface="blog_source" sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
