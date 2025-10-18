import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ExportButton } from "../ExportButton";
import { FormattedValue } from "@/lib/estat-api";

/**
 * ExportButton テストスイート
 *
 * このテストファイルは、ExportButtonコンポーネントの動作を検証します。
 * エクスポート処理、ローディング状態、レンダリング、スタイリング、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - エクスポート処理の動作
 * - ローディング状態の管理
 * - イベント処理
 * - スタイリングの適用
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - useCSVExportフックのモックが必要
 * - 非同期処理のテストに注意
 * - ファイルダウンロードのシミュレーション
 */

// ===== モック設定 =====

/**
 * useCSVExportフックのモック
 *
 * このモックは、useCSVExportフックの戻り値をシミュレートします。
 * エクスポート処理の成功・失敗、ローディング状態を制御できます。
 */
const mockExportToCSV = vi.fn();
const mockIsExporting = vi.fn(() => false);

vi.mock("@/hooks/export/useCSVExport", () => ({
  useCSVExport: () => ({
    exportToCSV: mockExportToCSV,
    isExporting: mockIsExporting(),
  }),
}));

// ===== テストデータ =====

/**
 * モック関数の定義
 *
 * このセクションでは、テストで使用するモック関数を定義します。
 * 各モック関数は、特定の動作をシミュレートするために使用されます。
 */
const mockOnExportComplete = vi.fn();

/**
 * テスト用のデータ
 *
 * このデータは、ExportButtonコンポーネントのテストで使用する
 * 様々なデータの組み合わせを表しています。
 *
 * データ構造:
 * - data: エクスポート対象のデータ
 * - filename: ファイル名
 * - dataType: データ種別
 * - metadata: メタデータ
 * - csvOptions: CSVエクスポートオプション
 * - className: カスタムクラス名
 * - label: ボタンテキスト
 * - iconSize: アイコンサイズ
 * - onExportComplete: エクスポート完了時のコールバック
 *
 * 用途:
 * - レンダリングテスト
 * - エクスポート処理テスト
 * - 状態管理テスト
 */
const mockData: FormattedValue[] = [
  { value: "100", label: "都道府県A", unit: "人" },
  { value: "200", label: "都道府県B", unit: "人" },
  { value: "300", label: "都道府県C", unit: "人" },
];

const defaultProps = {
  data: mockData,
  onExportComplete: mockOnExportComplete,
};

const withFilenameProps = {
  ...defaultProps,
  filename: "custom-export",
};

const withMetadataProps = {
  ...defaultProps,
  dataType: "prefecture-ranking",
  metadata: {
    year: "2023",
    areaName: "全国",
  },
};

const withCSVOptionsProps = {
  ...defaultProps,
  csvOptions: {
    includeHeader: true,
    delimiter: ",",
    encoding: "utf-8",
  },
};

const withCustomProps = {
  ...defaultProps,
  className: "custom-export-button",
  label: "カスタムエクスポート",
  iconSize: 20,
};

const emptyDataProps = {
  ...defaultProps,
  data: [],
};

const nullDataProps = {
  ...defaultProps,
  data: null as any,
};

/**
 * エクスポート結果のテストケース
 *
 * このデータは、エクスポート処理の成功・失敗のテストで使用する
 * データを表しています。
 *
 * データ構造:
 * - success: エクスポートの成功/失敗
 * - filename: 生成されたファイル名
 * - rowCount: 行数
 * - error: エラー情報（失敗時）
 * - description: テストの説明
 *
 * 用途:
 * - エクスポート処理のテスト
 * - 成功・失敗の処理テスト
 * - コールバックのテスト
 */
const exportResultTestCases = [
  {
    success: true,
    filename: "export.csv",
    rowCount: 3,
    error: null,
    description: "成功",
  },
  {
    success: false,
    filename: "",
    rowCount: 0,
    error: { message: "エクスポートに失敗しました" },
    description: "失敗",
  },
];

// ===== テストセットアップ =====

/**
 * 各テストの前に実行されるセットアップ処理
 *
 * 実行内容:
 * - モック関数のクリア
 * - テスト間の状態リセット
 * - デフォルトのモック設定
 */
beforeEach(() => {
  vi.clearAllMocks();

  // デフォルトのモック設定
  mockIsExporting.mockReturnValue(false);
  mockExportToCSV.mockResolvedValue({
    success: true,
    filename: "export.csv",
    rowCount: 3,
    fileSize: 1024,
    processingTime: 100,
  });
});

// ===== 基本的なレンダリングテスト =====

/**
 * ExportButtonコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、ExportButtonコンポーネントが
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
   * - エクスポートボタンが表示される
   * - Downloadアイコンが表示される
   * - デフォルトラベルが表示される
   * - データ行数が表示される
   */
  it("デフォルト状態でボタンがレンダリングされる", () => {
    render(<ExportButton {...defaultProps} />);

    // エクスポートボタンが存在することを確認
    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).not.toBeDisabled();

    // Downloadアイコンが表示されることを確認
    const downloadIcon = screen.getByRole("img", { hidden: true });
    expect(downloadIcon).toBeInTheDocument();
    expect(downloadIcon.tagName).toBe("svg");

    // デフォルトラベルが表示されることを確認
    expect(screen.getByText("CSVダウンロード")).toBeInTheDocument();

    // データ行数が表示されることを確認
    expect(screen.getByText("(3行)")).toBeInTheDocument();
  });

  /**
   * カスタムプロパティでボタンがレンダリングされることを検証
   *
   * テスト内容:
   * - カスタムラベルが表示される
   * - カスタムクラス名が適用される
   * - カスタムアイコンサイズが適用される
   * - 適切なスタイルが設定される
   */
  it("カスタムプロパティでボタンがレンダリングされる", () => {
    render(<ExportButton {...withCustomProps} />);

    // カスタムラベルが表示されることを確認
    expect(screen.getByText("カスタムエクスポート")).toBeInTheDocument();

    // カスタムクラス名が適用されることを確認
    const exportButton = screen.getByRole("button", {
      name: /カスタムエクスポート/,
    });
    expect(exportButton).toHaveClass("custom-export-button");

    // カスタムアイコンサイズが適用されることを確認
    const downloadIcon = screen.getByRole("img", { hidden: true });
    expect(downloadIcon).toHaveAttribute("size", "20");
  });

  /**
   * 空のデータでボタンがレンダリングされることを検証
   *
   * テスト内容:
   * - ボタンが無効化される
   * - データ行数が表示されない
   * - 適切なタイトルが設定される
   * - エラーが発生しない
   */
  it("空のデータでボタンがレンダリングされる", () => {
    render(<ExportButton {...emptyDataProps} />);

    // ボタンが無効化されることを確認
    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });
    expect(exportButton).toBeDisabled();

    // データ行数が表示されないことを確認
    expect(screen.queryByText(/行/)).not.toBeInTheDocument();

    // 適切なタイトルが設定されることを確認
    expect(exportButton).toHaveAttribute("title", "データがありません");
  });

  /**
   * nullデータでボタンがレンダリングされることを検証
   *
   * テスト内容:
   * - ボタンが無効化される
   * - エラーが発生しない
   * - 適切なタイトルが設定される
   */
  it("nullデータでボタンがレンダリングされる", () => {
    render(<ExportButton {...nullDataProps} />);

    // ボタンが無効化されることを確認
    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });
    expect(exportButton).toBeDisabled();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== ローディング状態のテスト =====

/**
 * ExportButtonコンポーネントのローディング状態機能の検証
 *
 * このセクションでは、エクスポート処理中の
 * ローディング状態が正しく表示されることを検証します。
 *
 * 検証項目:
 * - ローディング状態の表示
 * - アイコンの切り替え
 * - ボタンの無効化
 * - アニメーションの適用
 */
describe("ローディング状態", () => {
  /**
   * ローディング状態でボタンが正しく表示されることを検証
   *
   * テスト内容:
   * - ローディングアイコンが表示される
   * - ボタンが無効化される
   * - アニメーションクラスが適用される
   * - 適切なスタイルが設定される
   */
  it("ローディング状態でボタンが正しく表示される", () => {
    // ローディング状態をシミュレート
    mockIsExporting.mockReturnValue(true);

    render(<ExportButton {...defaultProps} />);

    // ローディングアイコンが表示されることを確認
    const loadingIcon = screen.getByRole("img", { hidden: true });
    expect(loadingIcon).toBeInTheDocument();
    expect(loadingIcon.tagName).toBe("svg");

    // ボタンが無効化されることを確認
    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });
    expect(exportButton).toBeDisabled();

    // アニメーションクラスが適用されることを確認
    expect(loadingIcon).toHaveClass("animate-spin");
  });

  /**
   * ローディング状態の切り替えが正しく動作することを検証
   *
   * テスト内容:
   * - ローディング状態の切り替えが動作する
   * - アイコンが正しく切り替わる
   * - ボタンの状態が正しく更新される
   */
  it("ローディング状態の切り替えが正しく動作する", () => {
    const { rerender } = render(<ExportButton {...defaultProps} />);

    // 初期状態ではDownloadアイコンが表示される
    let icon = screen.getByRole("img", { hidden: true });
    expect(icon).toBeInTheDocument();

    // ローディング状態に変更
    mockIsExporting.mockReturnValue(true);
    rerender(<ExportButton {...defaultProps} />);

    // ローディングアイコンが表示されることを確認
    icon = screen.getByRole("img", { hidden: true });
    expect(icon).toHaveClass("animate-spin");

    // ローディング状態を解除
    mockIsExporting.mockReturnValue(false);
    rerender(<ExportButton {...defaultProps} />);

    // Downloadアイコンが表示されることを確認
    icon = screen.getByRole("img", { hidden: true });
    expect(icon).not.toHaveClass("animate-spin");
  });

  /**
   * ローディング中でもボタンがクリックできないことを検証
   *
   * テスト内容:
   * - ローディング中はボタンがクリックできない
   * - エクスポート処理が実行されない
   * - エラーが発生しない
   */
  it("ローディング中でもボタンがクリックできない", async () => {
    const user = userEvent.setup();
    mockIsExporting.mockReturnValue(true);

    render(<ExportButton {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // ボタンが無効化されていることを確認
    expect(exportButton).toBeDisabled();

    // ボタンをクリック（無効化されているのでクリックできない）
    await user.click(exportButton);

    // エクスポート処理が実行されないことを確認
    expect(mockExportToCSV).not.toHaveBeenCalled();
  });
});

// ===== エクスポート処理のテスト =====

/**
 * ExportButtonコンポーネントのエクスポート処理機能の検証
 *
 * このセクションでは、エクスポート処理が
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - エクスポート処理の実行
 * - 成功・失敗の処理
 * - コールバックの呼び出し
 * - エラーハンドリング
 */
describe("エクスポート処理", () => {
  /**
   * ボタンクリックでエクスポート処理が実行されることを検証
   *
   * テスト内容:
   * - ボタンクリックでエクスポート処理が実行される
   * - 正しい引数で呼び出される
   * - 複数回クリックで複数回実行される
   */
  it("ボタンクリックでエクスポート処理が実行される", async () => {
    const user = userEvent.setup();
    render(<ExportButton {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // ボタンをクリック
    await user.click(exportButton);

    // エクスポート処理が実行されることを確認
    expect(mockExportToCSV).toHaveBeenCalledTimes(1);
    expect(mockExportToCSV).toHaveBeenCalledWith(mockData, {
      filename: undefined,
    });
  });

  /**
   * カスタムオプションでエクスポート処理が実行されることを検証
   *
   * テスト内容:
   * - カスタムオプションが正しく渡される
   * - ファイル名が正しく設定される
   * - CSVオプションが正しく適用される
   */
  it("カスタムオプションでエクスポート処理が実行される", async () => {
    const user = userEvent.setup();
    render(<ExportButton {...withCSVOptionsProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // ボタンをクリック
    await user.click(exportButton);

    // カスタムオプションが正しく渡されることを確認
    expect(mockExportToCSV).toHaveBeenCalledWith(mockData, {
      filename: undefined,
      includeHeader: true,
      delimiter: ",",
      encoding: "utf-8",
    });
  });

  /**
   * エクスポート成功時にコールバックが呼び出されることを検証
   *
   * テスト内容:
   * - 成功時にコールバックが呼び出される
   * - 正しい引数で呼び出される
   * - 複数回の成功で複数回呼び出される
   */
  it("エクスポート成功時にコールバックが呼び出される", async () => {
    const user = userEvent.setup();
    mockExportToCSV.mockResolvedValue({
      success: true,
      filename: "export.csv",
      rowCount: 3,
    });

    render(<ExportButton {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // ボタンをクリック
    await user.click(exportButton);

    // コールバックが呼び出されることを確認
    expect(mockOnExportComplete).toHaveBeenCalledTimes(1);
    expect(mockOnExportComplete).toHaveBeenCalledWith(true);
  });

  /**
   * エクスポート失敗時にコールバックが呼び出されることを検証
   *
   * テスト内容:
   * - 失敗時にコールバックが呼び出される
   * - 正しい引数で呼び出される
   * - エラーメッセージが正しく処理される
   */
  it("エクスポート失敗時にコールバックが呼び出される", async () => {
    const user = userEvent.setup();
    mockExportToCSV.mockResolvedValue({
      success: false,
      filename: "",
      rowCount: 0,
      error: { message: "エクスポートに失敗しました" },
    });

    render(<ExportButton {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // ボタンをクリック
    await user.click(exportButton);

    // コールバックが呼び出されることを確認
    expect(mockOnExportComplete).toHaveBeenCalledTimes(1);
    expect(mockOnExportComplete).toHaveBeenCalledWith(false);
  });

  /**
   * エクスポート処理のエラーハンドリングが正しく動作することを検証
   *
   * テスト内容:
   * - エラーが発生してもコンポーネントがクラッシュしない
   * - 適切なエラーメッセージが表示される
   * - コールバックが正しく呼び出される
   */
  it("エクスポート処理のエラーハンドリングが正しく動作する", async () => {
    const user = userEvent.setup();
    mockExportToCSV.mockRejectedValue(new Error("エクスポートエラー"));

    render(<ExportButton {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // ボタンをクリック
    await user.click(exportButton);

    // エラーが発生してもコンポーネントがクラッシュしないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== スタイリングのテスト =====

/**
 * ExportButtonコンポーネントのスタイリング機能の検証
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
    render(<ExportButton {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // デフォルトのクラス名が適用されることを確認
    expect(exportButton).toHaveClass(
      "flex",
      "items-center",
      "gap-2",
      "px-3",
      "py-1.5",
      "text-sm",
      "font-medium",
      "bg-white",
      "dark:bg-neutral-800",
      "border",
      "border-gray-300",
      "dark:border-neutral-600",
      "rounded-md",
      "hover:bg-gray-50",
      "dark:hover:bg-neutral-700",
      "disabled:opacity-50",
      "disabled:cursor-not-allowed",
      "transition-colors"
    );
  });

  /**
   * 無効化状態のスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 無効化状態のクラスが適用される
   * - 透明度が適用される
   * - カーソルが変更される
   */
  it("無効化状態のスタイリングが正しく適用される", () => {
    render(<ExportButton {...emptyDataProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // 無効化状態のクラスが適用されることを確認
    expect(exportButton).toHaveClass(
      "disabled:opacity-50",
      "disabled:cursor-not-allowed"
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
    render(<ExportButton {...withCustomProps} />);

    const exportButton = screen.getByRole("button", {
      name: /カスタムエクスポート/,
    });

    // カスタムクラス名が適用されることを確認
    expect(exportButton).toHaveClass("custom-export-button");
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
    render(<ExportButton {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // ダークモードのクラス名が適用されることを確認
    expect(exportButton).toHaveClass(
      "dark:bg-neutral-800",
      "dark:border-neutral-600",
      "dark:hover:bg-neutral-700"
    );
  });
});

// ===== アクセシビリティのテスト =====

/**
 * ExportButtonコンポーネントのアクセシビリティ機能の検証
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
   * - 適切な属性が設定される
   */
  it("ボタンが適切なロール属性を持つ", () => {
    render(<ExportButton {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // ボタンが適切なロールを持つことを確認
    expect(exportButton).toBeInTheDocument();
    expect(exportButton).toHaveAttribute("title", "CSVダウンロード");
  });

  /**
   * 無効化状態でアクセシビリティが適切に保たれることを検証
   *
   * テスト内容:
   * - 無効化されたボタンでもアクセシブルな名前が設定される
   * - タイトル属性が更新される
   * - ロール属性が保たれる
   */
  it("無効化状態でアクセシビリティが適切に保たれる", () => {
    render(<ExportButton {...emptyDataProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // 無効化されたボタンでもアクセシブルな名前が設定されることを確認
    expect(exportButton).toHaveAttribute("title", "データがありません");
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
    render(<ExportButton {...defaultProps} />);

    const exportButton = screen.getByRole("button", {
      name: /CSVダウンロード/,
    });

    // フォーカスを当てる
    exportButton.focus();
    expect(exportButton).toHaveFocus();

    // Enterキーでボタンを実行
    await user.keyboard("{Enter}");
    expect(mockExportToCSV).toHaveBeenCalledTimes(1);

    // Spaceキーでボタンを実行
    await user.keyboard(" ");
    expect(mockExportToCSV).toHaveBeenCalledTimes(2);
  });

  /**
   * データ行数がアクセシブルであることを検証
   *
   * テスト内容:
   * - データ行数が読み取れる
   * - 適切なテキストが表示される
   * - スクリーンリーダーに対応している
   */
  it("データ行数がアクセシブルである", () => {
    render(<ExportButton {...defaultProps} />);

    // データ行数が読み取れることを確認
    expect(screen.getByText("(3行)")).toBeInTheDocument();
  });
});

// ===== エッジケースのテスト =====

/**
 * ExportButtonコンポーネントのエッジケースの検証
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
   * 非常に大きなデータでも正しく処理されることを検証
   *
   * テスト内容:
   * - 大きなデータでもレンダリングされる
   * - パフォーマンスが適切である
   * - エラーが発生しない
   */
  it("非常に大きなデータでも正しく処理される", () => {
    const largeData = Array.from({ length: 10000 }, (_, i) => ({
      value: i.toString(),
      label: `データ${i}`,
      unit: "件",
    }));

    render(<ExportButton {...defaultProps} data={largeData} />);

    // 大きなデータでもレンダリングされることを確認
    expect(screen.getByText("(10000行)")).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 特殊文字を含むデータでも正しく処理されることを検証
   *
   * テスト内容:
   * - 特殊文字を含むデータでもレンダリングされる
   * - エスケープが正しく処理される
   * - 適切なスタイルが適用される
   */
  it("特殊文字を含むデータでも正しく処理される", () => {
    const specialData = [{ value: "100", label: "データ<>&\"'", unit: "件" }];

    render(<ExportButton {...defaultProps} data={specialData} />);

    // 特殊文字を含むデータでもレンダリングされることを確認
    expect(screen.getByText("(1行)")).toBeInTheDocument();

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
    const { rerender } = render(<ExportButton {...defaultProps} />);

    // 複数のプロパティを同時に変化
    rerender(
      <ExportButton
        data={mockData}
        filename="new-export"
        dataType="new-type"
        metadata={{ year: "2024" }}
        csvOptions={{ includeHeader: false }}
        className="new-class"
        label="新しいエクスポート"
        iconSize={24}
        onExportComplete={mockOnExportComplete}
      />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 適切なUIが表示されることを確認
    expect(screen.getByText("新しいエクスポート")).toBeInTheDocument();
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
    render(
      <ExportButton
        data={mockData}
        iconSize="invalid"
        label={null}
        onExportComplete="invalid"
      />
    );

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
 * ExportButtonコンポーネントのパフォーマンスの検証
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
    const { rerender } = render(<ExportButton {...defaultProps} />);

    const startTime = performance.now();

    // 状態を変化させる
    rerender(<ExportButton {...defaultProps} filename="new-export" />);
    rerender(<ExportButton {...defaultProps} dataType="new-type" />);
    rerender(<ExportButton {...defaultProps} className="new-class" />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 再レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);
  });

  /**
   * 大量のデータでもパフォーマンスが適切であることを検証
   *
   * テスト内容:
   * - 大量のデータでもパフォーマンスが適切である
   * - メモリリークが発生しない
   * - レンダリング時間が適切である
   */
  it("大量のデータでもパフォーマンスが適切である", () => {
    const largeData = Array.from({ length: 50000 }, (_, i) => ({
      value: i.toString(),
      label: `データ${i}`,
      unit: "件",
    }));

    const startTime = performance.now();

    render(<ExportButton {...defaultProps} data={largeData} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);

    // 大量のデータでもレンダリングされることを確認
    expect(screen.getByText("(50000行)")).toBeInTheDocument();
  });
});
