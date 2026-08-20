import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ThemePrefectureProvider } from "../ThemePrefectureContext";
import { ThemeSideNav } from "../ThemeSideNav";
import { buildThemeSwitcherOptions } from "../ThemeSwitcher";

/**
 * テーマページ左レールの契約。
 *
 * ★2026-08-04 に「PC 常設左サイドバー廃止 (2026-06)」の例外として復活させたページ内ナビ。
 * ここで固定するのは、(a) テーマ一覧が SSOT (ALL_THEMES → buildThemeSwitcherOptions) から
 * 導出され複製されないこと、(b) 現在地が支援技術に伝わること、(c) Provider を持たない
 * bespoke ページ (local-finance) で地域ブロックを出さないこと。
 */

function renderWithProvider(ui: React.ReactElement) {
  return render(<ThemePrefectureProvider>{ui}</ThemePrefectureProvider>);
}

describe("ThemeSideNav — テーマ一覧", () => {
  it("リンクは buildThemeSwitcherOptions と同数・同 href (SSOT から導出・複製しない)", () => {
    renderWithProvider(<ThemeSideNav currentThemeKey="population-dynamics" />);
    const expected = buildThemeSwitcherOptions();
    const nav = screen.getByRole("navigation", { name: "テーマと地域" });
    const links = within(nav).getAllByRole("link");

    expect(links).toHaveLength(expected.length);
    expect(links.map((a) => a.getAttribute("href"))).toEqual(
      expected.map((o) => o.href),
    );
  });

  it("現在のテーマだけに aria-current=page が付く", () => {
    renderWithProvider(<ThemeSideNav currentThemeKey="tourism" />);
    const nav = screen.getByRole("navigation", { name: "テーマと地域" });
    const current = within(nav)
      .getAllByRole("link")
      .filter((a) => a.getAttribute("aria-current") === "page");

    expect(current).toHaveLength(1);
    const expectedTitle = buildThemeSwitcherOptions().find(
      (o) => o.themeKey === "tourism",
    )!.title;
    expect(current[0]).toHaveTextContent(expectedTitle);
  });

  it("areaContext: 都道府県文脈を維持した /areas/{code}/{key} を張る", () => {
    renderWithProvider(
      <ThemeSideNav
        currentThemeKey="population-dynamics"
        areaContext={{ areaCode: "13000" }}
      />,
    );
    const nav = screen.getByRole("navigation", { name: "テーマと地域" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));

    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(href).toMatch(/^\/areas\/13000\//);
    }
    // area ページで 410 になる Type B テーマは選択肢に出さない
    expect(hrefs).not.toContain("/areas/13000/ports");
  });
});

describe("ThemeSideNav — 地域ブロック", () => {
  it("既定では地域セレクタを出し、未選択時は「47都道府県」を現在値にする ('全国' ではない)", () => {
    renderWithProvider(<ThemeSideNav currentThemeKey="population-dynamics" />);
    expect(screen.getByLabelText("都道府県を選択")).toHaveTextContent("47都道府県");
    expect(screen.getByLabelText("都道府県を選択")).not.toHaveTextContent("全国");
    // 47都道府県のときは「47都道府県に戻す」を出さない (押しても変化しないボタンを置かない)
    expect(screen.queryByRole("button", { name: "47都道府県に戻す" })).toBeNull();
  });

  it("showRegion=false で地域ブロックを出さない (Provider が無い bespoke ページ用)", () => {
    // Provider で包まずに描画できることも同時に確認する
    render(<ThemeSideNav currentThemeKey="local-finance" showRegion={false} />);
    expect(screen.queryByLabelText("都道府県を選択")).toBeNull();
    // テーマ一覧は出る
    expect(
      within(screen.getByRole("navigation", { name: "テーマと地域" })).getAllByRole(
        "link",
      ).length,
    ).toBeGreaterThan(0);
  });

  it("県を選ぶと現在値が県名になり「47都道府県に戻す」が出る", async () => {
    renderWithProvider(<ThemeSideNav currentThemeKey="population-dynamics" />);

    fireEvent.click(screen.getByLabelText("都道府県を選択"));
    fireEvent.click(await screen.findByRole("option", { name: "大阪府" }));

    await waitFor(() => {
      expect(screen.getByLabelText("都道府県を選択")).toHaveTextContent("大阪府");
    });
    expect(screen.getByRole("button", { name: "47都道府県に戻す" })).toBeInTheDocument();
  });
});
