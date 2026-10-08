import { THEME_CATALOGS } from "@stats47/data-configs/theme-catalog";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { trackNavClickMock } = vi.hoisted(() => ({ trackNavClickMock: vi.fn() }));
vi.mock("@/lib/analytics/events", () => ({
  trackNavClick: (...args: unknown[]) => trackNavClickMock(...args),
}));

import { ThemeEvidenceTopicsSection } from "../ThemeEvidenceTopicsSection";

describe("ThemeEvidenceTopicsSection", () => {
  it("教育・文化の論点と根拠資料を表示する", () => {
    render(<ThemeEvidenceTopicsSection themeKey="education-culture" />);

    expect(screen.getByRole("heading", { name: "白書・統計から見る論点" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "教育・文化施設への地域アクセス" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "高等教育への進学と地域移動" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "令和6年度 文部科学白書" })).toHaveLength(2);
  });

  it("関連ランキングと関連テーマを実在URLへ接続する", () => {
    render(<ThemeEvidenceTopicsSection themeKey="education-culture" />);

    expect(screen.getByRole("link", { name: "図書館数（人口100万人当たり）" })).toHaveAttribute(
      "href",
      "/ranking/library-count-per-million",
    );
    expect(screen.getAllByRole("link", { name: "人口動態" })[0]).toHaveAttribute(
      "href",
      "/themes/population-dynamics",
    );
  });

  it("論点からの内部遷移を theme_evidence surface で計測する", () => {
    render(<ThemeEvidenceTopicsSection themeKey="education-culture" />);
    const link = screen.getByRole("link", { name: "図書館数（人口100万人当たり）" });
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);
    expect(trackNavClickMock).toHaveBeenCalledWith({
      label: "facility-access:ranking:library-count-per-million",
      href: "/ranking/library-count-per-million",
      surface: "theme_evidence",
    });
  });

  it("費目や分母だけが違う同名の指標を、区別できる名前で並べる", () => {
    // 2026-10-08 まで title だけを出し、「消費者物価地域差指数」が 1 つの論点に 2〜3 本並んでいた
    render(<ThemeEvidenceTopicsSection themeKey="consumer-prices" />);
    const nav = screen.getByRole("navigation", {
      name: "食料・住居・光熱水道の価格構造の関連ランキング",
    });
    const names = [...nav.querySelectorAll("a")].map((a) => a.textContent);
    expect(names).toContain("消費者物価地域差指数（食料）");
    expect(new Set(names).size).toBe(names.length);
  });

  it("どのテーマの論点でも、関連ランキングに同じ名前のリンクが並ばない", () => {
    const duplicates: string[] = [];
    for (const [themeKey, catalog] of Object.entries(THEME_CATALOGS)) {
      if ((catalog.evidenceTopics?.length ?? 0) === 0) continue;
      const { container } = render(<ThemeEvidenceTopicsSection themeKey={themeKey} />);
      for (const nav of container.querySelectorAll('nav[aria-label$="の関連ランキング"]')) {
        const names = [...nav.querySelectorAll("a")].map((a) => a.textContent ?? "");
        const repeated = names.filter((name, i) => names.indexOf(name) !== i);
        if (repeated.length > 0) duplicates.push(`${themeKey}: ${repeated.join(", ")}`);
      }
      cleanup();
    }
    expect(duplicates).toEqual([]);
  });

  it("カタログ未設定のテーマキーでは何も表示しない", () => {
    const { container } = render(
      <ThemeEvidenceTopicsSection themeKey="__missing-theme-catalog__" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
