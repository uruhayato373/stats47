import { fetchPrefectures } from "@stats47/area";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";


const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock("@/lib/analytics/events", () => ({
  trackNavClick: (...args: unknown[]) => trackMock(...args),
}));

import { buildAreaDirectoryData } from "../../utils/build-area-directory-data";
import { AreaSelectionPanels } from "../AreaSelectionPanels";

const data = buildAreaDirectoryData(fetchPrefectures());

beforeEach(() => {
  trackMock.mockReset();
});

describe("AreaSelectionPanels", () => {
  it("既定タブが『一覧から探す』(list) である", () => {
    render(<AreaSelectionPanels {...data} />);
    expect(
      screen.getByRole("tab", { name: "一覧から探す" }),
    ).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tab", { name: "地図から探す" }),
    ).toHaveAttribute("aria-selected", "false");
  });

  it("一覧リンククリックで areas_list を計測する", () => {
    render(<AreaSelectionPanels {...data} />);
    // 一覧 (nav) 内の東京都リンクをクリック (地図タイルと区別する)
    const nav = screen.getAllByRole("navigation", { name: "都道府県一覧" })[0];
    fireEvent.click(
      within(nav).getByRole("link", { name: "東京都の統計を見る" }),
    );
    expect(trackMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "areas_list", href: "/areas/13000" }),
    );
  });

  it("地図タイルクリックで areas_map を計測する", () => {
    render(<AreaSelectionPanels {...data} />);
    // 地図 (group) 内の東京都タイルをクリック (一覧リンクと区別する)
    const mapGroup = screen.getAllByRole("group", {
      name: "地図から都道府県を選ぶ",
    })[0];
    fireEvent.click(
      within(mapGroup).getByRole("link", { name: "東京都の統計を見る" }),
    );
    expect(trackMock).toHaveBeenCalledWith(
      expect.objectContaining({ surface: "areas_map", href: "/areas/13000" }),
    );
  });

  it("モバイル用に一覧/地図の2タブを備える", () => {
    render(<AreaSelectionPanels {...data} />);
    const tabs = screen.getAllByRole("tab");
    expect(tabs).toHaveLength(2);
    expect(screen.getByRole("tab", { name: "一覧から探す" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "地図から探す" })).toBeInTheDocument();
  });

  it("デスクトップ地方フィルタで絞り込み状態を切替える (view state)", () => {
    render(<AreaSelectionPanels {...data} />);
    const kanto = screen.getByRole("button", { name: "関東" });
    expect(kanto).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(kanto);
    expect(kanto).toHaveAttribute("aria-pressed", "true");
  });
});
