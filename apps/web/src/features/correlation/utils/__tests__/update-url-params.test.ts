import { describe, it, expect, vi, beforeEach } from "vitest";

import { updateUrlParams } from "../update-url-params";

describe("updateUrlParams", () => {
  beforeEach(() => {
    // jsdom 環境で window.location をモック
    Object.defineProperty(window, "location", {
      value: { href: "https://stats47.jp/correlation?x=old&y=old" },
      writable: true,
    });
    window.history.replaceState = vi.fn();
  });

  it("x と y パラメータを設定する", () => {
    updateUrlParams("population", "gdp");

    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      expect.stringContaining("x=population")
    );
    expect(window.history.replaceState).toHaveBeenCalledWith(
      null,
      "",
      expect.stringContaining("y=gdp")
    );
  });

  it("x が空の場合に x パラメータを削除する", () => {
    updateUrlParams("", "gdp");

    const url = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0][2] as string;
    expect(url).not.toContain("x=");
    expect(url).toContain("y=gdp");
  });

  it("y が空の場合に y パラメータを削除する", () => {
    updateUrlParams("population", "");

    const url = (window.history.replaceState as ReturnType<typeof vi.fn>).mock.calls[0][2] as string;
    expect(url).toContain("x=population");
    expect(url).not.toContain("y=");
  });
});
