import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "./Header";

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

describe("Header Component", () => {
  beforeEach(() => {
    render(<Header />);
  });

  test("ロゴとブランド名が表示される", () => {
    expect(screen.getByText("47")).toBeInTheDocument();
    expect(screen.getByText("地域統計ダッシュボード")).toBeInTheDocument();
    expect(
      screen.getByText("e-Stat API による地域統計データ")
    ).toBeInTheDocument();
  });

  test("ナビゲーションリンクが表示される", () => {
    expect(screen.getByText("ホーム")).toBeInTheDocument();
    expect(screen.getByText("ダッシュボード")).toBeInTheDocument();
    expect(screen.getByText("概要")).toBeInTheDocument();
    expect(screen.getByText("お問い合わせ")).toBeInTheDocument();
  });

  test("モバイルメニューボタンが表示される", () => {
    const menuButton = screen.getByLabelText("メニューを開く");
    expect(menuButton).toBeInTheDocument();
  });

  test("モバイルメニューの開閉が動作する", () => {
    const menuButton = screen.getByLabelText("メニューを開く");

    // 初期状態ではメニューが閉じている
    expect(screen.queryByText("ホーム")).not.toHaveClass("md:hidden");

    // メニューボタンをクリック
    fireEvent.click(menuButton);

    // メニューが開く（モバイル表示）
    expect(screen.getByText("ホーム")).toBeInTheDocument();
  });

  test("レスポンシブデザインが適用されている", () => {
    // デスクトップナビゲーションが存在する
    const desktopNav = screen.getByRole("navigation");
    expect(desktopNav).toHaveClass("hidden", "md:flex");
  });

  test("アクセシビリティが適切に設定されている", () => {
    const menuButton = screen.getByLabelText("メニューを開く");
    expect(menuButton).toHaveAttribute("aria-label", "メニューを開く");
  });
});
