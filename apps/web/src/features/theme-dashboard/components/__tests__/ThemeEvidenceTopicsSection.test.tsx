import { fireEvent, render, screen } from "@testing-library/react";
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

    expect(screen.getByRole("link", { name: "図書館数" })).toHaveAttribute(
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
    const link = screen.getByRole("link", { name: "図書館数" });
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link);
    expect(trackNavClickMock).toHaveBeenCalledWith({
      label: "facility-access:ranking:library-count-per-million",
      href: "/ranking/library-count-per-million",
      surface: "theme_evidence",
    });
  });

  it("カタログ未設定のテーマキーでは何も表示しない", () => {
    const { container } = render(
      <ThemeEvidenceTopicsSection themeKey="__missing-theme-catalog__" />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
