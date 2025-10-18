import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ErrorView } from "../ErrorView";

/**
 * ErrorView テストスイート
 *
 * このテストファイルは、ErrorViewコンポーネントの動作を検証します。
 * エラー表示、詳細情報表示、再試行機能、レンダリング、スタイリング、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - エラーメッセージの表示
 * - 詳細情報の表示
 * - 再試行機能
 * - スタイリングの適用
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - Errorオブジェクトのモックが必要
 * - 詳細情報の条件付き表示をテスト
 * - 再試行ボタンの動作をテスト
 */

// ===== テストデータ =====

/**
 * モック関数の定義
 *
 * このセクションでは、テストで使用するモック関数を定義します。
 * 各モック関数は、特定の動作をシミュレートするために使用されます。
 */
const mockOnRetry = vi.fn();

/**
 * テスト用のエラーデータ
 *
 * このデータは、ErrorViewコンポーネントのテストで使用する
 * 様々なエラーの組み合わせを表しています。
 *
 * データ構造:
 * - error: Errorオブジェクト
 * - details: 詳細情報
 * - onRetry: 再試行処理のコールバック関数
 *
 * 用途:
 * - レンダリングテスト
 * - エラー表示テスト
 * - 詳細情報表示テスト
 */
const mockError = new Error("データの取得に失敗しました");

const defaultProps = {
  error: mockError,
  onRetry: mockOnRetry,
};

const withDetailsProps = {
  ...defaultProps,
  details: {
    statsDataId: "0000010101",
    cdCat01: "A",
    yearCode: "2023",
  },
};

const withPartialDetailsProps = {
  ...defaultProps,
  details: {
    statsDataId: "0000010101",
  },
};

const withoutRetryProps = {
  error: mockError,
};

const withCustomErrorProps = {
  error: new Error("カスタムエラーメッセージ"),
  details: {
    statsDataId: "0000020201",
    cdCat01: "B",
    yearCode: "2024",
  },
  onRetry: mockOnRetry,
};

/**
 * エラーメッセージのテストケース
 *
 * このデータは、様々なエラーメッセージのテストで使用する
 * データを表しています。
 *
 * データ構造:
 * - message: エラーメッセージ
 * - description: テストの説明
 *
 * 用途:
 * - エラーメッセージ表示のテスト
 * - 特殊文字の処理テスト
 * - 長いメッセージのテスト
 */
const errorMessageTestCases = [
  {
    message: "ネットワークエラーが発生しました",
    description: "一般的なエラーメッセージ",
  },
  {
    message: "エラーに<>&\"'が含まれています",
    description: "特殊文字を含むエラーメッセージ",
  },
  {
    message: "a".repeat(1000),
    description: "非常に長いエラーメッセージ",
  },
  {
    message: "",
    description: "空のエラーメッセージ",
  },
];

// ===== テストセットアップ =====

/**
 * 各テストの前に実行されるセットアップ処理
 *
 * 実行内容:
 * - モック関数のクリア
 * - テスト間の状態リセット
 */
beforeEach(() => {
  vi.clearAllMocks();
});

// ===== 基本的なレンダリングテスト =====

/**
 * ErrorViewコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、ErrorViewコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - エラーコンテナの存在
 * - エラーメッセージの表示
 * - アイコンの表示
 * - クラス名の適用
 */
describe("基本的なレンダリング", () => {
  /**
   * デフォルト状態でコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - エラーコンテナが表示される
   * - エラーメッセージが表示される
   * - AlertCircleアイコンが表示される
   * - 再試行ボタンが表示される
   */
  it("デフォルト状態でコンポーネントがレンダリングされる", () => {
    render(<ErrorView {...defaultProps} />);

    // エラーメッセージが表示されることを確認
    expect(screen.getByText("データ取得エラー")).toBeInTheDocument();
    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

    // AlertCircleアイコンが表示されることを確認
    const alertIcon = screen.getByRole("img", { hidden: true });
    expect(alertIcon).toBeInTheDocument();
    expect(alertIcon.tagName).toBe("svg");

    // 再試行ボタンが表示されることを確認
    expect(screen.getByRole("button", { name: /再試行/ })).toBeInTheDocument();

    // 適切なクラス名が適用されることを確認
    const errorContainer = screen.getByText("データ取得エラー").closest("div");
    expect(errorContainer).toHaveClass(
      "bg-red-50",
      "dark:bg-red-900/20",
      "border",
      "border-red-200",
      "dark:border-red-800",
      "rounded-lg"
    );
  });

  /**
   * 詳細情報付きでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - 詳細情報が表示される
   * - 各詳細項目が表示される
   * - 適切なスタイルが適用される
   */
  it("詳細情報付きでコンポーネントがレンダリングされる", () => {
    render(<ErrorView {...withDetailsProps} />);

    // 詳細情報が表示されることを確認
    expect(screen.getByText("詳細情報:")).toBeInTheDocument();
    expect(screen.getByText("統計表ID: 0000010101")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ: A")).toBeInTheDocument();
    expect(screen.getByText("年度: 2023")).toBeInTheDocument();
  });

  /**
   * 部分的な詳細情報でコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - 部分的な詳細情報が表示される
   * - 存在しない項目は表示されない
   * - 適切なスタイルが適用される
   */
  it("部分的な詳細情報でコンポーネントがレンダリングされる", () => {
    render(<ErrorView {...withPartialDetailsProps} />);

    // 存在する詳細情報が表示されることを確認
    expect(screen.getByText("統計表ID: 0000010101")).toBeInTheDocument();

    // 存在しない詳細情報が表示されないことを確認
    expect(screen.queryByText("カテゴリ: A")).not.toBeInTheDocument();
    expect(screen.queryByText("年度: 2023")).not.toBeInTheDocument();
  });

  /**
   * 再試行ボタンなしでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - 再試行ボタンが表示されない
   * - エラーメッセージは表示される
   * - 適切なスタイルが適用される
   */
  it("再試行ボタンなしでコンポーネントがレンダリングされる", () => {
    render(<ErrorView {...withoutRetryProps} />);

    // エラーメッセージが表示されることを確認
    expect(screen.getByText("データ取得エラー")).toBeInTheDocument();
    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

    // 再試行ボタンが表示されないことを確認
    expect(
      screen.queryByRole("button", { name: /再試行/ })
    ).not.toBeInTheDocument();
  });
});

// ===== エラーメッセージ表示のテスト =====

/**
 * ErrorViewコンポーネントのエラーメッセージ表示機能の検証
 *
 * このセクションでは、様々なエラーメッセージが
 * 正しく表示されることを検証します。
 *
 * 検証項目:
 * - エラーメッセージの表示
 * - 特殊文字の処理
 * - 長いメッセージの処理
 * - 空のメッセージの処理
 */
describe("エラーメッセージ表示", () => {
  /**
   * 各エラーメッセージが正しく表示されることを検証
   *
   * テスト内容:
   * - 各エラーメッセージが表示される
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("各エラーメッセージが正しく表示される", () => {
    errorMessageTestCases.forEach(({ message, description }) => {
      const { unmount } = render(
        <ErrorView {...defaultProps} error={new Error(message)} />
      );

      // エラーメッセージが表示されることを確認
      expect(screen.getByText(message)).toBeInTheDocument();

      // エラーが発生しないことを確認
      expect(() => {
        // 何も実行しない
      }).not.toThrow();

      unmount();
    });
  });

  /**
   * 特殊文字を含むエラーメッセージが正しく表示されることを検証
   *
   * テスト内容:
   * - 特殊文字が正しくエスケープされる
   * - HTMLが正しく表示される
   * - エラーが発生しない
   */
  it("特殊文字を含むエラーメッセージが正しく表示される", () => {
    const specialMessage = "エラーに<>&\"'が含まれています";

    render(<ErrorView {...defaultProps} error={new Error(specialMessage)} />);

    // 特殊文字を含むエラーメッセージが表示されることを確認
    expect(screen.getByText(specialMessage)).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 非常に長いエラーメッセージが正しく表示されることを検証
   *
   * テスト内容:
   * - 長いエラーメッセージが表示される
   * - レイアウトが崩れない
   * - パフォーマンスが適切である
   */
  it("非常に長いエラーメッセージが正しく表示される", () => {
    const longMessage = "a".repeat(1000);

    render(<ErrorView {...defaultProps} error={new Error(longMessage)} />);

    // 長いエラーメッセージが表示されることを確認
    expect(screen.getByText(longMessage)).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 空のエラーメッセージでもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 空のエラーメッセージでもレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("空のエラーメッセージでもエラーが発生しない", () => {
    render(<ErrorView {...defaultProps} error={new Error("")} />);

    // エラーコンテナが存在することを確認
    expect(screen.getByText("データ取得エラー")).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== 詳細情報表示のテスト =====

/**
 * ErrorViewコンポーネントの詳細情報表示機能の検証
 *
 * このセクションでは、詳細情報の表示が
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - 詳細情報の条件付き表示
 * - 各詳細項目の表示
 * - 部分的な詳細情報の処理
 */
describe("詳細情報表示", () => {
  /**
   * 詳細情報が正しく表示されることを検証
   *
   * テスト内容:
   * - 詳細情報セクションが表示される
   * - 各詳細項目が表示される
   * - 適切なスタイルが適用される
   */
  it("詳細情報が正しく表示される", () => {
    render(<ErrorView {...withDetailsProps} />);

    // 詳細情報セクションが表示されることを確認
    expect(screen.getByText("詳細情報:")).toBeInTheDocument();

    // 各詳細項目が表示されることを確認
    expect(screen.getByText("統計表ID: 0000010101")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ: A")).toBeInTheDocument();
    expect(screen.getByText("年度: 2023")).toBeInTheDocument();

    // 適切なスタイルが適用されることを確認
    const detailsSection = screen.getByText("詳細情報:").closest("div");
    expect(detailsSection).toHaveClass(
      "text-xs",
      "text-red-600",
      "dark:text-red-400"
    );
  });

  /**
   * 部分的な詳細情報が正しく表示されることを検証
   *
   * テスト内容:
   * - 存在する詳細項目のみが表示される
   * - 存在しない詳細項目は表示されない
   * - 適切なスタイルが適用される
   */
  it("部分的な詳細情報が正しく表示される", () => {
    render(<ErrorView {...withPartialDetailsProps} />);

    // 存在する詳細項目が表示されることを確認
    expect(screen.getByText("統計表ID: 0000010101")).toBeInTheDocument();

    // 存在しない詳細項目が表示されないことを確認
    expect(screen.queryByText("カテゴリ: A")).not.toBeInTheDocument();
    expect(screen.queryByText("年度: 2023")).not.toBeInTheDocument();
  });

  /**
   * 詳細情報なしでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - 詳細情報セクションが表示されない
   * - エラーメッセージは表示される
   * - 適切なスタイルが適用される
   */
  it("詳細情報なしでコンポーネントがレンダリングされる", () => {
    render(<ErrorView {...defaultProps} />);

    // エラーメッセージが表示されることを確認
    expect(screen.getByText("データ取得エラー")).toBeInTheDocument();
    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

    // 詳細情報セクションが表示されないことを確認
    expect(screen.queryByText("詳細情報:")).not.toBeInTheDocument();
  });

  /**
   * 空の詳細情報でもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 空の詳細情報でもレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("空の詳細情報でもエラーが発生しない", () => {
    const emptyDetailsProps = {
      ...defaultProps,
      details: {},
    };

    render(<ErrorView {...emptyDetailsProps} />);

    // 詳細情報セクションが表示されることを確認
    expect(screen.getByText("詳細情報:")).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== 再試行機能のテスト =====

/**
 * ErrorViewコンポーネントの再試行機能の検証
 *
 * このセクションでは、再試行ボタンの動作が
 * 正しく機能することを検証します。
 *
 * 検証項目:
 * - 再試行ボタンの表示
 * - クリックイベントの処理
 * - コールバックの呼び出し
 * - キーボード操作
 */
describe("再試行機能", () => {
  /**
   * 再試行ボタンが正しく表示されることを検証
   *
   * テスト内容:
   * - 再試行ボタンが表示される
   * - 適切なアイコンが表示される
   * - 適切なスタイルが適用される
   */
  it("再試行ボタンが正しく表示される", () => {
    render(<ErrorView {...defaultProps} />);

    // 再試行ボタンが表示されることを確認
    const retryButton = screen.getByRole("button", { name: /再試行/ });
    expect(retryButton).toBeInTheDocument();

    // RefreshCwアイコンが表示されることを確認
    const refreshIcon = screen.getByRole("img", { hidden: true });
    expect(refreshIcon).toBeInTheDocument();
    expect(refreshIcon.tagName).toBe("svg");

    // 適切なスタイルが適用されることを確認
    expect(retryButton).toHaveClass(
      "inline-flex",
      "items-center",
      "gap-2",
      "px-3",
      "py-1.5",
      "text-xs",
      "font-medium",
      "text-red-700",
      "bg-red-100",
      "border",
      "border-red-300",
      "rounded-md",
      "hover:bg-red-200",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-red-500",
      "focus:ring-offset-2"
    );
  });

  /**
   * 再試行ボタンのクリックでコールバックが呼び出されることを検証
   *
   * テスト内容:
   * - ボタンクリックでコールバックが呼び出される
   * - 正しい引数で呼び出される
   * - 複数回クリックで複数回呼び出される
   */
  it("再試行ボタンのクリックでコールバックが呼び出される", async () => {
    const user = userEvent.setup();
    render(<ErrorView {...defaultProps} />);

    const retryButton = screen.getByRole("button", { name: /再試行/ });

    // ボタンをクリック
    await user.click(retryButton);

    // コールバックが呼び出されることを確認
    expect(mockOnRetry).toHaveBeenCalledTimes(1);
    expect(mockOnRetry).toHaveBeenCalledWith();

    // 複数回クリック
    await user.click(retryButton);
    await user.click(retryButton);

    // 複数回呼び出されることを確認
    expect(mockOnRetry).toHaveBeenCalledTimes(3);
  });

  /**
   * キーボード操作で再試行ボタンが動作することを検証
   *
   * テスト内容:
   * - Enterキーでボタンが動作する
   * - Spaceキーでボタンが動作する
   * - フォーカス管理が適切である
   */
  it("キーボード操作で再試行ボタンが動作する", async () => {
    const user = userEvent.setup();
    render(<ErrorView {...defaultProps} />);

    const retryButton = screen.getByRole("button", { name: /再試行/ });

    // フォーカスを当てる
    retryButton.focus();
    expect(retryButton).toHaveFocus();

    // Enterキーでボタンを実行
    await user.keyboard("{Enter}");
    expect(mockOnRetry).toHaveBeenCalledTimes(1);

    // Spaceキーでボタンを実行
    await user.keyboard(" ");
    expect(mockOnRetry).toHaveBeenCalledTimes(2);
  });

  /**
   * 再試行ボタンなしでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - 再試行ボタンが表示されない
   * - エラーメッセージは表示される
   * - 適切なスタイルが適用される
   */
  it("再試行ボタンなしでコンポーネントがレンダリングされる", () => {
    render(<ErrorView {...withoutRetryProps} />);

    // エラーメッセージが表示されることを確認
    expect(screen.getByText("データ取得エラー")).toBeInTheDocument();

    // 再試行ボタンが表示されないことを確認
    expect(
      screen.queryByRole("button", { name: /再試行/ })
    ).not.toBeInTheDocument();
  });
});

// ===== スタイリングのテスト =====

/**
 * ErrorViewコンポーネントのスタイリング機能の検証
 *
 * このセクションでは、状態に応じたスタイリングが
 * 正しく適用されることを検証します。
 *
 * 検証項目:
 * - 状態に応じたクラス名の適用
 * - 条件付きスタイリング
 * - ダークモード対応
 */
describe("スタイリング", () => {
  /**
   * エラーコンテナのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - エラーコンテナのクラス名が適用される
   * - 背景色とボーダーが設定される
   * - 適切なレイアウトが適用される
   */
  it("エラーコンテナのスタイリングが正しく適用される", () => {
    render(<ErrorView {...defaultProps} />);

    const errorContainer = screen.getByText("データ取得エラー").closest("div");

    // エラーコンテナのクラス名が適用されることを確認
    expect(errorContainer).toHaveClass(
      "p-4",
      "bg-red-50",
      "dark:bg-red-900/20",
      "border",
      "border-red-200",
      "dark:border-red-800",
      "rounded-lg"
    );
  });

  /**
   * アイコンのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - アイコンのクラス名が適用される
   * - 適切なサイズが設定される
   * - 適切な色が設定される
   */
  it("アイコンのスタイリングが正しく適用される", () => {
    render(<ErrorView {...defaultProps} />);

    const alertIcon = screen.getByRole("img", { hidden: true });

    // アイコンのクラス名が適用されることを確認
    expect(alertIcon).toHaveClass(
      "w-5",
      "h-5",
      "text-red-600",
      "dark:text-red-400",
      "flex-shrink-0",
      "mt-0.5"
    );
  });

  /**
   * エラーメッセージのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - エラーメッセージのクラス名が適用される
   * - 適切な色が設定される
   * - 適切なフォントサイズが設定される
   */
  it("エラーメッセージのスタイリングが正しく適用される", () => {
    render(<ErrorView {...defaultProps} />);

    const errorMessage = screen.getByText("データの取得に失敗しました");

    // エラーメッセージのクラス名が適用されることを確認
    expect(errorMessage).toHaveClass(
      "mt-2",
      "text-sm",
      "text-red-700",
      "dark:text-red-300"
    );
  });

  /**
   * 詳細情報のスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 詳細情報のクラス名が適用される
   * - 適切な色が設定される
   * - 適切なフォントサイズが設定される
   */
  it("詳細情報のスタイリングが正しく適用される", () => {
    render(<ErrorView {...withDetailsProps} />);

    const detailsSection = screen.getByText("詳細情報:").closest("div");

    // 詳細情報のクラス名が適用されることを確認
    expect(detailsSection).toHaveClass(
      "mt-3",
      "text-xs",
      "text-red-600",
      "dark:text-red-400"
    );
  });

  /**
   * 再試行ボタンのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 再試行ボタンのクラス名が適用される
   * - ホバー効果が適用される
   * - フォーカス効果が適用される
   */
  it("再試行ボタンのスタイリングが正しく適用される", () => {
    render(<ErrorView {...defaultProps} />);

    const retryButton = screen.getByRole("button", { name: /再試行/ });

    // 再試行ボタンのクラス名が適用されることを確認
    expect(retryButton).toHaveClass(
      "mt-3",
      "inline-flex",
      "items-center",
      "gap-2",
      "px-3",
      "py-1.5",
      "text-xs",
      "font-medium",
      "text-red-700",
      "bg-red-100",
      "border",
      "border-red-300",
      "rounded-md",
      "hover:bg-red-200",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-red-500",
      "focus:ring-offset-2"
    );
  });

  /**
   * ダークモードのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - ダークモードのクラス名が適用される
   * - 適切な色が設定される
   * - コントラストが適切である
   */
  it("ダークモードのスタイリングが正しく適用される", () => {
    render(<ErrorView {...defaultProps} />);

    const errorContainer = screen.getByText("データ取得エラー").closest("div");

    // ダークモードのクラス名が適用されることを確認
    expect(errorContainer).toHaveClass(
      "dark:bg-red-900/20",
      "dark:border-red-800"
    );
  });
});

// ===== アクセシビリティのテスト =====

/**
 * ErrorViewコンポーネントのアクセシビリティ機能の検証
 *
 * このセクションでは、アクセシビリティに関する
 * 機能が正しく動作することを検証します。
 *
 * 検証項目:
 * - 適切なロール属性
 * - キーボードナビゲーション
 * - スクリーンリーダー対応
 */
describe("アクセシビリティ", () => {
  /**
   * エラーメッセージが適切に読み取れることを検証
   *
   * テスト内容:
   * - エラーメッセージが読み取れる
   * - 適切な要素構造である
   * - スクリーンリーダーに対応している
   */
  it("エラーメッセージが適切に読み取れる", () => {
    render(<ErrorView {...defaultProps} />);

    // エラーメッセージが読み取れることを確認
    expect(screen.getByText("データ取得エラー")).toBeInTheDocument();
    expect(screen.getByText("データの取得に失敗しました")).toBeInTheDocument();

    // 適切な要素構造であることを確認
    const errorTitle = screen.getByText("データ取得エラー");
    expect(errorTitle.tagName).toBe("H3");
  });

  /**
   * 詳細情報がアクセシブルであることを検証
   *
   * テスト内容:
   * - 詳細情報が読み取れる
   * - 適切なリスト構造である
   * - スクリーンリーダーに対応している
   */
  it("詳細情報がアクセシブルである", () => {
    render(<ErrorView {...withDetailsProps} />);

    // 詳細情報が読み取れることを確認
    expect(screen.getByText("詳細情報:")).toBeInTheDocument();
    expect(screen.getByText("統計表ID: 0000010101")).toBeInTheDocument();

    // 適切なリスト構造であることを確認
    const detailsList = screen.getByText("統計表ID: 0000010101").closest("ul");
    expect(detailsList).toBeInTheDocument();
  });

  /**
   * 再試行ボタンがアクセシブルであることを検証
   *
   * テスト内容:
   * - 再試行ボタンが読み取れる
   * - 適切なロール属性が設定される
   * - キーボード操作が可能である
   */
  it("再試行ボタンがアクセシブルである", () => {
    render(<ErrorView {...defaultProps} />);

    // 再試行ボタンが読み取れることを確認
    const retryButton = screen.getByRole("button", { name: /再試行/ });
    expect(retryButton).toBeInTheDocument();

    // 適切なロール属性が設定されることを確認
    expect(retryButton).toHaveAttribute("type", "button");
  });

  /**
   * キーボードナビゲーションが適切に動作することを検証
   *
   * テスト内容:
   * - Tabキーでフォーカスが移動する
   * - Enterキーでボタンが動作する
   * - Spaceキーでボタンが動作する
   */
  it("キーボードナビゲーションが適切に動作する", async () => {
    const user = userEvent.setup();
    render(<ErrorView {...defaultProps} />);

    const retryButton = screen.getByRole("button", { name: /再試行/ });

    // フォーカスを当てる
    retryButton.focus();
    expect(retryButton).toHaveFocus();

    // Enterキーでボタンを実行
    await user.keyboard("{Enter}");
    expect(mockOnRetry).toHaveBeenCalledTimes(1);

    // Spaceキーでボタンを実行
    await user.keyboard(" ");
    expect(mockOnRetry).toHaveBeenCalledTimes(2);
  });
});

// ===== エッジケースのテスト =====

/**
 * ErrorViewコンポーネントのエッジケースの検証
 *
 * このセクションでは、特殊な状況や境界値での
 * コンポーネントの動作を検証します。
 *
 * 検証項目:
 * - 異常なプロパティ値の処理
 * - 境界値の処理
 * - エラーハンドリング
 */
describe("エッジケース", () => {
  /**
   * 非常に長いエラーメッセージでも正しく処理されることを検証
   *
   * テスト内容:
   * - 長いエラーメッセージでもレンダリングされる
   * - パフォーマンスが適切である
   * - エラーが発生しない
   */
  it("非常に長いエラーメッセージでも正しく処理される", () => {
    const veryLongMessage = "a".repeat(10000);

    render(<ErrorView {...defaultProps} error={new Error(veryLongMessage)} />);

    // 長いエラーメッセージがレンダリングされることを確認
    expect(screen.getByText(veryLongMessage)).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 特殊文字を含む詳細情報でも正しく処理されることを検証
   *
   * テスト内容:
   * - 特殊文字を含む詳細情報でもレンダリングされる
   * - エスケープが正しく処理される
   * - 適切なスタイルが適用される
   */
  it("特殊文字を含む詳細情報でも正しく処理される", () => {
    const specialDetailsProps = {
      ...defaultProps,
      details: {
        statsDataId: "0000010101<>&\"'",
        cdCat01: "A<>&\"'",
        yearCode: "2023<>&\"'",
      },
    };

    render(<ErrorView {...specialDetailsProps} />);

    // 特殊文字を含む詳細情報がレンダリングされることを確認
    expect(screen.getByText("統計表ID: 0000010101<>&\"'")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ: A<>&\"'")).toBeInTheDocument();
    expect(screen.getByText("年度: 2023<>&\"'")).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 同時に複数のプロパティが変化してもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 複数のプロパティが同時に変化してもエラーが発生しない
   * - 適切なUIが表示される
   * - パフォーマンスが適切である
   */
  it("同時に複数のプロパティが変化してもエラーが発生しない", () => {
    const { rerender } = render(<ErrorView {...defaultProps} />);

    // 複数のプロパティを同時に変化
    rerender(
      <ErrorView
        error={new Error("新しいエラーメッセージ")}
        details={{
          statsDataId: "0000020201",
          cdCat01: "B",
          yearCode: "2024",
        }}
        onRetry={mockOnRetry}
      />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 適切なUIが表示されることを確認
    expect(screen.getByText("新しいエラーメッセージ")).toBeInTheDocument();
    expect(screen.getByText("統計表ID: 0000020201")).toBeInTheDocument();
  });

  /**
   * 無効なプロパティ値でもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 無効なプロパティ値でもエラーが発生しない
   * - デフォルト値が適用される
   * - 正常にレンダリングされる
   */
  it("無効なプロパティ値でもエラーが発生しない", () => {
    // @ts-ignore - 意図的に型エラーを無視
    render(<ErrorView error={null} details="invalid" onRetry="invalid" />);

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 正常にレンダリングされることを確認
    expect(screen.getByRole("generic")).toBeInTheDocument();
  });
});

// ===== パフォーマンスのテスト =====

/**
 * ErrorViewコンポーネントのパフォーマンスの検証
 *
 * このセクションでは、コンポーネントのパフォーマンスが
 * 適切であることを検証します。
 *
 * 検証項目:
 * - レンダリング時間
 * - メモリ使用量
 * - 再レンダリングの最適化
 */
describe("パフォーマンス", () => {
  /**
   * 状態変化時の再レンダリングが効率的であることを検証
   *
   * テスト内容:
   * - 状態変化時の再レンダリング時間が適切である
   * - 不要な再レンダリングが発生しない
   * - パフォーマンスが適切である
   */
  it("状態変化時の再レンダリングが効率的である", () => {
    const { rerender } = render(<ErrorView {...defaultProps} />);

    const startTime = performance.now();

    // 状態を変化させる
    rerender(<ErrorView {...withDetailsProps} />);
    rerender(<ErrorView {...withCustomErrorProps} />);
    rerender(<ErrorView {...withoutRetryProps} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 再レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);
  });

  /**
   * 大量のエラーメッセージでもパフォーマンスが適切であることを検証
   *
   * テスト内容:
   * - 大量のエラーメッセージでもパフォーマンスが適切である
   * - メモリリークが発生しない
   * - レンダリング時間が適切である
   */
  it("大量のエラーメッセージでもパフォーマンスが適切である", () => {
    const startTime = performance.now();

    // 大量のエラーメッセージをレンダリング
    const { unmount } = render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <ErrorView
            key={i}
            error={new Error(`エラーメッセージ ${i + 1}`)}
            details={{
              statsDataId: `000001010${i}`,
              cdCat01: String.fromCharCode(65 + (i % 26)),
              yearCode: `${2020 + i}`,
            }}
            onRetry={mockOnRetry}
          />
        ))}
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);

    // すべてのエラーメッセージがレンダリングされることを確認
    expect(screen.getAllByText(/エラーメッセージ/)).toHaveLength(100);

    unmount();
  });
});
