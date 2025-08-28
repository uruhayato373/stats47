import { render, screen } from "@testing-library/react";
import { Footer } from "./Footer";

// Next.jsのLinkコンポーネントをモック
jest.mock("next/link", () => {
  return function MockLink({ children, href, ...props }: any) {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

describe("Footer Component", () => {
  beforeEach(() => {
    render(<Footer />);
  });

  test("ブランド情報が表示される", () => {
    expect(screen.getByText("地域統計ダッシュボード")).toBeInTheDocument();
    expect(
      screen.getByText("e-Stat API による地域統計データ")
    ).toBeInTheDocument();
  });

  test("クイックリンクが表示される", () => {
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
    expect(screen.getByText("概要")).toBeInTheDocument();
    expect(screen.getByText("お問い合わせ")).toBeInTheDocument();
  });

  test("カテゴリ別リンクが表示される", () => {
    expect(screen.getByText("人口統計")).toBeInTheDocument();
    expect(screen.getByText("経済指標")).toBeInTheDocument();
    expect(screen.getByText("社会福祉")).toBeInTheDocument();
    expect(screen.getByText("環境・エネルギー")).toBeInTheDocument();
  });

  test("法的リンクが表示される", () => {
    expect(screen.getByText("プライバシーポリシー")).toBeInTheDocument();
    expect(screen.getByText("利用規約")).toBeInTheDocument();
  });

  test("コピーライトが表示される", () => {
    const currentYear = new Date().getFullYear();
    expect(
      screen.getByText(`© ${currentYear} 地域統計ダッシュボード`)
    ).toBeInTheDocument();
  });

  test("リンクが正しいhref属性を持つ", () => {
    const homeLink = screen.getByText("ホーム").closest("a");
    expect(homeLink).toHaveAttribute("href", "/");

    const dashboardLink = screen.getByText("ダッシュボード").closest("a");
    expect(dashboardLink).toHaveAttribute("href", "/dashboard");
  });

  test("レスポンシブデザインが適用されている", () => {
    const footer = screen.getByRole("contentinfo");
    expect(footer).toHaveClass("bg-gray-800", "text-white");
  });

  test("アクセシビリティが適切に設定されている", () => {
    const footer = screen.getByRole("contentinfo");
    expect(footer).toBeInTheDocument();
  });
});
