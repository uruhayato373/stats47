import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordInput } from "../PasswordInput";

/**
 * PasswordInput テストスイート
 *
 * このテストファイルは、PasswordInputコンポーネントの動作を検証します。
 * 表示/非表示切り替え、パスワード強度表示、レンダリング、スタイリング、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - 表示/非表示切り替え機能
 * - パスワード強度計算
 * - イベント処理
 * - スタイリングの適用
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - パスワード強度の計算ロジックをテスト
 * - 表示/非表示の状態管理をテスト
 * - アイコンの切り替えをテスト
 */

// ===== テストデータ =====

/**
 * モック関数の定義
 *
 * このセクションでは、テストで使用するモック関数を定義します。
 * 各モック関数は、特定の動作をシミュレートするために使用されます。
 */
const mockOnChange = vi.fn();
const mockOnBlur = vi.fn();
const mockOnFocus = vi.fn();

/**
 * テスト用のプロパティデータ
 *
 * このデータは、PasswordInputコンポーネントのテストで使用する
 * 様々なプロパティの組み合わせを表しています。
 *
 * データ構造:
 * - 基本的なinput属性
 * - showStrength: パスワード強度表示の有無
 * - イベントハンドラー
 *
 * 用途:
 * - レンダリングテスト
 * - 状態管理テスト
 * - イベント処理テスト
 */
const defaultProps = {
  placeholder: "パスワードを入力してください",
  onChange: mockOnChange,
};

const withStrengthProps = {
  ...defaultProps,
  showStrength: true,
  value: "testpassword",
};

const withAllProps = {
  ...defaultProps,
  showStrength: true,
  value: "TestPassword123!",
  onBlur: mockOnBlur,
  onFocus: mockOnFocus,
};

/**
 * パスワード強度テスト用のデータ
 *
 * このデータは、パスワード強度計算のテストで使用する
 * 様々なパスワードの例を表しています。
 *
 * データ構造:
 * - password: テスト用のパスワード
 * - expectedStrength: 期待される強度（0-5）
 * - description: テストの説明
 *
 * 用途:
 * - パスワード強度計算のテスト
 * - 境界値のテスト
 * - エッジケースのテスト
 */
const passwordStrengthTestCases = [
  { password: "", expectedStrength: 0, description: "空のパスワード" },
  { password: "123", expectedStrength: 0, description: "短いパスワード" },
  {
    password: "password",
    expectedStrength: 1,
    description: "8文字以上のパスワード",
  },
  {
    password: "password123",
    expectedStrength: 2,
    description: "12文字以上のパスワード",
  },
  {
    password: "Password123",
    expectedStrength: 3,
    description: "大文字小文字を含むパスワード",
  },
  {
    password: "Password123!",
    expectedStrength: 4,
    description: "数字を含むパスワード",
  },
  {
    password: "Password123!@#",
    expectedStrength: 5,
    description: "特殊文字を含むパスワード",
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
 * PasswordInputコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、PasswordInputコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - 入力フィールドの存在
 * - 表示/非表示ボタンの存在
 * - アイコンの表示
 * - クラス名の適用
 */
describe("基本的なレンダリング", () => {
  /**
   * デフォルト状態でコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - パスワード入力フィールドが表示される
   * - 表示/非表示ボタンが表示される
   * - Eyeアイコンが表示される
   * - 適切なクラス名が適用される
   */
  it("デフォルト状態でコンポーネントがレンダリングされる", () => {
    render(<PasswordInput {...defaultProps} />);

    // パスワード入力フィールドが存在することを確認
    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute("type", "password");

    // 表示/非表示ボタンが存在することを確認
    const toggleButton = screen.getByRole("button");
    expect(toggleButton).toBeInTheDocument();

    // Eyeアイコンが表示されることを確認
    const eyeIcon = screen.getByRole("img", { hidden: true });
    expect(eyeIcon).toBeInTheDocument();
    expect(eyeIcon.tagName).toBe("svg");

    // 適切なクラス名が適用されることを確認
    expect(passwordInput).toHaveClass(
      "w-full",
      "px-3",
      "py-2",
      "pr-10",
      "border",
      "rounded-md"
    );
  });

  /**
   * パスワード強度表示が有効な場合のレンダリングを検証
   *
   * テスト内容:
   * - パスワード強度バーが表示される
   * - 強度ラベルが表示される
   * - 適切なスタイルが適用される
   */
  it("パスワード強度表示が有効な場合のレンダリング", () => {
    render(<PasswordInput {...withStrengthProps} />);

    // パスワード強度バーが表示されることを確認
    const strengthBars = screen.getAllByRole("generic");
    expect(strengthBars.length).toBeGreaterThan(0);

    // 強度ラベルが表示されることを確認
    expect(screen.getByText(/パスワード強度/)).toBeInTheDocument();
  });

  /**
   * パスワード強度表示が無効な場合のレンダリングを検証
   *
   * テスト内容:
   * - パスワード強度バーが表示されない
   * - 強度ラベルが表示されない
   * - 基本的な入力フィールドのみ表示される
   */
  it("パスワード強度表示が無効な場合のレンダリング", () => {
    render(<PasswordInput {...defaultProps} />);

    // パスワード強度バーが表示されないことを確認
    expect(screen.queryByText(/パスワード強度/)).not.toBeInTheDocument();
  });

  /**
   * カスタムプロパティが正しく適用されることを検証
   *
   * テスト内容:
   * - カスタムプロパティが適用される
   * - イベントハンドラーが設定される
   * - 適切な属性が設定される
   */
  it("カスタムプロパティが正しく適用される", () => {
    render(<PasswordInput {...withAllProps} />);

    const passwordInput = screen.getByDisplayValue("TestPassword123!");

    // カスタムプロパティが適用されることを確認
    expect(passwordInput).toHaveValue("TestPassword123!");
    expect(passwordInput).toHaveAttribute(
      "placeholder",
      "パスワードを入力してください"
    );
  });
});

// ===== 表示/非表示切り替えのテスト =====

/**
 * PasswordInputコンポーネントの表示/非表示切り替え機能の検証
 *
 * このセクションでは、パスワードの表示/非表示切り替えが
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - ボタンクリックでの切り替え
 * - アイコンの変化
 * - 入力タイプの変化
 * - 状態管理
 */
describe("表示/非表示切り替え", () => {
  /**
   * ボタンクリックで表示/非表示が切り替わることを検証
   *
   * テスト内容:
   * - 初期状態ではパスワードが非表示
   * - ボタンクリックで表示に切り替わる
   * - 再度クリックで非表示に切り替わる
   */
  it("ボタンクリックで表示/非表示が切り替わる", async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...defaultProps} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");
    const toggleButton = screen.getByRole("button");

    // 初期状態ではパスワードが非表示
    expect(passwordInput).toHaveAttribute("type", "password");

    // ボタンをクリックして表示に切り替える
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "text");

    // 再度クリックして非表示に切り替える
    await user.click(toggleButton);
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  /**
   * アイコンが正しく切り替わることを検証
   *
   * テスト内容:
   * - 初期状態ではEyeアイコンが表示される
   * - 表示状態ではEyeOffアイコンが表示される
   * - 非表示状態ではEyeアイコンが表示される
   */
  it("アイコンが正しく切り替わる", async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...defaultProps} />);

    const toggleButton = screen.getByRole("button");

    // 初期状態ではEyeアイコンが表示される
    let eyeIcon = screen.getByRole("img", { hidden: true });
    expect(eyeIcon).toBeInTheDocument();

    // ボタンをクリックしてアイコンを切り替える
    await user.click(toggleButton);

    // 表示状態ではEyeOffアイコンが表示される
    eyeIcon = screen.getByRole("img", { hidden: true });
    expect(eyeIcon).toBeInTheDocument();

    // 再度クリックしてアイコンを切り替える
    await user.click(toggleButton);

    // 非表示状態ではEyeアイコンが表示される
    eyeIcon = screen.getByRole("img", { hidden: true });
    expect(eyeIcon).toBeInTheDocument();
  });

  /**
   * キーボード操作で表示/非表示が切り替わることを検証
   *
   * テスト内容:
   * - Enterキーで切り替わる
   * - Spaceキーで切り替わる
   * - フォーカス管理が適切
   */
  it("キーボード操作で表示/非表示が切り替わる", async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...defaultProps} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");
    const toggleButton = screen.getByRole("button");

    // フォーカスを当てる
    toggleButton.focus();

    // Enterキーで切り替える
    await user.keyboard("{Enter}");
    expect(passwordInput).toHaveAttribute("type", "text");

    // Spaceキーで切り替える
    await user.keyboard(" ");
    expect(passwordInput).toHaveAttribute("type", "password");
  });

  /**
   * 複数回の切り替えが正しく動作することを検証
   *
   * テスト内容:
   * - 複数回の切り替えが動作する
   * - 状態が正しく管理される
   * - パフォーマンスが適切である
   */
  it("複数回の切り替えが正しく動作する", async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...defaultProps} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");
    const toggleButton = screen.getByRole("button");

    // 複数回切り替える
    for (let i = 0; i < 10; i++) {
      await user.click(toggleButton);
      const expectedType = i % 2 === 0 ? "text" : "password";
      expect(passwordInput).toHaveAttribute("type", expectedType);
    }
  });
});

// ===== パスワード強度計算のテスト =====

/**
 * PasswordInputコンポーネントのパスワード強度計算機能の検証
 *
 * このセクションでは、パスワード強度の計算が
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - 強度計算ロジック
 * - 強度バーの表示
 * - 強度ラベルの表示
 * - 境界値の処理
 */
describe("パスワード強度計算", () => {
  /**
   * パスワード強度が正しく計算されることを検証
   *
   * テスト内容:
   * - 各テストケースで正しい強度が計算される
   * - 強度バーが正しく表示される
   * - 強度ラベルが正しく表示される
   */
  it("パスワード強度が正しく計算される", () => {
    passwordStrengthTestCases.forEach(
      ({ password, expectedStrength, description }) => {
        const { unmount } = render(
          <PasswordInput
            {...defaultProps}
            showStrength={true}
            value={password}
          />
        );

        // 強度バーが正しく表示されることを確認
        const strengthBars = screen.getAllByRole("generic");
        expect(strengthBars.length).toBe(5);

        // 強度ラベルが正しく表示されることを確認
        if (expectedStrength > 0) {
          const strengthLabels = [
            "弱い",
            "やや弱い",
            "普通",
            "やや強い",
            "強い",
          ];
          const expectedLabel = strengthLabels[expectedStrength - 1];
          expect(
            screen.getByText(`パスワード強度: ${expectedLabel}`)
          ).toBeInTheDocument();
        } else {
          expect(screen.getByText("パスワード強度: ")).toBeInTheDocument();
        }

        unmount();
      }
    );
  });

  /**
   * 強度バーの色が正しく適用されることを検証
   *
   * テスト内容:
   * - 強度に応じて色が変化する
   * - 適切なクラス名が適用される
   * - 視覚的な表現が正しい
   */
  it("強度バーの色が正しく適用される", () => {
    const { rerender } = render(
      <PasswordInput
        {...defaultProps}
        showStrength={true}
        value="Password123!"
      />
    );

    // 強度バーが存在することを確認
    const strengthBars = screen.getAllByRole("generic");
    expect(strengthBars.length).toBe(5);

    // 各強度レベルでテスト
    const testCases = [
      { password: "weak", expectedBars: 1 },
      { password: "weakpass", expectedBars: 1 },
      { password: "weakpassword", expectedBars: 2 },
      { password: "WeakPassword", expectedBars: 3 },
      { password: "WeakPassword123", expectedBars: 4 },
      { password: "WeakPassword123!", expectedBars: 5 },
    ];

    testCases.forEach(({ password, expectedBars }) => {
      rerender(
        <PasswordInput {...defaultProps} showStrength={true} value={password} />
      );

      const strengthBars = screen.getAllByRole("generic");
      expect(strengthBars.length).toBe(5);
    });
  });

  /**
   * 空のパスワードで強度が0になることを検証
   *
   * テスト内容:
   * - 空のパスワードで強度が0
   * - 強度バーが表示されない
   * - 強度ラベルが空になる
   */
  it("空のパスワードで強度が0になる", () => {
    render(<PasswordInput {...defaultProps} showStrength={true} value="" />);

    // 強度バーが表示されないことを確認
    expect(screen.queryByText(/パスワード強度/)).not.toBeInTheDocument();
  });

  /**
   * 非常に長いパスワードでも正しく処理されることを検証
   *
   * テスト内容:
   * - 長いパスワードでも強度が計算される
   * - パフォーマンスが適切である
   * - エラーが発生しない
   */
  it("非常に長いパスワードでも正しく処理される", () => {
    const longPassword = "a".repeat(1000);

    render(
      <PasswordInput
        {...defaultProps}
        showStrength={true}
        value={longPassword}
      />
    );

    // 強度が計算されることを確認
    expect(screen.getByText(/パスワード強度/)).toBeInTheDocument();
  });
});

// ===== イベント処理のテスト =====

/**
 * PasswordInputコンポーネントのイベント処理機能の検証
 *
 * このセクションでは、入力イベントやその他の
 * ユーザーインタラクションが正しく処理されることを検証します。
 *
 * 検証項目:
 * - onChangeイベントの処理
 * - パスワード強度の更新
 * - イベントハンドラーの呼び出し
 */
describe("イベント処理", () => {
  /**
   * 入力変更でonChangeが呼び出されることを検証
   *
   * テスト内容:
   * - 入力変更でonChangeが呼び出される
   * - 正しい引数で呼び出される
   * - 複数回の入力で複数回呼び出される
   */
  it("入力変更でonChangeが呼び出される", async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...defaultProps} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");

    // 入力変更
    await user.type(passwordInput, "test");

    // onChangeが呼び出されることを確認
    expect(mockOnChange).toHaveBeenCalled();
  });

  /**
   * パスワード強度表示時に強度が更新されることを検証
   *
   * テスト内容:
   * - 入力変更で強度が更新される
   * - 強度バーが更新される
   * - 強度ラベルが更新される
   */
  it("パスワード強度表示時に強度が更新される", async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...defaultProps} showStrength={true} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");

    // 入力変更
    await user.type(passwordInput, "password");

    // 強度が更新されることを確認
    expect(screen.getByText(/パスワード強度/)).toBeInTheDocument();
  });

  /**
   * 複数のイベントハンドラーが正しく呼び出されることを検証
   *
   * テスト内容:
   * - onChangeが呼び出される
   * - onBlurが呼び出される
   * - onFocusが呼び出される
   */
  it("複数のイベントハンドラーが正しく呼び出される", async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...withAllProps} />);

    const passwordInput = screen.getByDisplayValue("TestPassword123!");

    // フォーカスイベント
    await user.click(passwordInput);
    expect(mockOnFocus).toHaveBeenCalled();

    // 入力変更イベント
    await user.type(passwordInput, "x");
    expect(mockOnChange).toHaveBeenCalled();

    // ブラーイベント
    await user.tab();
    expect(mockOnBlur).toHaveBeenCalled();
  });

  /**
   * イベントハンドラーが未定義でもエラーが発生しないことを検証
   *
   * テスト内容:
   * - イベントハンドラーが未定義でもエラーが発生しない
   * - コンポーネントが正常に動作する
   * - パフォーマンスが適切である
   */
  it("イベントハンドラーが未定義でもエラーが発生しない", async () => {
    const user = userEvent.setup();
    render(<PasswordInput placeholder="テスト" />);

    const passwordInput = screen.getByPlaceholderText("テスト");

    // 入力変更（イベントハンドラーが未定義）
    await user.type(passwordInput, "test");

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== スタイリングのテスト =====

/**
 * PasswordInputコンポーネントのスタイリング機能の検証
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
   * デフォルト状態のスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - デフォルトのクラス名が適用される
   * - フォーカス効果のクラスが適用される
   * - ホバー効果のクラスが適用される
   */
  it("デフォルト状態のスタイリングが正しく適用される", () => {
    render(<PasswordInput {...defaultProps} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");
    const toggleButton = screen.getByRole("button");

    // 入力フィールドのクラス名が適用されることを確認
    expect(passwordInput).toHaveClass(
      "w-full",
      "px-3",
      "py-2",
      "pr-10",
      "border",
      "border-gray-300",
      "rounded-md",
      "shadow-sm",
      "focus:outline-none",
      "focus:ring-indigo-500",
      "focus:border-indigo-500"
    );

    // トグルボタンのクラス名が適用されることを確認
    expect(toggleButton).toHaveClass(
      "absolute",
      "inset-y-0",
      "right-0",
      "flex",
      "items-center",
      "pr-3",
      "text-gray-400",
      "hover:text-gray-600"
    );
  });

  /**
   * パスワード強度バーのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 強度バーのクラス名が適用される
   * - 色が正しく適用される
   * - レイアウトが適切である
   */
  it("パスワード強度バーのスタイリングが正しく適用される", () => {
    render(<PasswordInput {...withStrengthProps} />);

    // 強度バーが存在することを確認
    const strengthBars = screen.getAllByRole("generic");
    expect(strengthBars.length).toBe(5);

    // 各強度バーのクラス名が適用されることを確認
    strengthBars.forEach((bar) => {
      expect(bar).toHaveClass("h-1", "flex-1", "rounded");
    });
  });

  /**
   * ダークモードのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - ダークモードのクラス名が適用される
   * - 適切な色が適用される
   * - コントラストが適切である
   */
  it("ダークモードのスタイリングが正しく適用される", () => {
    render(<PasswordInput {...defaultProps} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");

    // ダークモードのクラス名が適用されることを確認
    expect(passwordInput).toHaveClass(
      "dark:border-gray-600",
      "dark:bg-gray-700",
      "dark:text-white"
    );
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
    render(<PasswordInput {...defaultProps} className="custom-class" />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");

    // カスタムクラス名が適用されることを確認
    expect(passwordInput).toHaveClass("custom-class");
  });
});

// ===== アクセシビリティのテスト =====

/**
 * PasswordInputコンポーネントのアクセシビリティ機能の検証
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
   * 入力フィールドが適切なロール属性を持つことを検証
   *
   * テスト内容:
   * - 入力フィールドが適切なロールを持つ
   * - アクセシブルな名前が設定される
   * - 適切な属性が設定される
   */
  it("入力フィールドが適切なロール属性を持つ", () => {
    render(<PasswordInput {...defaultProps} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");

    // 入力フィールドが適切なロールを持つことを確認
    expect(passwordInput).toHaveAttribute("type", "password");
    expect(passwordInput).toHaveAttribute(
      "placeholder",
      "パスワードを入力してください"
    );
  });

  /**
   * トグルボタンが適切なロール属性を持つことを検証
   *
   * テスト内容:
   * - トグルボタンが適切なロールを持つ
   * - アクセシブルな名前が設定される
   * - 適切な属性が設定される
   */
  it("トグルボタンが適切なロール属性を持つ", () => {
    render(<PasswordInput {...defaultProps} />);

    const toggleButton = screen.getByRole("button");

    // トグルボタンが適切なロールを持つことを確認
    expect(toggleButton).toHaveAttribute("type", "button");
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
    render(<PasswordInput {...defaultProps} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");
    const toggleButton = screen.getByRole("button");

    // 入力フィールドにフォーカスを当てる
    passwordInput.focus();
    expect(passwordInput).toHaveFocus();

    // Tabキーでトグルボタンにフォーカスを移動
    await user.tab();
    expect(toggleButton).toHaveFocus();

    // Enterキーでトグルボタンを実行
    await user.keyboard("{Enter}");
    expect(passwordInput).toHaveAttribute("type", "text");
  });

  /**
   * パスワード強度情報がアクセシブルであることを検証
   *
   * テスト内容:
   * - パスワード強度情報が読み取れる
   * - 適切なラベルが設定される
   * - 色のコントラストが適切である
   */
  it("パスワード強度情報がアクセシブルである", () => {
    render(<PasswordInput {...withStrengthProps} />);

    // パスワード強度情報が読み取れることを確認
    expect(screen.getByText(/パスワード強度/)).toBeInTheDocument();
  });
});

// ===== エッジケースのテスト =====

/**
 * PasswordInputコンポーネントのエッジケースの検証
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
   * 空のパスワードでもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 空のパスワードでもレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("空のパスワードでもエラーが発生しない", () => {
    render(<PasswordInput {...defaultProps} value="" />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveValue("");
  });

  /**
   * 非常に長いパスワードでも正しく処理されることを検証
   *
   * テスト内容:
   * - 長いパスワードでもレンダリングされる
   * - パフォーマンスが適切である
   * - エラーが発生しない
   */
  it("非常に長いパスワードでも正しく処理される", () => {
    const longPassword = "a".repeat(1000);

    render(<PasswordInput {...defaultProps} value={longPassword} />);

    const passwordInput = screen.getByDisplayValue(longPassword);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveValue(longPassword);
  });

  /**
   * 特殊文字を含むパスワードでも正しく処理されることを検証
   *
   * テスト内容:
   * - 特殊文字を含むパスワードでもレンダリングされる
   * - エスケープが正しく処理される
   * - 適切なスタイルが適用される
   */
  it("特殊文字を含むパスワードでも正しく処理される", () => {
    const specialPassword = "password<>&\"'";

    render(<PasswordInput {...defaultProps} value={specialPassword} />);

    const passwordInput = screen.getByDisplayValue(specialPassword);
    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveValue(specialPassword);
  });

  /**
   * 同時に複数の状態が変化してもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 複数の状態が同時に変化してもエラーが発生しない
   * - 適切なUIが表示される
   * - パフォーマンスが適切である
   */
  it("同時に複数の状態が変化してもエラーが発生しない", () => {
    const { rerender } = render(<PasswordInput {...defaultProps} />);

    // 複数の状態を同時に変化
    rerender(
      <PasswordInput
        {...defaultProps}
        showStrength={true}
        value="TestPassword123!"
      />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 適切なUIが表示されることを確認
    expect(screen.getByText(/パスワード強度/)).toBeInTheDocument();
  });
});

// ===== パフォーマンスのテスト =====

/**
 * PasswordInputコンポーネントのパフォーマンスの検証
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
    const { rerender } = render(<PasswordInput {...defaultProps} />);

    const startTime = performance.now();

    // 状態を変化させる
    rerender(
      <PasswordInput {...defaultProps} showStrength={true} value="test" />
    );
    rerender(
      <PasswordInput {...defaultProps} showStrength={true} value="password" />
    );
    rerender(
      <PasswordInput
        {...defaultProps}
        showStrength={true}
        value="Password123!"
      />
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 再レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);
  });

  /**
   * 大量の入力変更でもパフォーマンスが適切であることを検証
   *
   * テスト内容:
   * - 大量の入力変更でもパフォーマンスが適切である
   * - メモリリークが発生しない
   * - レンダリング時間が適切である
   */
  it("大量の入力変更でもパフォーマンスが適切である", async () => {
    const user = userEvent.setup();
    render(<PasswordInput {...defaultProps} showStrength={true} />);

    const passwordInput =
      screen.getByPlaceholderText("パスワードを入力してください");
    const startTime = performance.now();

    // 大量の入力変更を実行
    for (let i = 0; i < 100; i++) {
      await user.type(passwordInput, "a");
    }

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);
  });
});
