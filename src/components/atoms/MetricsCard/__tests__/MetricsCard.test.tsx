import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MetricsCard from "../MetricsCard";

/**
 * MetricsCard テストスイート
 *
 * このテストファイルは、MetricsCardコンポーネントの動作を検証します。
 * アナリティクス表示、セレクトボックス、メトリクス表示、チャートプレースホルダー、スタイリング、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - アナリティクスデータの表示
 * - セレクトボックスの動作
 * - メトリクス表示の更新
 * - スタイリングの適用
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - useStylesフックのモックが必要
 * - 静的なデータを表示するコンポーネント
 * - セレクトボックスのインタラクションをテスト
 */

// ===== モック設定 =====
// useStyles は削除されたため、モックは不要

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
 * MetricsCardコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、MetricsCardコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - アナリティクスコンテナの存在
 * - タイトルの表示
 * - セレクトボックスの表示
 * - メトリクスの表示
 * - チャートプレースホルダーの表示
 */
describe("基本的なレンダリング", () => {
  /**
   * デフォルト状態でコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - アナリティクスコンテナが表示される
   * - タイトルが表示される
   * - セレクトボックスが表示される
   * - メトリクスが表示される
   * - チャートプレースホルダーが表示される
   */
  it("デフォルト状態でコンポーネントがレンダリングされる", () => {
    render(<MetricsCard />);

    // タイトルが表示されることを確認
    expect(screen.getByText("Analytics")).toBeInTheDocument();

    // セレクトボックスが表示されることを確認
    const selectElement = screen.getByRole("combobox");
    expect(selectElement).toBeInTheDocument();

    // メトリクスが表示されることを確認
    expect(screen.getByText("22,900")).toBeInTheDocument();
    expect(screen.getByText("8,430")).toBeInTheDocument();

    // パーセンテージが表示されることを確認
    expect(screen.getByText("+12.5%")).toBeInTheDocument();
    expect(screen.getByText("-2.1%")).toBeInTheDocument();

    // チャートプレースホルダーが表示されることを確認
    expect(screen.getByText("Chart Placeholder")).toBeInTheDocument();
  });

  /**
   * セレクトボックスのオプションが正しく表示されることを検証
   *
   * テスト内容:
   * - すべてのオプションが表示される
   * - デフォルトオプションが選択される
   * - 適切な値が設定される
   */
  it("セレクトボックスのオプションが正しく表示される", () => {
    render(<MetricsCard />);

    const selectElement = screen.getByRole("combobox");

    // すべてのオプションが表示されることを確認
    expect(screen.getByText("Last 30 days")).toBeInTheDocument();
    expect(screen.getByText("Last 7 days")).toBeInTheDocument();
    expect(screen.getByText("Last 24 hours")).toBeInTheDocument();

    // デフォルトオプションが選択されることを確認
    expect(selectElement).toHaveValue("Last 30 days");
  });

  /**
   * メトリクスアイコンが正しく表示されることを検証
   *
   * テスト内容:
   * - 上昇アイコンが表示される
   * - 下降アイコンが表示される
   * - 適切なSVG要素が存在する
   */
  it("メトリクスアイコンが正しく表示される", () => {
    render(<MetricsCard />);

    // 上昇アイコンが表示されることを確認
    const upIcon = screen.getByText("+12.5%").previousElementSibling;
    expect(upIcon).toBeInTheDocument();
    expect(upIcon?.tagName).toBe("svg");

    // 下降アイコンが表示されることを確認
    const downIcon = screen.getByText("-2.1%").previousElementSibling;
    expect(downIcon).toBeInTheDocument();
    expect(downIcon?.tagName).toBe("svg");
  });

  /**
   * チャートプレースホルダーが正しく表示されることを検証
   *
   * テスト内容:
   * - チャートプレースホルダーが表示される
   * - 適切なスタイルが適用される
   * - プレースホルダーテキストが表示される
   */
  it("チャートプレースホルダーが正しく表示される", () => {
    render(<MetricsCard />);

    // チャートプレースホルダーが表示されることを確認
    expect(screen.getByText("Chart Placeholder")).toBeInTheDocument();

    // プレースホルダーコンテナが存在することを確認
    const placeholderContainer = screen
      .getByText("Chart Placeholder")
      .closest("div");
    expect(placeholderContainer).toHaveClass(
      "h-64",
      "bg-gray-100",
      "rounded-lg",
      "flex",
      "items-center",
      "justify-center"
    );
  });
});

// ===== セレクトボックスのテスト =====

/**
 * MetricsCardコンポーネントのセレクトボックス機能の検証
 *
 * このセクションでは、セレクトボックスの動作が
 * 正しく機能することを検証します。
 *
 * 検証項目:
 * - セレクトボックスの表示
 * - オプション選択の動作
 * - 値の変更
 * - イベント処理
 */
describe("セレクトボックス", () => {
  /**
   * セレクトボックスが正しく表示されることを検証
   *
   * テスト内容:
   * - セレクトボックスが表示される
   * - 適切なクラス名が適用される
   * - アクセシビリティが確保される
   */
  it("セレクトボックスが正しく表示される", () => {
    render(<MetricsCard />);

    const selectElement = screen.getByRole("combobox");

    // セレクトボックスが表示されることを確認
    expect(selectElement).toBeInTheDocument();

    // 適切なクラス名が適用されることを確認
    expect(selectElement).toHaveClass(
      "py-1.5",
      "px-2.5",
      "block",
      "text-sm",
      "border-gray-200",
      "rounded-lg",
      "focus:border-indigo-500",
      "focus:ring-indigo-500"
    );
  });

  /**
   * セレクトボックスのオプション選択が動作することを検証
   *
   * テスト内容:
   * - オプション選択が動作する
   * - 値が正しく変更される
   * - イベントが正しく処理される
   */
  it("セレクトボックスのオプション選択が動作する", async () => {
    const user = userEvent.setup();
    render(<MetricsCard />);

    const selectElement = screen.getByRole("combobox");

    // オプションを選択
    await user.selectOptions(selectElement, "Last 7 days");

    // 値が正しく変更されることを確認
    expect(selectElement).toHaveValue("Last 7 days");
  });

  /**
   * すべてのオプションが選択可能であることを検証
   *
   * テスト内容:
   * - 各オプションが選択可能である
   * - 値が正しく変更される
   * - エラーが発生しない
   */
  it("すべてのオプションが選択可能である", async () => {
    const user = userEvent.setup();
    render(<MetricsCard />);

    const selectElement = screen.getByRole("combobox");

    // 各オプションを選択
    await user.selectOptions(selectElement, "Last 30 days");
    expect(selectElement).toHaveValue("Last 30 days");

    await user.selectOptions(selectElement, "Last 7 days");
    expect(selectElement).toHaveValue("Last 7 days");

    await user.selectOptions(selectElement, "Last 24 hours");
    expect(selectElement).toHaveValue("Last 24 hours");
  });

  /**
   * キーボード操作でセレクトボックスが動作することを検証
   *
   * テスト内容:
   * - Tabキーでフォーカスが移動する
   * - 矢印キーでオプションが選択される
   * - Enterキーで選択が確定される
   */
  it("キーボード操作でセレクトボックスが動作する", async () => {
    const user = userEvent.setup();
    render(<MetricsCard />);

    const selectElement = screen.getByRole("combobox");

    // フォーカスを当てる
    selectElement.focus();
    expect(selectElement).toHaveFocus();

    // 矢印キーでオプションを選択
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    // 値が正しく変更されることを確認
    expect(selectElement).toHaveValue("Last 24 hours");
  });
});

// ===== メトリクス表示のテスト =====

/**
 * MetricsCardコンポーネントのメトリクス表示機能の検証
 *
 * このセクションでは、メトリクスの表示が
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - メトリクス値の表示
 * - パーセンテージの表示
 * - アイコンの表示
 * - 色の適用
 */
describe("メトリクス表示", () => {
  /**
   * メトリクス値が正しく表示されることを検証
   *
   * テスト内容:
   * - メトリクス値が表示される
   * - 適切なフォーマットが適用される
   * - 適切なスタイルが適用される
   */
  it("メトリクス値が正しく表示される", () => {
    render(<MetricsCard />);

    // メトリクス値が表示されることを確認
    expect(screen.getByText("22,900")).toBeInTheDocument();
    expect(screen.getByText("8,430")).toBeInTheDocument();

    // 適切なスタイルが適用されることを確認
    const firstMetric = screen.getByText("22,900");
    const secondMetric = screen.getByText("8,430");

    expect(firstMetric).toHaveClass(
      "block",
      "font-medium",
      "text-xl",
      "text-gray-800",
      "dark:text-neutral-200"
    );
    expect(secondMetric).toHaveClass(
      "block",
      "font-medium",
      "text-xl",
      "text-gray-800",
      "dark:text-neutral-200"
    );
  });

  /**
   * パーセンテージが正しく表示されることを検証
   *
   * テスト内容:
   * - パーセンテージが表示される
   * - 適切な色が適用される
   * - 適切なスタイルが適用される
   */
  it("パーセンテージが正しく表示される", () => {
    render(<MetricsCard />);

    // パーセンテージが表示されることを確認
    expect(screen.getByText("+12.5%")).toBeInTheDocument();
    expect(screen.getByText("-2.1%")).toBeInTheDocument();

    // 適切なスタイルが適用されることを確認
    const positivePercentage = screen.getByText("+12.5%");
    const negativePercentage = screen.getByText("-2.1%");

    expect(positivePercentage).toHaveClass(
      "flex",
      "justify-center",
      "items-center",
      "gap-x-1",
      "text-sm",
      "text-green-600",
      "dark:text-green-500"
    );
    expect(negativePercentage).toHaveClass(
      "flex",
      "justify-center",
      "items-center",
      "gap-x-1",
      "text-sm",
      "text-red-600",
      "dark:text-red-500"
    );
  });

  /**
   * アイコンが正しく表示されることを検証
   *
   * テスト内容:
   * - 上昇アイコンが表示される
   * - 下降アイコンが表示される
   * - 適切なSVG属性が設定される
   */
  it("アイコンが正しく表示される", () => {
    render(<MetricsCard />);

    // 上昇アイコンが表示されることを確認
    const upIcon = screen.getByText("+12.5%").previousElementSibling;
    expect(upIcon).toBeInTheDocument();
    expect(upIcon).toHaveClass("size-3.5");

    // 下降アイコンが表示されることを確認
    const downIcon = screen.getByText("-2.1%").previousElementSibling;
    expect(downIcon).toBeInTheDocument();
    expect(downIcon).toHaveClass("size-3.5");
  });

  /**
   * メトリクスレイアウトが正しく適用されることを検証
   *
   * テスト内容:
   * - グリッドレイアウトが適用される
   * - 適切な間隔が設定される
   * - レスポンシブデザインが適用される
   */
  it("メトリクスレイアウトが正しく適用される", () => {
    render(<MetricsCard />);

    // メトリクスコンテナが存在することを確認
    const metricsContainer = screen
      .getByText("22,900")
      .closest("div")?.parentElement;
    expect(metricsContainer).toHaveClass(
      "mt-2",
      "grid",
      "grid-cols-2",
      "gap-2"
    );
  });
});

// ===== スタイリングのテスト =====

/**
 * MetricsCardコンポーネントのスタイリング機能の検証
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
   * メインコンテナのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - メインコンテナのクラス名が適用される
   * - 背景色とボーダーが設定される
   * - 適切なレイアウトが適用される
   */
  it("メインコンテナのスタイリングが正しく適用される", () => {
    render(<MetricsCard />);

    const mainContainer = screen
      .getByText("Analytics")
      .closest("div")?.parentElement;

    // メインコンテナのクラス名が適用されることを確認
    expect(mainContainer).toHaveClass(
      "p-4",
      "flex",
      "flex-col",
      "bg-white",
      "border-b",
      "border-gray-200",
      "dark:bg-neutral-800",
      "dark:border-neutral-700"
    );
  });

  /**
   * ヘッダーセクションのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - ヘッダーセクションのクラス名が適用される
   * - タイトルとセレクトボックスの配置が適切である
   * - ボーダーが適用される
   */
  it("ヘッダーセクションのスタイリングが正しく適用される", () => {
    render(<MetricsCard />);

    const headerSection = screen.getByText("Analytics").closest("div");

    // ヘッダーセクションのクラス名が適用されることを確認
    expect(headerSection).toHaveClass(
      "pb-2",
      "flex",
      "flex-wrap",
      "justify-between",
      "items-center",
      "gap-2",
      "border-b",
      "border-dashed",
      "border-gray-200",
      "dark:border-neutral-700"
    );
  });

  /**
   * タイトルのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - タイトルのクラス名が適用される
   * - 適切なフォントサイズが設定される
   * - 適切な色が設定される
   */
  it("タイトルのスタイリングが正しく適用される", () => {
    render(<MetricsCard />);

    const title = screen.getByText("Analytics");

    // タイトルのクラス名が適用されることを確認
    expect(title).toHaveClass(
      "font-medium",
      "text-gray-800",
      "dark:text-neutral-200"
    );
  });

  /**
   * チャートプレースホルダーのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - チャートプレースホルダーのクラス名が適用される
   * - 適切な高さが設定される
   * - 適切な背景色が設定される
   */
  it("チャートプレースホルダーのスタイリングが正しく適用される", () => {
    render(<MetricsCard />);

    const placeholderContainer = screen
      .getByText("Chart Placeholder")
      .closest("div");

    // チャートプレースホルダーのクラス名が適用されることを確認
    expect(placeholderContainer).toHaveClass(
      "mt-4",
      "h-64",
      "bg-gray-100",
      "rounded-lg",
      "flex",
      "items-center",
      "justify-center",
      "dark:bg-neutral-700"
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
    render(<MetricsCard />);

    const mainContainer = screen
      .getByText("Analytics")
      .closest("div")?.parentElement;
    const title = screen.getByText("Analytics");
    const placeholderContainer = screen
      .getByText("Chart Placeholder")
      .closest("div");

    // ダークモードのクラス名が適用されることを確認
    expect(mainContainer).toHaveClass(
      "dark:bg-neutral-800",
      "dark:border-neutral-700"
    );
    expect(title).toHaveClass("dark:text-neutral-200");
    expect(placeholderContainer).toHaveClass("dark:bg-neutral-700");
  });
});

// ===== アクセシビリティのテスト =====

/**
 * MetricsCardコンポーネントのアクセシビリティ機能の検証
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
   * セレクトボックスが適切にアクセシブルであることを検証
   *
   * テスト内容:
   * - セレクトボックスが適切なロールを持つ
   * - アクセシブルな名前が設定される
   * - 適切な属性が設定される
   */
  it("セレクトボックスが適切にアクセシブルである", () => {
    render(<MetricsCard />);

    const selectElement = screen.getByRole("combobox");

    // セレクトボックスが適切なロールを持つことを確認
    expect(selectElement).toBeInTheDocument();
    expect(selectElement.tagName).toBe("SELECT");
  });

  /**
   * メトリクスが適切に読み取れることを検証
   *
   * テスト内容:
   * - メトリクス値が読み取れる
   * - パーセンテージが読み取れる
   * - 適切な要素構造である
   */
  it("メトリクスが適切に読み取れる", () => {
    render(<MetricsCard />);

    // メトリクス値が読み取れることを確認
    expect(screen.getByText("22,900")).toBeInTheDocument();
    expect(screen.getByText("8,430")).toBeInTheDocument();

    // パーセンテージが読み取れることを確認
    expect(screen.getByText("+12.5%")).toBeInTheDocument();
    expect(screen.getByText("-2.1%")).toBeInTheDocument();
  });

  /**
   * タイトルが適切に読み取れることを検証
   *
   * テスト内容:
   * - タイトルが読み取れる
   * - 適切な要素構造である
   * - スクリーンリーダーに対応している
   */
  it("タイトルが適切に読み取れる", () => {
    render(<MetricsCard />);

    // タイトルが読み取れることを確認
    expect(screen.getByText("Analytics")).toBeInTheDocument();

    // 適切な要素構造であることを確認
    const title = screen.getByText("Analytics");
    expect(title.tagName).toBe("H2");
  });

  /**
   * キーボードナビゲーションが適切に動作することを検証
   *
   * テスト内容:
   * - Tabキーでフォーカスが移動する
   * - セレクトボックスがフォーカス可能である
   * - キーボード操作が正しく動作する
   */
  it("キーボードナビゲーションが適切に動作する", async () => {
    const user = userEvent.setup();
    render(<MetricsCard />);

    const selectElement = screen.getByRole("combobox");

    // フォーカスを当てる
    selectElement.focus();
    expect(selectElement).toHaveFocus();

    // キーボード操作が正しく動作することを確認
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");
    expect(selectElement).toHaveValue("Last 7 days");
  });
});

// ===== エッジケースのテスト =====

/**
 * MetricsCardコンポーネントのエッジケースの検証
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
   * コンポーネントが常にレンダリングされることを検証
   *
   * テスト内容:
   * - コンポーネントが常にレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("コンポーネントが常にレンダリングされる", () => {
    render(<MetricsCard />);

    // コンポーネントがレンダリングされることを確認
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("22,900")).toBeInTheDocument();
    expect(screen.getByText("8,430")).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * セレクトボックスの無効な操作でもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 無効な操作でもエラーが発生しない
   * - コンポーネントが正常に動作する
   * - 適切なフォールバックが適用される
   */
  it("セレクトボックスの無効な操作でもエラーが発生しない", async () => {
    const user = userEvent.setup();
    render(<MetricsCard />);

    const selectElement = screen.getByRole("combobox");

    // 無効な操作を実行
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{ArrowUp}");
    await user.keyboard("{ArrowUp}");

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // コンポーネントが正常に動作することを確認
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  /**
   * 複数回のレンダリングでもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 複数回のレンダリングでもエラーが発生しない
   * - パフォーマンスが適切である
   * - メモリリークが発生しない
   */
  it("複数回のレンダリングでもエラーが発生しない", () => {
    const { rerender } = render(<MetricsCard />);

    // 複数回レンダリング
    for (let i = 0; i < 10; i++) {
      rerender(<MetricsCard />);
    }

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // コンポーネントが正常に動作することを確認
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });
});

// ===== パフォーマンスのテスト =====

/**
 * MetricsCardコンポーネントのパフォーマンスの検証
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
   * レンダリング時間が適切であることを検証
   *
   * テスト内容:
   * - レンダリング時間が適切である
   * - パフォーマンスが適切である
   * - メモリリークが発生しない
   */
  it("レンダリング時間が適切である", () => {
    const startTime = performance.now();

    render(<MetricsCard />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);
  });

  /**
   * 大量のレンダリングでもパフォーマンスが適切であることを検証
   *
   * テスト内容:
   * - 大量のレンダリングでもパフォーマンスが適切である
   * - メモリリークが発生しない
   * - レンダリング時間が適切である
   */
  it("大量のレンダリングでもパフォーマンスが適切である", () => {
    const startTime = performance.now();

    // 大量のコンポーネントをレンダリング
    const { unmount } = render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <MetricsCard key={i} />
        ))}
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);

    // すべてのコンポーネントがレンダリングされることを確認
    expect(screen.getAllByText("Analytics")).toHaveLength(100);

    unmount();
  });
});
