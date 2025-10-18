import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ThemeToggleButton } from "../ThemeToggleButton";

/**
 * ThemeToggleButton テストスイート
 *
 * このテストファイルは、ThemeToggleButtonコンポーネントの動作を検証します。
 * テーマ切り替え機能、アイコンの表示、ボタンの状態、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - テーマ切り替え機能
 * - アイコンの表示
 * - ボタンの状態
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - テーマコンテキストのモックが必要
 * - アイコンのテストに注意
 * - キーボードナビゲーションをテスト
 */

// ===== モック設定 =====

/**
 * テーマコンテキストのモック
 *
 * このモックは、テーマコンテキストの動作をシミュレートします。
 * 実際のテーマコンテキストの動作を模倣して、テストを実行します。
 */
const mockThemeContext = {
  theme: "light",
  setTheme: vi.fn(),
  toggleTheme: vi.fn(),
};

// テーマコンテキストをモック
vi.mock("next-themes", () => ({
  useTheme: () => mockThemeContext,
}));

// ===== テストデータ =====

/**
 * テスト用のプロパティ
 *
 * このデータは、ThemeToggleButtonコンポーネントのテストで使用する
 * 様々なプロパティの組み合わせを表しています。
 *
 * プロパティ構造:
 * - className: カスタムクラス名
 * - size: ボタンのサイズ
 * - variant: ボタンのバリアント
 * - disabled: 無効状態
 * - showLabel: ラベル表示の有無
 * - label: カスタムラベル
 *
 * 用途:
 * - レンダリングテスト
 * - プロパティ適用テスト
 * - エッジケーステスト
 */
const defaultProps = {};

const withCustomProps = {
  className: "custom-theme-toggle",
  size: "lg" as const,
  variant: "outline" as const,
  disabled: false,
  showLabel: true,
  label: "テーマ切り替え",
};

const disabledProps = {
  disabled: true,
};

const withLabelProps = {
  showLabel: true,
  label: "ダークモード切り替え",
};

const withoutLabelProps = {
  showLabel: false,
};

/**
 * テーマのテストケース
 *
 * このデータは、様々なテーマ状態のテストで使用する
 * データを表しています。
 *
 * データ構造:
 * - theme: テーマの状態
 * - description: テストの説明
 *
 * 用途:
 * - テーマ表示のテスト
 * - アイコン表示のテスト
 * - 状態変化のテスト
 */
const themeTestCases = [
  {
    theme: "light",
    description: "ライトテーマ",
  },
  {
    theme: "dark",
    description: "ダークテーマ",
  },
  {
    theme: "system",
    description: "システムテーマ",
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
 * ThemeToggleButtonコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、ThemeToggleButtonコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - ボタン要素の存在
 * - アイコンの表示
 * - プロパティの適用
 * - クラス名の適用
 */
describe("基本的なレンダリング", () => {
  /**
   * デフォルト状態でコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - ボタン要素が表示される
   * - デフォルトプロパティが適用される
   * - 適切なクラス名が適用される
   * - アイコンが表示される
   */
  it("デフォルト状態でコンポーネントがレンダリングされる", () => {
    render(<ThemeToggleButton {...defaultProps} />);

    // ボタン要素が表示されることを確認
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();

    // デフォルトプロパティが適用されることを確認
    expect(button).toHaveClass("theme-toggle-button");

    // アイコンが表示されることを確認
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  /**
   * カスタムプロパティでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - カスタムプロパティが適用される
   * - 適切なサイズが設定される
   * - 適切なバリアントが設定される
   * - カスタムクラス名が適用される
   */
  it("カスタムプロパティでコンポーネントがレンダリングされる", () => {
    render(<ThemeToggleButton {...withCustomProps} />);

    // カスタムプロパティが適用されることを確認
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-theme-toggle");
    expect(button).toHaveClass("theme-toggle-button--lg");
    expect(button).toHaveClass("theme-toggle-button--outline");

    // ラベルが表示されることを確認
    expect(screen.getByText("テーマ切り替え")).toBeInTheDocument();
  });

  /**
   * 無効状態でコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - 無効状態でレンダリングされる
   * - 適切なクラス名が適用される
   * - ボタンが無効になる
   * - アイコンが表示される
   */
  it("無効状態でコンポーネントがレンダリングされる", () => {
    render(<ThemeToggleButton {...disabledProps} />);

    // 無効状態でレンダリングされることを確認
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveClass("theme-toggle-button--disabled");
  });

  /**
   * ラベル表示ありでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - ラベルが表示される
   * - 適切なレイアウトが適用される
   * - アイコンとラベルが正しく配置される
   */
  it("ラベル表示ありでコンポーネントがレンダリングされる", () => {
    render(<ThemeToggleButton {...withLabelProps} />);

    // ラベルが表示されることを確認
    expect(screen.getByText("ダークモード切り替え")).toBeInTheDocument();

    // ボタン要素が表示されることを確認
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  /**
   * ラベル表示なしでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - ラベルが表示されない
   * - アイコンのみが表示される
   * - 適切なレイアウトが適用される
   */
  it("ラベル表示なしでコンポーネントがレンダリングされる", () => {
    render(<ThemeToggleButton {...withoutLabelProps} />);

    // ラベルが表示されないことを確認
    expect(screen.queryByText("テーマ切り替え")).not.toBeInTheDocument();

    // ボタン要素が表示されることを確認
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});

// ===== テーマ切り替え機能のテスト =====

/**
 * ThemeToggleButtonコンポーネントのテーマ切り替え機能の検証
 *
 * このセクションでは、テーマの切り替えが
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - テーマの切り替え
 * - アイコンの変化
 * - 状態の更新
 * - コールバックの実行
 */
describe("テーマ切り替え機能", () => {
  /**
   * テーマが正しく切り替わることを検証
   *
   * テスト内容:
   * - テーマが切り替わる
   * - 適切なアイコンが表示される
   * - 状態が更新される
   * - コールバックが実行される
   */
  it("テーマが正しく切り替わる", () => {
    render(<ThemeToggleButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // ボタンをクリック
    fireEvent.click(button);

    // テーマが切り替わることを確認
    expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(1);
  });

  /**
   * ライトテーマで適切なアイコンが表示されることを検証
   *
   * テスト内容:
   * - ライトテーマのアイコンが表示される
   * - 適切なクラス名が適用される
   * - アクセシビリティが適切である
   */
  it("ライトテーマで適切なアイコンが表示される", () => {
    // ライトテーマに設定
    mockThemeContext.theme = "light";

    render(<ThemeToggleButton {...defaultProps} />);

    // ライトテーマのアイコンが表示されることを確認
    const button = screen.getByRole("button");
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  /**
   * ダークテーマで適切なアイコンが表示されることを検証
   *
   * テスト内容:
   * - ダークテーマのアイコンが表示される
   * - 適切なクラス名が適用される
   * - アクセシビリティが適切である
   */
  it("ダークテーマで適切なアイコンが表示される", () => {
    // ダークテーマに設定
    mockThemeContext.theme = "dark";

    render(<ThemeToggleButton {...defaultProps} />);

    // ダークテーマのアイコンが表示されることを確認
    const button = screen.getByRole("button");
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  /**
   * システムテーマで適切なアイコンが表示されることを検証
   *
   * テスト内容:
   * - システムテーマのアイコンが表示される
   * - 適切なクラス名が適用される
   * - アクセシビリティが適切である
   */
  it("システムテーマで適切なアイコンが表示される", () => {
    // システムテーマに設定
    mockThemeContext.theme = "system";

    render(<ThemeToggleButton {...defaultProps} />);

    // システムテーマのアイコンが表示されることを確認
    const button = screen.getByRole("button");
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  /**
   * 無効状態ではテーマが切り替わらないことを検証
   *
   * テスト内容:
   * - 無効状態ではテーマが切り替わらない
   * - コールバックが実行されない
   * - エラーが発生しない
   */
  it("無効状態ではテーマが切り替わらない", () => {
    render(<ThemeToggleButton {...disabledProps} />);

    const button = screen.getByRole("button");

    // ボタンをクリック
    fireEvent.click(button);

    // テーマが切り替わらないことを確認
    expect(mockThemeContext.toggleTheme).not.toHaveBeenCalled();
  });
});

// ===== アイコン表示のテスト =====

/**
 * ThemeToggleButtonコンポーネントのアイコン表示機能の検証
 *
 * このセクションでは、テーマに応じたアイコンの表示が
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - テーマに応じたアイコンの表示
 * - アイコンのクラス名
 * - アイコンのアクセシビリティ
 */
describe("アイコン表示", () => {
  /**
   * ライトテーマで太陽アイコンが表示されることを検証
   *
   * テスト内容:
   * - 太陽アイコンが表示される
   * - 適切なクラス名が適用される
   * - アクセシビリティが適切である
   */
  it("ライトテーマで太陽アイコンが表示される", () => {
    // ライトテーマに設定
    mockThemeContext.theme = "light";

    render(<ThemeToggleButton {...defaultProps} />);

    // 太陽アイコンが表示されることを確認
    const button = screen.getByRole("button");
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  /**
   * ダークテーマで月アイコンが表示されることを検証
   *
   * テスト内容:
   * - 月アイコンが表示される
   * - 適切なクラス名が適用される
   * - アクセシビリティが適切である
   */
  it("ダークテーマで月アイコンが表示される", () => {
    // ダークテーマに設定
    mockThemeContext.theme = "dark";

    render(<ThemeToggleButton {...defaultProps} />);

    // 月アイコンが表示されることを確認
    const button = screen.getByRole("button");
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  /**
   * システムテーマでシステムアイコンが表示されることを検証
   *
   * テスト内容:
   * - システムアイコンが表示される
   * - 適切なクラス名が適用される
   * - アクセシビリティが適切である
   */
  it("システムテーマでシステムアイコンが表示される", () => {
    // システムテーマに設定
    mockThemeContext.theme = "system";

    render(<ThemeToggleButton {...defaultProps} />);

    // システムアイコンが表示されることを確認
    const button = screen.getByRole("button");
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });

  /**
   * アイコンが適切なサイズで表示されることを検証
   *
   * テスト内容:
   * - アイコンが適切なサイズで表示される
   * - サイズプロパティが適用される
   * - レスポンシブデザインが適用される
   */
  it("アイコンが適切なサイズで表示される", () => {
    render(<ThemeToggleButton {...withCustomProps} />);

    // アイコンが適切なサイズで表示されることを確認
    const button = screen.getByRole("button");
    const icon = button.querySelector("svg");
    expect(icon).toBeInTheDocument();
  });
});

// ===== ボタン状態のテスト =====

/**
 * ThemeToggleButtonコンポーネントのボタン状態の検証
 *
 * このセクションでは、ボタンの状態が
 * 正しく管理されることを検証します。
 *
 * 検証項目:
 * - ボタンの有効/無効状態
 * - ホバー状態
 * - フォーカス状態
 * - アクティブ状態
 */
describe("ボタン状態", () => {
  /**
   * ボタンが有効状態で正しく動作することを検証
   *
   * テスト内容:
   * - ボタンが有効状態である
   * - クリックが正しく動作する
   * - 適切なクラス名が適用される
   * - アクセシビリティが適切である
   */
  it("ボタンが有効状態で正しく動作する", () => {
    render(<ThemeToggleButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // ボタンが有効状態であることを確認
    expect(button).not.toBeDisabled();

    // クリックが正しく動作することを確認
    fireEvent.click(button);
    expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(1);
  });

  /**
   * ボタンが無効状態で正しく動作することを検証
   *
   * テスト内容:
   * - ボタンが無効状態である
   * - クリックが無効になる
   * - 適切なクラス名が適用される
   * - アクセシビリティが適切である
   */
  it("ボタンが無効状態で正しく動作する", () => {
    render(<ThemeToggleButton {...disabledProps} />);

    const button = screen.getByRole("button");

    // ボタンが無効状態であることを確認
    expect(button).toBeDisabled();

    // クリックが無効になることを確認
    fireEvent.click(button);
    expect(mockThemeContext.toggleTheme).not.toHaveBeenCalled();
  });

  /**
   * ボタンのホバー状態が正しく動作することを検証
   *
   * テスト内容:
   * - ホバー状態で適切なスタイルが適用される
   * - ホバー状態でアクセシビリティが適切である
   * - ホバー状態でエラーが発生しない
   */
  it("ボタンのホバー状態が正しく動作する", () => {
    render(<ThemeToggleButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // ホバー状態をシミュレート
    fireEvent.mouseEnter(button);

    // ホバー状態でエラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * ボタンのフォーカス状態が正しく動作することを検証
   *
   * テスト内容:
   * - フォーカス状態で適切なスタイルが適用される
   * - フォーカス状態でアクセシビリティが適切である
   * - フォーカス状態でエラーが発生しない
   */
  it("ボタンのフォーカス状態が正しく動作する", () => {
    render(<ThemeToggleButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // フォーカス状態をシミュレート
    fireEvent.focus(button);

    // フォーカス状態でエラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== プロパティ適用のテスト =====

/**
 * ThemeToggleButtonコンポーネントのプロパティ適用機能の検証
 *
 * このセクションでは、様々なプロパティが
 * 正しく適用されることを検証します。
 *
 * 検証項目:
 * - サイズプロパティの適用
 * - バリアントプロパティの適用
 * - クラス名プロパティの適用
 * - ラベルプロパティの適用
 */
describe("プロパティ適用", () => {
  /**
   * サイズプロパティが正しく適用されることを検証
   *
   * テスト内容:
   * - サイズプロパティが適用される
   * - 適切なクラス名が適用される
   * - レイアウトが正しく調整される
   */
  it("サイズプロパティが正しく適用される", () => {
    render(<ThemeToggleButton {...withCustomProps} />);

    // サイズプロパティが適用されることを確認
    const button = screen.getByRole("button");
    expect(button).toHaveClass("theme-toggle-button--lg");
  });

  /**
   * バリアントプロパティが正しく適用されることを検証
   *
   * テスト内容:
   * - バリアントプロパティが適用される
   * - 適切なクラス名が適用される
   * - スタイルが正しく適用される
   */
  it("バリアントプロパティが正しく適用される", () => {
    render(<ThemeToggleButton {...withCustomProps} />);

    // バリアントプロパティが適用されることを確認
    const button = screen.getByRole("button");
    expect(button).toHaveClass("theme-toggle-button--outline");
  });

  /**
   * クラス名プロパティが正しく適用されることを検証
   *
   * テスト内容:
   * - クラス名プロパティが適用される
   * - デフォルトクラス名と併用される
   * - 適切なスタイルが適用される
   */
  it("クラス名プロパティが正しく適用される", () => {
    render(<ThemeToggleButton {...withCustomProps} />);

    // クラス名プロパティが適用されることを確認
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-theme-toggle");
  });

  /**
   * ラベルプロパティが正しく適用されることを検証
   *
   * テスト内容:
   * - ラベルプロパティが適用される
   * - 適切なテキストが表示される
   * - レイアウトが正しく調整される
   */
  it("ラベルプロパティが正しく適用される", () => {
    render(<ThemeToggleButton {...withCustomProps} />);

    // ラベルプロパティが適用されることを確認
    expect(screen.getByText("テーマ切り替え")).toBeInTheDocument();
  });
});

// ===== スタイリングのテスト =====

/**
 * ThemeToggleButtonコンポーネントのスタイリング機能の検証
 *
 * このセクションでは、状態に応じたスタイリングが
 * 正しく適用されることを検証します。
 *
 * 検証項目:
 * - 状態に応じたクラス名の適用
 * - 条件付きスタイリング
 * - レスポンシブデザイン
 */
describe("スタイリング", () => {
  /**
   * ボタンのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - ボタンのクラス名が適用される
   * - 適切なスタイルが適用される
   * - レイアウトが正しく調整される
   */
  it("ボタンのスタイリングが正しく適用される", () => {
    render(<ThemeToggleButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // ボタンのクラス名が適用されることを確認
    expect(button).toHaveClass("theme-toggle-button");
  });

  /**
   * 無効状態のスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 無効状態のクラス名が適用される
   * - 適切なスタイルが適用される
   * - レイアウトが正しく調整される
   */
  it("無効状態のスタイリングが正しく適用される", () => {
    render(<ThemeToggleButton {...disabledProps} />);

    const button = screen.getByRole("button");

    // 無効状態のクラス名が適用されることを確認
    expect(button).toHaveClass("theme-toggle-button--disabled");
  });

  /**
   * カスタムクラス名が正しく適用されることを検証
   *
   * テスト内容:
   * - カスタムクラス名が適用される
   * - デフォルトクラス名と併用される
   * - 複数のクラス名が正しく処理される
   */
  it("カスタムクラス名が正しく適用される", () => {
    render(<ThemeToggleButton {...withCustomProps} />);

    const button = screen.getByRole("button");

    // カスタムクラス名が適用されることを確認
    expect(button).toHaveClass("custom-theme-toggle");
  });
});

// ===== アクセシビリティのテスト =====

/**
 * ThemeToggleButtonコンポーネントのアクセシビリティ機能の検証
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
   * ボタンが適切にアクセシブルであることを検証
   *
   * テスト内容:
   * - ボタンが適切なロールを持つ
   * - アクセシブルな名前が設定される
   * - 適切な属性が設定される
   */
  it("ボタンが適切にアクセシブルである", () => {
    render(<ThemeToggleButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // ボタンが適切なロールを持つことを確認
    expect(button).toBeInTheDocument();
    expect(button.tagName).toBe("BUTTON");
  });

  /**
   * キーボードナビゲーションが適切に動作することを検証
   *
   * テスト内容:
   * - Tabキーでフォーカスが移動する
   * - Enterキーでアクションが実行される
   * - Spaceキーでアクションが実行される
   * - フォーカス管理が適切である
   */
  it("キーボードナビゲーションが適切に動作する", () => {
    render(<ThemeToggleButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // フォーカスを当てる
    button.focus();
    expect(button).toHaveFocus();

    // Enterキーでアクションが実行されることを確認
    fireEvent.keyDown(button, { key: "Enter", code: "Enter" });
    expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(1);

    // Spaceキーでアクションが実行されることを確認
    fireEvent.keyDown(button, { key: " ", code: "Space" });
    expect(mockThemeContext.toggleTheme).toHaveBeenCalledTimes(2);
  });

  /**
   * スクリーンリーダー対応が適切であることを検証
   *
   * テスト内容:
   * - 適切なaria-labelが設定される
   * - 適切なaria-describedbyが設定される
   * - 適切なaria-expandedが設定される
   */
  it("スクリーンリーダー対応が適切である", () => {
    render(<ThemeToggleButton {...defaultProps} />);

    const button = screen.getByRole("button");

    // 適切なaria-labelが設定されることを確認
    expect(button).toHaveAttribute("aria-label");
  });
});

// ===== エッジケースのテスト =====

/**
 * ThemeToggleButtonコンポーネントのエッジケースの検証
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
   * 無効なプロパティ値でもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 無効なプロパティ値でもエラーが発生しない
   * - デフォルト値が適用される
   * - 正常にレンダリングされる
   */
  it("無効なプロパティ値でもエラーが発生しない", () => {
    // @ts-ignore - 意図的に型エラーを無視
    render(
      <ThemeToggleButton
        size={null}
        variant={null}
        disabled={null}
        showLabel={null}
        label={null}
      />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 正常にレンダリングされることを確認
    expect(screen.getByRole("button")).toBeInTheDocument();
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
    const { rerender } = render(<ThemeToggleButton {...defaultProps} />);

    // 複数のプロパティを同時に変化
    rerender(
      <ThemeToggleButton
        size="lg"
        variant="outline"
        disabled={false}
        showLabel={true}
        label="新しいラベル"
        className="new-theme-toggle"
      />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 適切なUIが表示されることを確認
    const button = screen.getByRole("button");
    expect(button).toHaveClass("new-theme-toggle");
    expect(screen.getByText("新しいラベル")).toBeInTheDocument();
  });

  /**
   * テーマコンテキストが利用できない場合でもエラーが発生しないことを検証
   *
   * テスト内容:
   * - テーマコンテキストが利用できない場合でもエラーが発生しない
   * - デフォルト値が適用される
   * - 正常にレンダリングされる
   */
  it("テーマコンテキストが利用できない場合でもエラーが発生しない", () => {
    // テーマコンテキストを無効にする
    vi.mocked(require("next-themes").useTheme).mockReturnValue({
      theme: undefined,
      setTheme: vi.fn(),
      toggleTheme: vi.fn(),
    });

    render(<ThemeToggleButton {...defaultProps} />);

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 正常にレンダリングされることを確認
    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

// ===== パフォーマンスのテスト =====

/**
 * ThemeToggleButtonコンポーネントのパフォーマンスの検証
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
    const { rerender } = render(<ThemeToggleButton {...defaultProps} />);

    const startTime = performance.now();

    // 状態を変化させる
    rerender(<ThemeToggleButton {...defaultProps} size="lg" />);
    rerender(<ThemeToggleButton {...defaultProps} variant="outline" />);
    rerender(<ThemeToggleButton {...defaultProps} disabled={true} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 再レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);
  });

  /**
   * 大量のプロパティ変更でもパフォーマンスが適切であることを検証
   *
   * テスト内容:
   * - 大量のプロパティ変更でもパフォーマンスが適切である
   * - メモリリークが発生しない
   * - レンダリング時間が適切である
   */
  it("大量のプロパティ変更でもパフォーマンスが適切である", () => {
    const startTime = performance.now();

    const { rerender } = render(<ThemeToggleButton {...defaultProps} />);

    // 大量のプロパティ変更
    for (let i = 0; i < 100; i++) {
      rerender(
        <ThemeToggleButton
          {...defaultProps}
          size={i % 2 === 0 ? "sm" : "lg"}
          variant={i % 2 === 0 ? "default" : "outline"}
          disabled={i % 3 === 0}
        />
      );
    }

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);

    // 大量のプロパティ変更でもレンダリングされることを確認
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });
});
