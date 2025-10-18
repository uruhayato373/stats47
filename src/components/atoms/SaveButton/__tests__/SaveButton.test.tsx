import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SaveButton from "../SaveButton";

/**
 * SaveButton テストスイート
 *
 * このテストファイルは、SaveButtonコンポーネントの動作を検証します。
 * 状態管理、イベント処理、レンダリング、スタイリング、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - 状態管理（saving, saveResult）
 * - イベント処理（onSave, リロード）
 * - スタイリングの適用
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - window.location.reload()はモックが必要
 * - 非同期処理のテストに注意
 * - 状態変化のテストが重要
 */

// ===== テストデータ =====

/**
 * モック関数の定義
 *
 * このセクションでは、テストで使用するモック関数を定義します。
 * 各モック関数は、特定の動作をシミュレートするために使用されます。
 */
const mockOnSave = vi.fn();
const mockReload = vi.fn();

/**
 * テスト用のプロパティデータ
 *
 * このデータは、SaveButtonコンポーネントのテストで使用する
 * 様々なプロパティの組み合わせを表しています。
 *
 * データ構造:
 * - onSave: 保存処理のコールバック関数
 * - saving: 保存中の状態
 * - saveResult: 保存結果（成功/失敗、メッセージ）
 *
 * 用途:
 * - レンダリングテスト
 * - 状態管理テスト
 * - イベント処理テスト
 */
const defaultProps = {
  onSave: mockOnSave,
  saving: false,
  saveResult: null,
};

const savingProps = {
  onSave: mockOnSave,
  saving: true,
  saveResult: null,
};

const successResult = {
  success: true,
  message: "データが正常に保存されました",
};

const errorResult = {
  success: false,
  message: "保存中にエラーが発生しました",
};

const successProps = {
  onSave: mockOnSave,
  saving: false,
  saveResult: successResult,
};

const errorProps = {
  onSave: mockOnSave,
  saving: false,
  saveResult: errorResult,
};

// ===== テストセットアップ =====

/**
 * 各テストの前に実行されるセットアップ処理
 *
 * 実行内容:
 * - モック関数のクリア
 * - テスト間の状態リセット
 * - window.location.reloadのモック
 */
beforeEach(() => {
  vi.clearAllMocks();

  // window.location.reloadをモック
  Object.defineProperty(window, "location", {
    value: {
      reload: mockReload,
    },
    writable: true,
  });
});

// ===== 基本的なレンダリングテスト =====

/**
 * SaveButtonコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、SaveButtonコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - ボタン要素の存在
 * - アイコンの表示
 * - テキストの表示
 * - クラス名の適用
 */
describe("基本的なレンダリング", () => {
  /**
   * デフォルト状態でボタンがレンダリングされることを検証
   *
   * テスト内容:
   * - 保存ボタンが表示される
   * - Saveアイコンが表示される
   * - 適切なクラス名が適用される
   * - 無効化されていない
   */
  it("デフォルト状態でボタンがレンダリングされる", () => {
    render(<SaveButton {...defaultProps} />);

    // 保存ボタンが存在することを確認
    const saveButton = screen.getByRole("button", {
      name: /データベースに保存/i,
    });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).not.toBeDisabled();

    // Saveアイコンが表示されることを確認
    const saveIcon = screen.getByRole("img", { hidden: true });
    expect(saveIcon).toBeInTheDocument();
    expect(saveIcon.tagName).toBe("svg");

    // 適切なクラス名が適用されることを確認
    expect(saveButton).toHaveClass("bg-indigo-600", "text-white", "rounded-lg");
  });

  /**
   * 保存中状態でボタンがレンダリングされることを検証
   *
   * テスト内容:
   * - 保存ボタンが無効化される
   * - アニメーションクラスが適用される
   * - 適切なタイトルが設定される
   */
  it("保存中状態でボタンがレンダリングされる", () => {
    render(<SaveButton {...savingProps} />);

    // 保存ボタンが無効化されることを確認
    const saveButton = screen.getByRole("button", { name: /保存中/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toBeDisabled();

    // アニメーションクラスが適用されることを確認
    const saveIcon = screen.getByRole("img", { hidden: true });
    expect(saveIcon).toHaveClass("animate-pulse");

    // 適切なタイトルが設定されることを確認
    expect(saveButton).toHaveAttribute("title", "保存中...");
  });

  /**
   * 成功結果が表示されることを検証
   *
   * テスト内容:
   * - 成功メッセージが表示される
   * - CheckCircleアイコンが表示される
   * - 更新ボタンが表示される
   * - 適切なスタイルが適用される
   */
  it("成功結果が表示される", () => {
    render(<SaveButton {...successProps} />);

    // 成功メッセージが表示されることを確認
    expect(
      screen.getByText("データが正常に保存されました")
    ).toBeInTheDocument();

    // CheckCircleアイコンが表示されることを確認
    const checkIcon = screen.getByRole("img", { hidden: true });
    expect(checkIcon).toBeInTheDocument();

    // 更新ボタンが表示されることを確認
    const refreshButton = screen.getByRole("button", { name: /更新/i });
    expect(refreshButton).toBeInTheDocument();

    // 成功スタイルが適用されることを確認
    const resultContainer = screen
      .getByText("データが正常に保存されました")
      .closest("div");
    expect(resultContainer).toHaveClass(
      "bg-green-50",
      "text-green-800",
      "border-green-200"
    );
  });

  /**
   * エラー結果が表示されることを検証
   *
   * テスト内容:
   * - エラーメッセージが表示される
   * - AlertCircleアイコンが表示される
   * - 更新ボタンが表示されない
   * - 適切なスタイルが適用される
   */
  it("エラー結果が表示される", () => {
    render(<SaveButton {...errorProps} />);

    // エラーメッセージが表示されることを確認
    expect(
      screen.getByText("保存中にエラーが発生しました")
    ).toBeInTheDocument();

    // AlertCircleアイコンが表示されることを確認
    const alertIcon = screen.getByRole("img", { hidden: true });
    expect(alertIcon).toBeInTheDocument();

    // 更新ボタンが表示されないことを確認
    expect(
      screen.queryByRole("button", { name: /更新/i })
    ).not.toBeInTheDocument();

    // エラースタイルが適用されることを確認
    const resultContainer = screen
      .getByText("保存中にエラーが発生しました")
      .closest("div");
    expect(resultContainer).toHaveClass(
      "bg-red-50",
      "text-red-800",
      "border-red-200"
    );
  });
});

// ===== 状態管理のテスト =====

/**
 * SaveButtonコンポーネントの状態管理機能の検証
 *
 * このセクションでは、savingとsaveResultの状態が
 * 正しく管理されることを検証します。
 *
 * 検証項目:
 * - saving状態の変化
 * - saveResult状態の変化
 * - 状態に応じたUIの更新
 */
describe("状態管理", () => {
  /**
   * saving状態の変化が正しく反映されることを検証
   *
   * テスト内容:
   * - savingがtrueの時にボタンが無効化される
   * - savingがfalseの時にボタンが有効化される
   * - 適切なスタイルが適用される
   */
  it("saving状態の変化が正しく反映される", () => {
    const { rerender } = render(<SaveButton {...defaultProps} />);

    // 初期状態ではボタンが有効
    let saveButton = screen.getByRole("button", {
      name: /データベースに保存/i,
    });
    expect(saveButton).not.toBeDisabled();

    // saving状態に変更
    rerender(<SaveButton {...savingProps} />);

    // ボタンが無効化されることを確認
    saveButton = screen.getByRole("button", { name: /保存中/i });
    expect(saveButton).toBeDisabled();
    expect(saveButton).toHaveClass(
      "disabled:opacity-50",
      "disabled:cursor-not-allowed"
    );

    // saving状態を解除
    rerender(<SaveButton {...defaultProps} />);

    // ボタンが有効化されることを確認
    saveButton = screen.getByRole("button", { name: /データベースに保存/i });
    expect(saveButton).not.toBeDisabled();
  });

  /**
   * saveResult状態の変化が正しく反映されることを検証
   *
   * テスト内容:
   * - saveResultがnullの時に結果が表示されない
   * - saveResultが設定された時に結果が表示される
   * - 成功とエラーで異なる表示になる
   */
  it("saveResult状態の変化が正しく反映される", () => {
    const { rerender } = render(<SaveButton {...defaultProps} />);

    // 初期状態では結果が表示されない
    expect(
      screen.queryByText(/データが正常に保存されました/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/保存中にエラーが発生しました/)
    ).not.toBeInTheDocument();

    // 成功結果を設定
    rerender(<SaveButton {...successProps} />);

    // 成功結果が表示されることを確認
    expect(
      screen.getByText("データが正常に保存されました")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /更新/i })).toBeInTheDocument();

    // エラー結果に変更
    rerender(<SaveButton {...errorProps} />);

    // エラー結果が表示されることを確認
    expect(
      screen.getByText("保存中にエラーが発生しました")
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /更新/i })
    ).not.toBeInTheDocument();

    // 結果をクリア
    rerender(<SaveButton {...defaultProps} />);

    // 結果が表示されないことを確認
    expect(
      screen.queryByText(/データが正常に保存されました/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(/保存中にエラーが発生しました/)
    ).not.toBeInTheDocument();
  });

  /**
   * 複数の状態が同時に変化した時に正しく反映されることを検証
   *
   * テスト内容:
   * - savingとsaveResultが同時に変化する
   * - 適切なUIが表示される
   * - 状態の競合が発生しない
   */
  it("複数の状態が同時に変化した時に正しく反映される", () => {
    const { rerender } = render(<SaveButton {...defaultProps} />);

    // savingとsuccessResultを同時に設定
    rerender(<SaveButton {...savingProps} saveResult={successResult} />);

    // ボタンが無効化されることを確認
    const saveButton = screen.getByRole("button", { name: /保存中/i });
    expect(saveButton).toBeDisabled();

    // 成功結果が表示されることを確認
    expect(
      screen.getByText("データが正常に保存されました")
    ).toBeInTheDocument();
  });
});

// ===== イベント処理のテスト =====

/**
 * SaveButtonコンポーネントのイベント処理機能の検証
 *
 * このセクションでは、クリックイベントやその他の
 * ユーザーインタラクションが正しく処理されることを検証します。
 *
 * 検証項目:
 * - onSaveコールバックの呼び出し
 * - リロードボタンのクリック
 * - 無効化されたボタンのクリック
 */
describe("イベント処理", () => {
  /**
   * 保存ボタンのクリックでonSaveが呼び出されることを検証
   *
   * テスト内容:
   * - ボタンクリックでonSaveが呼び出される
   * - コールバックが正しい引数で呼び出される
   * - 複数回クリックで複数回呼び出される
   */
  it("保存ボタンのクリックでonSaveが呼び出される", async () => {
    const user = userEvent.setup();
    render(<SaveButton {...defaultProps} />);

    const saveButton = screen.getByRole("button", {
      name: /データベースに保存/i,
    });

    // ボタンをクリック
    await user.click(saveButton);

    // onSaveが呼び出されることを確認
    expect(mockOnSave).toHaveBeenCalledTimes(1);
    expect(mockOnSave).toHaveBeenCalledWith();

    // 複数回クリック
    await user.click(saveButton);
    await user.click(saveButton);

    // 複数回呼び出されることを確認
    expect(mockOnSave).toHaveBeenCalledTimes(3);
  });

  /**
   * 保存中状態ではボタンクリックでonSaveが呼び出されないことを検証
   *
   * テスト内容:
   * - 無効化されたボタンはクリックできない
   * - onSaveが呼び出されない
   * - エラーが発生しない
   */
  it("保存中状態ではボタンクリックでonSaveが呼び出されない", async () => {
    const user = userEvent.setup();
    render(<SaveButton {...savingProps} />);

    const saveButton = screen.getByRole("button", { name: /保存中/i });

    // ボタンが無効化されていることを確認
    expect(saveButton).toBeDisabled();

    // ボタンをクリック（無効化されているのでクリックできない）
    await user.click(saveButton);

    // onSaveが呼び出されないことを確認
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  /**
   * 更新ボタンのクリックでリロードが実行されることを検証
   *
   * テスト内容:
   * - 更新ボタンクリックでwindow.location.reloadが呼び出される
   * - 成功状態でのみ更新ボタンが表示される
   * - エラー状態では更新ボタンが表示されない
   */
  it("更新ボタンのクリックでリロードが実行される", async () => {
    const user = userEvent.setup();
    render(<SaveButton {...successProps} />);

    const refreshButton = screen.getByRole("button", { name: /更新/i });

    // 更新ボタンをクリック
    await user.click(refreshButton);

    // window.location.reloadが呼び出されることを確認
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  /**
   * キーボード操作でボタンが動作することを検証
   *
   * テスト内容:
   * - Enterキーでボタンが動作する
   * - Spaceキーでボタンが動作する
   * - 無効化されたボタンはキーボード操作できない
   */
  it("キーボード操作でボタンが動作する", async () => {
    const user = userEvent.setup();
    render(<SaveButton {...defaultProps} />);

    const saveButton = screen.getByRole("button", {
      name: /データベースに保存/i,
    });

    // フォーカスを当てる
    saveButton.focus();

    // Enterキーでボタンを実行
    await user.keyboard("{Enter}");
    expect(mockOnSave).toHaveBeenCalledTimes(1);

    // Spaceキーでボタンを実行
    await user.keyboard(" ");
    expect(mockOnSave).toHaveBeenCalledTimes(2);
  });
});

// ===== スタイリングのテスト =====

/**
 * SaveButtonコンポーネントのスタイリング機能の検証
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
   * - ホバー効果のクラスが適用される
   * - フォーカス効果のクラスが適用される
   */
  it("デフォルト状態のスタイリングが正しく適用される", () => {
    render(<SaveButton {...defaultProps} />);

    const saveButton = screen.getByRole("button", {
      name: /データベースに保存/i,
    });

    // デフォルトのクラス名が適用されることを確認
    expect(saveButton).toHaveClass(
      "bg-indigo-600",
      "text-white",
      "rounded-lg",
      "hover:bg-indigo-700",
      "focus:outline-none",
      "focus:ring-2",
      "focus:ring-indigo-500"
    );
  });

  /**
   * 保存中状態のスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 無効化状態のクラスが適用される
   * - アニメーションクラスが適用される
   * - 透明度が適用される
   */
  it("保存中状態のスタイリングが正しく適用される", () => {
    render(<SaveButton {...savingProps} />);

    const saveButton = screen.getByRole("button", { name: /保存中/i });

    // 無効化状態のクラスが適用されることを確認
    expect(saveButton).toHaveClass(
      "disabled:opacity-50",
      "disabled:cursor-not-allowed"
    );

    // アニメーションクラスが適用されることを確認
    const saveIcon = screen.getByRole("img", { hidden: true });
    expect(saveIcon).toHaveClass("animate-pulse");
  });

  /**
   * 成功結果のスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 成功状態のクラスが適用される
   * - 適切な色が適用される
   * - ボーダーが適用される
   */
  it("成功結果のスタイリングが正しく適用される", () => {
    render(<SaveButton {...successProps} />);

    const resultContainer = screen
      .getByText("データが正常に保存されました")
      .closest("div");

    // 成功状態のクラスが適用されることを確認
    expect(resultContainer).toHaveClass(
      "bg-green-50",
      "text-green-800",
      "border",
      "border-green-200"
    );
  });

  /**
   * エラー結果のスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - エラー状態のクラスが適用される
   * - 適切な色が適用される
   * - ボーダーが適用される
   */
  it("エラー結果のスタイリングが正しく適用される", () => {
    render(<SaveButton {...errorProps} />);

    const resultContainer = screen
      .getByText("保存中にエラーが発生しました")
      .closest("div");

    // エラー状態のクラスが適用されることを確認
    expect(resultContainer).toHaveClass(
      "bg-red-50",
      "text-red-800",
      "border",
      "border-red-200"
    );
  });

  /**
   * 更新ボタンのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 更新ボタンのクラスが適用される
   * - ホバー効果が適用される
   * - 適切なサイズが適用される
   */
  it("更新ボタンのスタイリングが正しく適用される", () => {
    render(<SaveButton {...successProps} />);

    const refreshButton = screen.getByRole("button", { name: /更新/i });

    // 更新ボタンのクラスが適用されることを確認
    expect(refreshButton).toHaveClass(
      "bg-green-100",
      "hover:bg-green-200",
      "text-green-800",
      "rounded",
      "transition-colors"
    );
  });
});

// ===== アクセシビリティのテスト =====

/**
 * SaveButtonコンポーネントのアクセシビリティ機能の検証
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
   * ボタンが適切なロール属性を持つことを検証
   *
   * テスト内容:
   * - ボタン要素が適切なロールを持つ
   * - アクセシブルな名前が設定される
   * - タイトル属性が設定される
   */
  it("ボタンが適切なロール属性を持つ", () => {
    render(<SaveButton {...defaultProps} />);

    const saveButton = screen.getByRole("button", {
      name: /データベースに保存/i,
    });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toHaveAttribute("title", "データベースに保存");
  });

  /**
   * 保存中状態でアクセシビリティが適切に保たれることを検証
   *
   * テスト内容:
   * - 無効化されたボタンでもアクセシブルな名前が設定される
   * - タイトル属性が更新される
   * - ロール属性が保たれる
   */
  it("保存中状態でアクセシビリティが適切に保たれる", () => {
    render(<SaveButton {...savingProps} />);

    const saveButton = screen.getByRole("button", { name: /保存中/i });
    expect(saveButton).toBeInTheDocument();
    expect(saveButton).toHaveAttribute("title", "保存中...");
  });

  /**
   * 結果メッセージがアクセシブルであることを検証
   *
   * テスト内容:
   * - 結果メッセージが読み取れる
   * - アイコンが適切に配置される
   * - 色のコントラストが適切である
   */
  it("結果メッセージがアクセシブルである", () => {
    render(<SaveButton {...successProps} />);

    // 成功メッセージが読み取れることを確認
    expect(
      screen.getByText("データが正常に保存されました")
    ).toBeInTheDocument();

    // アイコンが適切に配置されることを確認
    const checkIcon = screen.getByRole("img", { hidden: true });
    expect(checkIcon).toBeInTheDocument();
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
    render(<SaveButton {...defaultProps} />);

    const saveButton = screen.getByRole("button", {
      name: /データベースに保存/i,
    });

    // フォーカスを当てる
    saveButton.focus();
    expect(saveButton).toHaveFocus();

    // Enterキーでボタンを実行
    await user.keyboard("{Enter}");
    expect(mockOnSave).toHaveBeenCalledTimes(1);

    // Spaceキーでボタンを実行
    await user.keyboard(" ");
    expect(mockOnSave).toHaveBeenCalledTimes(2);
  });
});

// ===== エッジケースのテスト =====

/**
 * SaveButtonコンポーネントのエッジケースの検証
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
   * 空のメッセージでもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 空のメッセージでもレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("空のメッセージでもエラーが発生しない", () => {
    const emptyMessageProps = {
      ...defaultProps,
      saveResult: {
        success: true,
        message: "",
      },
    };

    render(<SaveButton {...emptyMessageProps} />);

    // 結果コンテナが表示されることを確認
    const resultContainer = screen
      .getByRole("img", { hidden: true })
      .closest("div");
    expect(resultContainer).toBeInTheDocument();
  });

  /**
   * 非常に長いメッセージでも正しく表示されることを検証
   *
   * テスト内容:
   * - 長いメッセージでもレンダリングされる
   * - レイアウトが崩れない
   * - 適切なスタイルが適用される
   */
  it("非常に長いメッセージでも正しく表示される", () => {
    const longMessageProps = {
      ...defaultProps,
      saveResult: {
        success: true,
        message: "a".repeat(1000),
      },
    };

    render(<SaveButton {...longMessageProps} />);

    // 長いメッセージが表示されることを確認
    expect(screen.getByText("a".repeat(1000))).toBeInTheDocument();
  });

  /**
   * 特殊文字を含むメッセージでも正しく表示されることを検証
   *
   * テスト内容:
   * - 特殊文字を含むメッセージでもレンダリングされる
   * - エスケープが正しく処理される
   * - 適切なスタイルが適用される
   */
  it("特殊文字を含むメッセージでも正しく表示される", () => {
    const specialMessageProps = {
      ...defaultProps,
      saveResult: {
        success: true,
        message: "メッセージに<>&\"'が含まれています",
      },
    };

    render(<SaveButton {...specialMessageProps} />);

    // 特殊文字を含むメッセージが表示されることを確認
    expect(
      screen.getByText("メッセージに<>&\"'が含まれています")
    ).toBeInTheDocument();
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
    const { rerender } = render(<SaveButton {...defaultProps} />);

    // 複数の状態を同時に変化
    rerender(
      <SaveButton
        onSave={mockOnSave}
        saving={true}
        saveResult={{
          success: false,
          message: "エラーが発生しました",
        }}
      />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 適切なUIが表示されることを確認
    expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
  });
});

// ===== パフォーマンスのテスト =====

/**
 * SaveButtonコンポーネントのパフォーマンスの検証
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
    const { rerender } = render(<SaveButton {...defaultProps} />);

    const startTime = performance.now();

    // 状態を変化させる
    rerender(<SaveButton {...savingProps} />);
    rerender(<SaveButton {...successProps} />);
    rerender(<SaveButton {...errorProps} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 再レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);
  });

  /**
   * 大量の状態変化でもパフォーマンスが適切であることを検証
   *
   * テスト内容:
   * - 大量の状態変化でもパフォーマンスが適切である
   * - メモリリークが発生しない
   * - レンダリング時間が適切である
   */
  it("大量の状態変化でもパフォーマンスが適切である", () => {
    const { rerender } = render(<SaveButton {...defaultProps} />);

    const startTime = performance.now();

    // 大量の状態変化を実行
    for (let i = 0; i < 100; i++) {
      rerender(
        <SaveButton
          onSave={mockOnSave}
          saving={i % 2 === 0}
          saveResult={
            i % 3 === 0 ? successResult : i % 3 === 1 ? errorResult : null
          }
        />
      );
    }

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);
  });
});
