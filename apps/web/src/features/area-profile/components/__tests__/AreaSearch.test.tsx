import { fetchPrefectures } from "@stats47/area";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";


const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));
vi.mock("@/lib/analytics/events", () => ({
  trackNavClick: (...args: unknown[]) => trackMock(...args),
}));

import { AreaSearch } from "../AreaSearch";

const PREFS = fetchPrefectures();

beforeEach(() => {
  pushMock.mockReset();
  trackMock.mockReset();
});

describe("AreaSearch", () => {
  it("ラベルと combobox を描画する", () => {
    render(<AreaSearch prefectures={PREFS} />);
    expect(screen.getByText("都道府県名を検索")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("『東京』で東京都候補を表示する", () => {
    render(<AreaSearch prefectures={PREFS} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "東京" },
    });
    expect(screen.getByRole("option", { name: "東京都" })).toBeInTheDocument();
  });

  it("キーボード ArrowDown+Enter で県ページへ遷移し areas_search を計測する", () => {
    render(<AreaSearch prefectures={PREFS} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "東京" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(pushMock).toHaveBeenCalledWith("/areas/13000");
    expect(trackMock).toHaveBeenCalledWith(
      expect.objectContaining({
        surface: "areas_search",
        href: "/areas/13000",
        label: "東京都",
      }),
    );
  });

  it("候補クリックで県ページへ遷移する", () => {
    render(<AreaSearch prefectures={PREFS} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "大阪" },
    });
    fireEvent.click(screen.getByRole("option", { name: "大阪府" }));
    expect(pushMock).toHaveBeenCalledWith("/areas/27000");
  });

  it("0件で該当なしメッセージを出し option を出さない", () => {
    render(<AreaSearch prefectures={PREFS} />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "xyz" },
    });
    expect(
      screen.getByText("該当する都道府県がありません"),
    ).toBeInTheDocument();
    expect(screen.queryByRole("option")).not.toBeInTheDocument();
  });

  it("analytics が例外を投げても navigation は成立する", () => {
    trackMock.mockImplementation(() => {
      throw new Error("ga failure");
    });
    render(<AreaSearch prefectures={PREFS} />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "東京" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(pushMock).toHaveBeenCalledWith("/areas/13000");
  });
});
