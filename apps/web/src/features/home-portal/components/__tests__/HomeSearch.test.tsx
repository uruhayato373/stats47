import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, it, expect, vi } from "vitest";

const { pushMock } = vi.hoisted(() => ({ pushMock: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, prefetch: vi.fn(), replace: vi.fn() }),
}));

const { searchMock } = vi.hoisted(() => ({ searchMock: vi.fn() }));
vi.mock("@/lib/analytics/events", () => ({
  trackSearch: (...args: unknown[]) => searchMock(...args),
}));

import { HomeSearch } from "../HomeSearch";

const TERMS = ["人口減少", "年収", "移住"];

beforeEach(() => {
  pushMock.mockReset();
  searchMock.mockReset();
});

describe("HomeSearch", () => {
  it("検索入力と人気キーワードを描画する", () => {
    render(<HomeSearch terms={TERMS} />);
    expect(screen.getByRole("searchbox")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "移住" })).toHaveAttribute(
      "href",
      "/search?q=%E7%A7%BB%E4%BD%8F",
    );
  });

  it("submit で /search?q=<encoded> へ遷移し trackSearch を送る", () => {
    render(<HomeSearch terms={TERMS} />);
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "東京 人口" },
    });
    fireEvent.click(screen.getByRole("button", { name: "検索する" }));
    expect(pushMock).toHaveBeenCalledWith("/search?q=%E6%9D%B1%E4%BA%AC%20%E4%BA%BA%E5%8F%A3");
    expect(searchMock).toHaveBeenCalledWith(
      expect.objectContaining({ searchTerm: "東京 人口" }),
    );
  });

  it("空 submit は無視する", () => {
    render(<HomeSearch terms={TERMS} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "検索する" }));
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("analytics が例外を投げても遷移する", () => {
    searchMock.mockImplementation(() => {
      throw new Error("ga fail");
    });
    render(<HomeSearch terms={TERMS} />);
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "年収" } });
    fireEvent.click(screen.getByRole("button", { name: "検索する" }));
    expect(pushMock).toHaveBeenCalledWith("/search?q=%E5%B9%B4%E5%8F%8E");
  });
});
