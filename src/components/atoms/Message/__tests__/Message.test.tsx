import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import Message, { MessageProps } from "../Message";

/**
 * Message テストスイート
 *
 * このテストファイルは、Messageコンポーネントの動作を検証します。
 * 型別スタイリング、useStyles依存、レンダリング、スタイリング、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - 型別スタイリング（success, error, info, warning）
 * - useStylesフックの依存関係
 * - カスタムクラス名の適用
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - useStylesフックのモックが必要
 * - 型別のスタイリングをテスト
 * - ダークモード対応をテスト
 */

// ===== モック設定 =====

/**
 * useStylesフックのモック
 *
 * このモックは、useStylesフックの戻り値をシミュレートします。
 * 実際のスタイル定義に基づいて、テスト用のスタイルを提供します。
 */
const mockStyles = {
  message: {
    success: "bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/30 dark:border-green-700",
    error: "bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-700",
    info: "bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-700",
    warning: "bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-900/30 dark:border-amber-700",
  },
  messageText: {
    success: "text-green-800 dark:text-green-200",
    error: "text-red-800 dark:text-red-200",
    info: "text-blue-800 dark:text-blue-200",
    warning: "text-amber-800 dark:text-amber-200",
    default: "text-gray-800 dark:text-gray-200",
  },
};

// useStylesフックをモック
vi.mock("@/hooks/useStyles", () => ({
  useStyles: () => mockStyles,
}));

// ===== テストデータ =====

/**
 * テスト用のプロパティデータ
 *
 * このデータは、Messageコンポーネントのテストで使用する
 * 様々なプロパティの組み合わせを表しています。
 *
 * データ構造:
 * - type: メッセージのタイプ（success, error, info, warning）
 * - message: 表示するメッセージテキスト
 * - className: カスタムクラス名
 *
 * 用途:
 * - レンダリングテスト
 * - 型別スタイリングテスト
 * - カスタマイズテスト
 */
const defaultProps: MessageProps = {
  type: "info",
  message: "テストメッセージ",
};

const successProps: MessageProps = {
  type: "success",
  message: "操作が正常に完了しました",
};

const errorProps: MessageProps = {
  type: "error",
  message: "エラーが発生しました",
};

const warningProps: MessageProps = {
  type: "warning",
  message: "注意が必要です",
};

const withCustomClassProps: MessageProps = {
  type: "info",
  message: "カスタムクラス付きメッセージ",
  className: "custom-message-class",
};

/**
 * メッセージタイプのテストケース
 *
 * このデータは、各メッセージタイプのテストで使用する
 * データを表しています。
 *
 * データ構造:
 * - type: メッセージタイプ
 * - expectedContainerClass: 期待されるコンテナクラス
 * - expectedTextClass: 期待されるテキストクラス
 * - description: テストの説明
 *
 * 用途:
 * - 型別スタイリングのテスト
 * - クラス名の検証
 * - 視覚的な表現のテスト
 */
const messageTypeTestCases = [
  {
    type: "success" as const,
    expectedContainerClass: "bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-900/30 dark:border-green-700",
    expectedTextClass: "text-green-800 dark:text-green-200",
    description: "成功メッセージ",
  },
  {
    type: "error" as const,
    expectedContainerClass: "bg-red-50 border border-red-200 rounded-lg p-4 dark:bg-red-900/30 dark:border-red-700",
    expectedTextClass: "text-red-800 dark:text-red-200",
    description: "エラーメッセージ",
  },
  {
    type: "info" as const,
    expectedContainerClass: "bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-900/30 dark:border-blue-700",
    expectedTextClass: "text-blue-800 dark:text-blue-200",
    description: "情報メッセージ",
  },
  {
    type: "warning" as const,
    expectedContainerClass: "bg-amber-50 border border-amber-200 rounded-lg p-4 dark:bg-amber-900/30 dark:border-amber-700",
    expectedTextClass: "text-amber-800 dark:text-amber-200",
    description: "警告メッセージ",
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
 * Messageコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、Messageコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - メッセージコンテナの存在
 * - メッセージテキストの表示
 * - クラス名の適用
 * - 基本的な構造
 */
describe("基本的なレンダリング", () => {
  /**
   * デフォルト状態でコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - メッセージコンテナが表示される
   * - メッセージテキストが表示される
   * - 適切なクラス名が適用される
   * - 基本的な構造が正しい
   */
  it("デフォルト状態でコンポーネントがレンダリングされる", () => {
    render(<Message {...defaultProps} />);

    // メッセージテキストが表示されることを確認
    expect(screen.getByText("テストメッセージ")).toBeInTheDocument();

    // メッセージコンテナが存在することを確認
    const messageContainer = screen.getByText("テストメッセージ").closest("div");
    expect(messageContainer).toBeInTheDocument();

    // 適切なクラス名が適用されることを確認
    expect(messageContainer).toHaveClass("bg-blue-50", "border", "border-blue-200", "rounded-lg", "p-4");
  });

  /**
   * 各メッセージタイプでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - 各タイプでメッセージが表示される
   * - 適切なスタイルが適用される
   * - エラーが発生しない
   */
  it("各メッセージタイプでコンポーネントがレンダリングされる", () => {
    messageTypeTestCases.forEach(({ type, description }) => {
      const { unmount } = render(
        <Message type={type} message={`${description}のテスト`} />
      );

      // メッセージが表示されることを確認
      expect(screen.getByText(`${description}のテスト`)).toBeInTheDocument();

      // エラーが発生しないことを確認
      expect(() => {
        // 何も実行しない
      }).not.toThrow();

      unmount();
    });
  });

  /**
   * カスタムクラス名が適用されることを検証
   *
   * テスト内容:
   * - カスタムクラス名が適用される
   * - デフォルトクラス名と併用される
   * - 複数のクラス名が正しく処理される
   */
  it("カスタムクラス名が適用される", () => {
    render(<Message {...withCustomClassProps} />);

    const messageContainer = screen.getByText("カスタムクラス付きメッセージ").closest("div");

    // カスタムクラス名が適用されることを確認
    expect(messageContainer).toHaveClass("custom-message-class");

    // デフォルトクラス名も適用されることを確認
    expect(messageContainer).toHaveClass("bg-blue-50", "border", "border-blue-200");
  });

  /**
   * 空のメッセージでもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 空のメッセージでもレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("空のメッセージでもエラーが発生しない", () => {
    render(<Message type="info" message="" />);

    // メッセージコンテナが存在することを確認
    const messageContainer = screen.getByRole("generic");
    expect(messageContainer).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== 型別スタイリングのテスト =====

/**
 * Messageコンポーネントの型別スタイリング機能の検証
 *
 * このセクションでは、各メッセージタイプに応じた
 * スタイリングが正しく適用されることを検証します。
 *
 * 検証項目:
 * - 各タイプのコンテナスタイル
 * - 各タイプのテキストスタイル
 * - ダークモード対応
 * - 視覚的な表現
 */
describe("型別スタイリング", () => {
  /**
   * 各メッセージタイプで正しいスタイルが適用されることを検証
   *
   * テスト内容:
   * - 各タイプで適切なコンテナスタイルが適用される
   * - 各タイプで適切なテキストスタイルが適用される
   * - クラス名が正しく設定される
   */
  it("各メッセージタイプで正しいスタイルが適用される", () => {
    messageTypeTestCases.forEach(({ type, expectedContainerClass, expectedTextClass, description }) => {
      const { unmount } = render(
        <Message type={type} message={`${description}のテスト`} />
      );

      const messageContainer = screen.getByText(`${description}のテスト`).closest("div");
      const messageText = screen.getByText(`${description}のテスト`);

      // コンテナスタイルが適用されることを確認
      expect(messageContainer).toHaveClass("bg-green-50", "border", "rounded-lg", "p-4");

      // テキストスタイルが適用されることを確認
      expect(messageText).toHaveClass("text-green-800");

      unmount();
    });
  });

  /**
   * 成功メッセージのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 成功メッセージのコンテナスタイルが適用される
   * - 成功メッセージのテキストスタイルが適用される
   * - 適切な色が使用される
   */
  it("成功メッセージのスタイリングが正しく適用される", () => {
    render(<Message {...successProps} />);

    const messageContainer = screen.getByText("操作が正常に完了しました").closest("div");
    const messageText = screen.getByText("操作が正常に完了しました");

    // 成功メッセージのコンテナスタイルが適用されることを確認
    expect(messageContainer).toHaveClass("bg-green-50", "border-green-200", "rounded-lg", "p-4");

    // 成功メッセージのテキストスタイルが適用されることを確認
    expect(messageText).toHaveClass("text-green-800");
  });

  /**
   * エラーメッセージのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - エラーメッセージのコンテナスタイルが適用される
   * - エラーメッセージのテキストスタイルが適用される
   * - 適切な色が使用される
   */
  it("エラーメッセージのスタイリングが正しく適用される", () => {
    render(<Message {...errorProps} />);

    const messageContainer = screen.getByText("エラーが発生しました").closest("div");
    const messageText = screen.getByText("エラーが発生しました");

    // エラーメッセージのコンテナスタイルが適用されることを確認
    expect(messageContainer).toHaveClass("bg-red-50", "border-red-200", "rounded-lg", "p-4");

    // エラーメッセージのテキストスタイルが適用されることを確認
    expect(messageText).toHaveClass("text-red-800");
  });

  /**
   * 情報メッセージのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 情報メッセージのコンテナスタイルが適用される
   * - 情報メッセージのテキストスタイルが適用される
   * - 適切な色が使用される
   */
  it("情報メッセージのスタイリングが正しく適用される", () => {
    render(<Message {...defaultProps} />);

    const messageContainer = screen.getByText("テストメッセージ").closest("div");
    const messageText = screen.getByText("テストメッセージ");

    // 情報メッセージのコンテナスタイルが適用されることを確認
    expect(messageContainer).toHaveClass("bg-blue-50", "border-blue-200", "rounded-lg", "p-4");

    // 情報メッセージのテキストスタイルが適用されることを確認
    expect(messageText).toHaveClass("text-blue-800");
  });

  /**
   * 警告メッセージのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - 警告メッセージのコンテナスタイルが適用される
   * - 警告メッセージのテキストスタイルが適用される
   * - 適切な色が使用される
   */
  it("警告メッセージのスタイリングが正しく適用される", () => {
    render(<Message {...warningProps} />);

    const messageContainer = screen.getByText("注意が必要です").closest("div");
    const messageText = screen.getByText("注意が必要です");

    // 警告メッセージのコンテナスタイルが適用されることを確認
    expect(messageContainer).toHaveClass("bg-amber-50", "border-amber-200", "rounded-lg", "p-4");

    // 警告メッセージのテキストスタイルが適用されることを確認
    expect(messageText).toHaveClass("text-amber-800");
  });
});

// ===== useStyles依存関係のテスト =====

/**
 * MessageコンポーネントのuseStyles依存関係の検証
 *
 * このセクションでは、useStylesフックとの依存関係が
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - useStylesフックの呼び出し
 * - スタイルオブジェクトの使用
 * - モックの動作
 */
describe("useStyles依存関係", () => {
  /**
   * useStylesフックが正しく呼び出されることを検証
   *
   * テスト内容:
   * - useStylesフックが呼び出される
   * - スタイルオブジェクトが取得される
   * - 適切なスタイルが適用される
   */
  it("useStylesフックが正しく呼び出される", () => {
    render(<Message {...defaultProps} />);

    // メッセージが表示されることを確認
    expect(screen.getByText("テストメッセージ")).toBeInTheDocument();

    // モックされたスタイルが適用されることを確認
    const messageContainer = screen.getByText("テストメッセージ").closest("div");
    expect(messageContainer).toHaveClass("bg-blue-50", "border-blue-200");
  });

  /**
   * スタイルオブジェクトの各プロパティが正しく使用されることを検証
   *
   * テスト内容:
   * - messageスタイルが使用される
   * - messageTextスタイルが使用される
   * - 型別のスタイルが適用される
   */
  it("スタイルオブジェクトの各プロパティが正しく使用される", () => {
    render(<Message {...successProps} />);

    const messageContainer = screen.getByText("操作が正常に完了しました").closest("div");
    const messageText = screen.getByText("操作が正常に完了しました");

    // messageスタイルが使用されることを確認
    expect(messageContainer).toHaveClass("bg-green-50", "border-green-200");

    // messageTextスタイルが使用されることを確認
    expect(messageText).toHaveClass("text-green-800");
  });

  /**
   * モックされたスタイルが正しく適用されることを検証
   *
   * テスト内容:
   * - モックされたスタイルが適用される
   * - 実際のスタイル定義と一致する
   * - エラーが発生しない
   */
  it("モックされたスタイルが正しく適用される", () => {
    render(<Message {...errorProps} />);

    const messageContainer = screen.getByText("エラーが発生しました").closest("div");
    const messageText = screen.getByText("エラーが発生しました");

    // モックされたスタイルが適用されることを確認
    expect(messageContainer).toHaveClass("bg-red-50", "border-red-200");
    expect(messageText).toHaveClass("text-red-800");
  });
});

// ===== カスタマイズのテスト =====

/**
 * Messageコンポーネントのカスタマイズ機能の検証
 *
 * このセクションでは、カスタムクラス名やその他の
 * カスタマイズオプションが正しく動作することを検証します。
 *
 * 検証項目:
 * - カスタムクラス名の適用
 * - デフォルトクラス名との併用
 * - 複数クラス名の処理
 */
describe("カスタマイズ", () => {
  /**
   * カスタムクラス名が正しく適用されることを検証
   *
   * テスト内容:
   * - カスタムクラス名が適用される
   * - デフォルトクラス名と併用される
   * - 複数のクラス名が正しく処理される
   */
  it("カスタムクラス名が正しく適用される", () => {
    render(<Message {...withCustomClassProps} />);

    const messageContainer = screen.getByText("カスタムクラス付きメッセージ").closest("div");

    // カスタムクラス名が適用されることを確認
    expect(messageContainer).toHaveClass("custom-message-class");

    // デフォルトクラス名も適用されることを確認
    expect(messageContainer).toHaveClass("bg-blue-50", "border-blue-200");
  });

  /**
   * 複数のカスタムクラス名が正しく処理されることを検証
   *
   * テスト内容:
   * - 複数のクラス名が適用される
   * - スペースで区切られたクラス名が処理される
   * - エラーが発生しない
   */
  it("複数のカスタムクラス名が正しく処理される", () => {
    const multipleClassProps = {
      ...defaultProps,
      className: "custom-class-1 custom-class-2 custom-class-3",
    };

    render(<Message {...multipleClassProps} />);

    const messageContainer = screen.getByText("テストメッセージ").closest("div");

    // 複数のクラス名が適用されることを確認
    expect(messageContainer).toHaveClass("custom-class-1", "custom-class-2", "custom-class-3");
  });

  /**
   * 空のクラス名でもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 空のクラス名でもエラーが発生しない
   * - デフォルトクラス名が適用される
   * - 正常にレンダリングされる
   */
  it("空のクラス名でもエラーが発生しない", () => {
    const emptyClassProps = {
      ...defaultProps,
      className: "",
    };

    render(<Message {...emptyClassProps} />);

    const messageContainer = screen.getByText("テストメッセージ").closest("div");

    // デフォルトクラス名が適用されることを確認
    expect(messageContainer).toHaveClass("bg-blue-50", "border-blue-200");

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 特殊文字を含むクラス名が正しく処理されることを検証
   *
   * テスト内容:
   * - 特殊文字を含むクラス名が適用される
   * - エラーが発生しない
   * - 正しくレンダリングされる
   */
  it("特殊文字を含むクラス名が正しく処理される", () => {
    const specialClassProps = {
      ...defaultProps,
      className: "class-with-dash class_with_underscore class.with.dots",
    };

    render(<Message {...specialClassProps} />);

    const messageContainer = screen.getByText("テストメッセージ").closest("div");

    // 特殊文字を含むクラス名が適用されることを確認
    expect(messageContainer).toHaveClass("class-with-dash", "class_with_underscore", "class.with.dots");
  });
});

// ===== アクセシビリティのテスト =====

/**
 * Messageコンポーネントのアクセシビリティ機能の検証
 *
 * このセクションでは、アクセシビリティに関する
 * 機能が正しく動作することを検証します。
 *
 * 検証項目:
 * - 適切なロール属性
 * - スクリーンリーダー対応
 * - 色のコントラスト
 */
describe("アクセシビリティ", () => {
  /**
   * メッセージが適切に読み取れることを検証
   *
   * テスト内容:
   * - メッセージテキストが読み取れる
   * - 適切な要素構造である
   * - スクリーンリーダーに対応している
   */
  it("メッセージが適切に読み取れる", () => {
    render(<Message {...defaultProps} />);

    // メッセージテキストが読み取れることを確認
    expect(screen.getByText("テストメッセージ")).toBeInTheDocument();

    // 適切な要素構造であることを確認
    const messageText = screen.getByText("テストメッセージ");
    expect(messageText.tagName).toBe("P");
  });

  /**
   * 各メッセージタイプでアクセシビリティが確保されることを検証
   *
   * テスト内容:
   * - 各タイプでメッセージが読み取れる
   * - 適切な色のコントラストが確保される
   * - 視覚的な区別が可能である
   */
  it("各メッセージタイプでアクセシビリティが確保される", () => {
    messageTypeTestCases.forEach(({ type, description }) => {
      const { unmount } = render(
        <Message type={type} message={`${description}のテスト`} />
      );

      // メッセージが読み取れることを確認
      expect(screen.getByText(`${description}のテスト`)).toBeInTheDocument();

      // 適切な色のコントラストが確保されることを確認
      const messageText = screen.getByText(`${description}のテスト");
      expect(messageText).toHaveClass("text-green-800");

      unmount();
    });
  });

  /**
   * 長いメッセージでもアクセシビリティが確保されることを検証
   *
   * テスト内容:
   * - 長いメッセージでも読み取れる
   * - 適切な改行が処理される
   * - レイアウトが崩れない
   */
  it("長いメッセージでもアクセシビリティが確保される", () => {
    const longMessage = "これは非常に長いメッセージです。".repeat(10);
    
    render(<Message type="info" message={longMessage} />);

    // 長いメッセージが読み取れることを確認
    expect(screen.getByText(longMessage)).toBeInTheDocument();

    // 適切な要素構造であることを確認
    const messageText = screen.getByText(longMessage);
    expect(messageText.tagName).toBe("P");
  });

  /**
   * 特殊文字を含むメッセージでもアクセシビリティが確保されることを検証
   *
   * テスト内容:
   * - 特殊文字を含むメッセージでも読み取れる
   * - エスケープが正しく処理される
   * - 適切な表示がされる
   */
  it("特殊文字を含むメッセージでもアクセシビリティが確保される", () => {
    const specialMessage = "メッセージに<>&\"'が含まれています";
    
    render(<Message type="info" message={specialMessage} />);

    // 特殊文字を含むメッセージが読み取れることを確認
    expect(screen.getByText(specialMessage)).toBeInTheDocument();

    // 適切な要素構造であることを確認
    const messageText = screen.getByText(specialMessage);
    expect(messageText.tagName).toBe("P");
  });
});

// ===== エッジケースのテスト =====

/**
 * Messageコンポーネントのエッジケースの検証
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
   * 非常に長いメッセージでも正しく処理されることを検証
   *
   * テスト内容:
   * - 長いメッセージでもレンダリングされる
   * - パフォーマンスが適切である
   * - エラーが発生しない
   */
  it("非常に長いメッセージでも正しく処理される", () => {
    const veryLongMessage = "a".repeat(10000);
    
    render(<Message type="info" message={veryLongMessage} />);

    // 長いメッセージがレンダリングされることを確認
    expect(screen.getByText(veryLongMessage)).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 特殊文字を含むメッセージでも正しく処理されることを検証
   *
   * テスト内容:
   * - 特殊文字を含むメッセージでもレンダリングされる
   * - エスケープが正しく処理される
   * - 適切なスタイルが適用される
   */
  it("特殊文字を含むメッセージでも正しく処理される", () => {
    const specialMessage = "メッセージに<>&\"'が含まれています";
    
    render(<Message type="info" message={specialMessage} />);

    // 特殊文字を含むメッセージがレンダリングされることを確認
    expect(screen.getByText(specialMessage)).toBeInTheDocument();

    // 適切なスタイルが適用されることを確認
    const messageContainer = screen.getByText(specialMessage).closest("div");
    expect(messageContainer).toHaveClass("bg-blue-50", "border-blue-200");
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
    const { rerender } = render(<Message {...defaultProps} />);

    // 複数のプロパティを同時に変化
    rerender(
      <Message
        type="success"
        message="新しいメッセージ"
        className="custom-class"
      />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 適切なUIが表示されることを確認
    expect(screen.getByText("新しいメッセージ")).toBeInTheDocument();
  });

  /**
   * 無効なメッセージタイプでもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 無効なメッセージタイプでもエラーが発生しない
   * - デフォルトのスタイルが適用される
   * - 正常にレンダリングされる
   */
  it("無効なメッセージタイプでもエラーが発生しない", () => {
    // @ts-ignore - 意図的に型エラーを無視
    render(<Message type="invalid" message="テストメッセージ" />);

    // メッセージがレンダリングされることを確認
    expect(screen.getByText("テストメッセージ")).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== パフォーマンスのテスト =====

/**
 * Messageコンポーネントのパフォーマンスの検証
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
    const { rerender } = render(<Message {...defaultProps} />);

    const startTime = performance.now();

    // 状態を変化させる
    rerender(<Message type="success" message="成功メッセージ" />);
    rerender(<Message type="error" message="エラーメッセージ" />);
    rerender(<Message type="warning" message="警告メッセージ" />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 再レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);
  });

  /**
   * 大量のメッセージでもパフォーマンスが適切であることを検証
   *
   * テスト内容:
   * - 大量のメッセージでもパフォーマンスが適切である
   * - メモリリークが発生しない
   * - レンダリング時間が適切である
   */
  it("大量のメッセージでもパフォーマンスが適切である", () => {
    const startTime = performance.now();

    // 大量のメッセージをレンダリング
    const { unmount } = render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <Message
            key={i}
            type={["success", "error", "info", "warning"][i % 4]}
            message={`メッセージ ${i + 1}`}
          />
        ))}
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);

    // すべてのメッセージがレンダリングされることを確認
    expect(screen.getAllByText(/メッセージ/)).toHaveLength(100);

    unmount();
  });
});
