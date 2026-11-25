import { fetchPrefectures } from "@stats47/area";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";


import { buildAreaDirectoryData } from "../../utils/build-area-directory-data";
import { AreaDirectoryList, COMFORTABLE_GRID_CLASS } from "../AreaDirectoryList";

const { regionGroups } = buildAreaDirectoryData(fetchPrefectures());

describe("AreaDirectoryList", () => {
  it("全47県のリンクを /areas/{code} で描画しアクセシブルネームを持つ", () => {
    render(<AreaDirectoryList regionGroups={regionGroups} />);
    const links = screen.getAllByRole("link", { name: /の統計を見る$/ });
    expect(links).toHaveLength(47);
    expect(
      screen.getByRole("link", { name: "東京都の統計を見る" }),
    ).toHaveAttribute("href", "/areas/13000");
  });

  it("都道府県一覧の nav landmark を持つ", () => {
    render(<AreaDirectoryList regionGroups={regionGroups} />);
    expect(
      screen.getByRole("navigation", { name: "都道府県一覧" }),
    ).toBeInTheDocument();
  });

  it("onSelect がクリックで prefCode/prefName を受け取る", () => {
    const onSelect = vi.fn();
    render(<AreaDirectoryList regionGroups={regionGroups} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole("link", { name: "東京都の統計を見る" }));
    expect(onSelect).toHaveBeenCalledWith("13000", "東京都");
  });

  it("comfortable の一覧は幅 320px 以上で 3 列にする (スマホのページの高さの予算)", () => {
    render(<AreaDirectoryList regionGroups={regionGroups} />);
    const nav = screen.getByRole("navigation", { name: "都道府県一覧" });
    expect(nav).toHaveClass("@container");
    const list = screen.getByRole("link", { name: "東京都の統計を見る" }).closest("ul");
    expect(list?.className).toBe(COMFORTABLE_GRID_CLASS);
    expect(COMFORTABLE_GRID_CLASS).toContain("@min-[20rem]:grid-cols-3");
  });

  it("compact は境界線カードではなく地方別テキストリンクを描画する", () => {
    render(<AreaDirectoryList regionGroups={regionGroups} density="compact" />);
    const tokyo = screen.getByRole("link", { name: "東京都の統計を見る" });
    expect(tokyo).not.toHaveClass("border");
    expect(tokyo).not.toHaveTextContent("→");
  });
});
