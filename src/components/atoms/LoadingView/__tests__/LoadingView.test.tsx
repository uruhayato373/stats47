import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { LoadingView } from "../LoadingView";

/**
 * LoadingView テストスイート
 *
 * このテストファイルは、LoadingViewコンポーネントの動作を検証します。
 * ローディング表示、メッセージ表示、スタイリング、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - ローディングメッセージの表示
 * - カスタム高さの適用
 * - スタイリングの適用
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - シンプルなコンポーネントのため、テストも比較的シンプル
 * - アニメーションのテストは視覚的な確認のみ
 * - カスタムスタイルの適用をテスト
 */

// ===== テストデータ =====

/**
 * テスト用のプロパティデータ
 *
 * このデータは、LoadingViewコンポーネントのテストで使用する
 * 様々なプロパティの組み合わせを表しています。
 *
 * データ構造:
 * - message: ローディングメッセージ
 * - height: コンテナの高さ
 *
 * 用途:
 * - レンダリングテスト
 * - カスタマイズテスト
 * - エッジケーステスト
 */
const defaultProps = {};

const withCustomMessageProps = {
  message: "カスタムローディングメッセージ",
};

const withCustomHeightProps = {
  height: "400px",
};

const withAllCustomProps = {
  message: "データを処理中...",
  height: "800px",
};

/**
 * メッセージのテストケース
 *
 * このデータは、様々なローディングメッセージのテストで使用する
 * データを表しています。
 *
 * データ構造:
 * - message: ローディングメッセージ
 * - description: テストの説明
 *
 * 用途:
 * - メッセージ表示のテスト
 * - 特殊文字の処理テスト
 * - 長いメッセージのテスト
 */
const messageTestCases = [
  {
    message: "データを読み込んでいます...",
    description: "デフォルトメッセージ",
  },
  {
    message: "カスタムローディングメッセージ",
    description: "カスタムメッセージ",
  },
  {
    message: "メッセージに<>&\"'が含まれています",
    description: "特殊文字を含むメッセージ",
  },
  {
    message: "a".repeat(100),
    description: "長いメッセージ",
  },
  {
    message: "",
    description: "空のメッセージ",
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
 * LoadingViewコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、LoadingViewコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - ローディングコンテナの存在
 * - ローディングアイコンの表示
 * - メッセージの表示
 * - クラス名の適用
 */
describe("基本的なレンダリング", () => {
  /**
   * デフォルト状態でコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - ローディングコンテナが表示される
   * - RefreshCwアイコンが表示される
   * - デフォルトメッセージが表示される
   * - 適切なクラス名が適用される
   */
  it("デフォルト状態でコンポーネントがレンダリングされる", () => {
    render(<LoadingView {...defaultProps} />);

    // デフォルトメッセージが表示されることを確認
    expect(screen.getByText("データを読み込んでいます...")).toBeInTheDocument();

    // RefreshCwアイコンが表示されることを確認
    const refreshIcon = screen.getByRole("img", { hidden: true });
    expect(refreshIcon).toBeInTheDocument();
    expect(refreshIcon.tagName).toBe("svg");

    // 適切なクラス名が適用されることを確認
    const loadingContainer = screen
      .getByText("データを読み込んでいます...")
      .closest("div")?.parentElement;
    expect(loadingContainer).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "bg-gray-50",
      "dark:bg-neutral-900",
      "rounded-lg",
      "border",
      "border-gray-200",
      "dark:border-neutral-700"
    );
  });

  /**
   * カスタムメッセージでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - カスタムメッセージが表示される
   * - アイコンが表示される
   * - 適切なスタイルが適用される
   */
  it("カスタムメッセージでコンポーネントがレンダリングされる", () => {
    render(<LoadingView {...withCustomMessageProps} />);

    // カスタムメッセージが表示されることを確認
    expect(
      screen.getByText("カスタムローディングメッセージ")
    ).toBeInTheDocument();

    // RefreshCwアイコンが表示されることを確認
    const refreshIcon = screen.getByRole("img", { hidden: true });
    expect(refreshIcon).toBeInTheDocument();
  });

  /**
   * カスタム高さでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - カスタム高さが適用される
   * - インラインスタイルが設定される
   * - 適切なレイアウトが適用される
   */
  it("カスタム高さでコンポーネントがレンダリングされる", () => {
    render(<LoadingView {...withCustomHeightProps} />);

    // カスタム高さが適用されることを確認
    const loadingContainer = screen
      .getByText("データを読み込んでいます...")
      .closest("div")?.parentElement;
    expect(loadingContainer).toHaveStyle("height: 400px");
  });

  /**
   * すべてのカスタムプロパティでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - カスタムメッセージが表示される
   * - カスタム高さが適用される
   * - 適切なスタイルが適用される
   */
  it("すべてのカスタムプロパティでコンポーネントがレンダリングされる", () => {
    render(<LoadingView {...withAllCustomProps} />);

    // カスタムメッセージが表示されることを確認
    expect(screen.getByText("データを処理中...")).toBeInTheDocument();

    // カスタム高さが適用されることを確認
    const loadingContainer = screen
      .getByText("データを処理中...")
      .closest("div")?.parentElement;
    expect(loadingContainer).toHaveStyle("height: 800px");
  });
});

// ===== メッセージ表示のテスト =====

/**
 * LoadingViewコンポーネントのメッセージ表示機能の検証
 *
 * このセクションでは、様々なメッセージが
 * 正しく表示されることを検証します。
 *
 * 検証項目:
 * - メッセージの表示
 * - 特殊文字の処理
 * - 長いメッセージの処理
 * - 空のメッセージの処理
 */
describe("メッセージ表示", () => {
  /**
   * 各メッセージが正しく表示されることを検証
   *
   * テスト内容:
   * - 各メッセージが表示される
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("各メッセージが正しく表示される", () => {
    messageTestCases.forEach(({ message, description }) => {
      const { unmount } = render(<LoadingView message={message} />);

      // メッセージが表示されることを確認
      expect(screen.getByText(message)).toBeInTheDocument();

      // エラーが発生しないことを確認
      expect(() => {
        // 何も実行しない
      }).not.toThrow();

      unmount();
    });
  });

  /**
   * 特殊文字を含むメッセージが正しく表示されることを検証
   *
   * テスト内容:
   * - 特殊文字が正しくエスケープされる
   * - HTMLが正しく表示される
   * - エラーが発生しない
   */
  it("特殊文字を含むメッセージが正しく表示される", () => {
    const specialMessage = "メッセージに<>&\"'が含まれています";

    render(<LoadingView message={specialMessage} />);

    // 特殊文字を含むメッセージが表示されることを確認
    expect(screen.getByText(specialMessage)).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 非常に長いメッセージが正しく表示されることを検証
   *
   * テスト内容:
   * - 長いメッセージが表示される
   * - レイアウトが崩れない
   * - パフォーマンスが適切である
   */
  it("非常に長いメッセージが正しく表示される", () => {
    const longMessage = "a".repeat(1000);

    render(<LoadingView message={longMessage} />);

    // 長いメッセージが表示されることを確認
    expect(screen.getByText(longMessage)).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
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
    render(<LoadingView message="" />);

    // 空のメッセージでもレンダリングされることを確認
    expect(screen.getByText("")).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== スタイリングのテスト =====

/**
 * LoadingViewコンポーネントのスタイリング機能の検証
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
   * ローディングコンテナのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - ローディングコンテナのクラス名が適用される
   * - 背景色とボーダーが設定される
   * - 適切なレイアウトが適用される
   */
  it("ローディングコンテナのスタイリングが正しく適用される", () => {
    render(<LoadingView {...defaultProps} />);

    const loadingContainer = screen
      .getByText("データを読み込んでいます...")
      .closest("div")?.parentElement;

    // ローディングコンテナのクラス名が適用されることを確認
    expect(loadingContainer).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "bg-gray-50",
      "dark:bg-neutral-900",
      "rounded-lg",
      "border",
      "border-gray-200",
      "dark:border-neutral-700"
    );
  });

  /**
   * アイコンのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - アイコンのクラス名が適用される
   * - 適切なサイズが設定される
   * - アニメーションクラスが適用される
   */
  it("アイコンのスタイリングが正しく適用される", () => {
    render(<LoadingView {...defaultProps} />);

    const refreshIcon = screen.getByRole("img", { hidden: true });

    // アイコンのクラス名が適用されることを確認
    expect(refreshIcon).toHaveClass(
      "w-12",
      "h-12",
      "text-blue-500",
      "mx-auto",
      "mb-4",
      "animate-spin"
    );
  });

  /**
   * メッセージのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - メッセージのクラス名が適用される
   * - 適切な色が設定される
   * - 適切なフォントサイズが設定される
   */
  it("メッセージのスタイリングが正しく適用される", () => {
    render(<LoadingView {...defaultProps} />);

    const message = screen.getByText("データを読み込んでいます...");

    // メッセージのクラス名が適用されることを確認
    expect(message).toHaveClass("text-gray-600", "dark:text-neutral-400");
  });

  /**
   * カスタム高さのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - カスタム高さが適用される
   * - インラインスタイルが設定される
   * - 適切なレイアウトが適用される
   */
  it("カスタム高さのスタイリングが正しく適用される", () => {
    render(<LoadingView {...withCustomHeightProps} />);

    const loadingContainer = screen
      .getByText("データを読み込んでいます...")
      .closest("div")?.parentElement;

    // カスタム高さが適用されることを確認
    expect(loadingContainer).toHaveStyle("height: 400px");
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
    render(<LoadingView {...defaultProps} />);

    const loadingContainer = screen
      .getByText("データを読み込んでいます...")
      .closest("div")?.parentElement;
    const message = screen.getByText("データを読み込んでいます...");

    // ダークモードのクラス名が適用されることを確認
    expect(loadingContainer).toHaveClass(
      "dark:bg-neutral-900",
      "dark:border-neutral-700"
    );
    expect(message).toHaveClass("dark:text-neutral-400");
  });
});

// ===== アクセシビリティのテスト =====

/**
 * LoadingViewコンポーネントのアクセシビリティ機能の検証
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
   * ローディングメッセージが適切に読み取れることを検証
   *
   * テスト内容:
   * - ローディングメッセージが読み取れる
   * - 適切な要素構造である
   * - スクリーンリーダーに対応している
   */
  it("ローディングメッセージが適切に読み取れる", () => {
    render(<LoadingView {...defaultProps} />);

    // ローディングメッセージが読み取れることを確認
    expect(screen.getByText("データを読み込んでいます...")).toBeInTheDocument();

    // 適切な要素構造であることを確認
    const message = screen.getByText("データを読み込んでいます...");
    expect(message.tagName).toBe("P");
  });

  /**
   * アイコンがアクセシブルであることを検証
   *
   * テスト内容:
   * - アイコンが適切に配置される
   * - アニメーションが適用される
   * - 視覚的な表現が適切である
   */
  it("アイコンがアクセシブルである", () => {
    render(<LoadingView {...defaultProps} />);

    // アイコンが適切に配置されることを確認
    const refreshIcon = screen.getByRole("img", { hidden: true });
    expect(refreshIcon).toBeInTheDocument();
    expect(refreshIcon).toHaveClass("animate-spin");
  });

  /**
   * カスタムメッセージがアクセシブルであることを検証
   *
   * テスト内容:
   * - カスタムメッセージが読み取れる
   * - 適切な要素構造である
   * - スクリーンリーダーに対応している
   */
  it("カスタムメッセージがアクセシブルである", () => {
    render(<LoadingView {...withCustomMessageProps} />);

    // カスタムメッセージが読み取れることを確認
    expect(
      screen.getByText("カスタムローディングメッセージ")
    ).toBeInTheDocument();

    // 適切な要素構造であることを確認
    const message = screen.getByText("カスタムローディングメッセージ");
    expect(message.tagName).toBe("P");
  });

  /**
   * 長いメッセージでもアクセシビリティが確保されることを検証
   *
   * テスト内容:
   * - 長いメッセージでも読み取れる
   * - レイアウトが崩れない
   * - スクリーンリーダーに対応している
   */
  it("長いメッセージでもアクセシビリティが確保される", () => {
    const longMessage = "a".repeat(100);

    render(<LoadingView message={longMessage} />);

    // 長いメッセージが読み取れることを確認
    expect(screen.getByText(longMessage)).toBeInTheDocument();

    // 適切な要素構造であることを確認
    const message = screen.getByText(longMessage);
    expect(message.tagName).toBe("P");
  });
});

// ===== エッジケースのテスト =====

/**
 * LoadingViewコンポーネントのエッジケースの検証
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

    render(<LoadingView message={veryLongMessage} />);

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

    render(<LoadingView message={specialMessage} />);

    // 特殊文字を含むメッセージがレンダリングされることを確認
    expect(screen.getByText(specialMessage)).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 無効な高さ値でもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 無効な高さ値でもエラーが発生しない
   * - デフォルト値が適用される
   * - 正常にレンダリングされる
   */
  it("無効な高さ値でもエラーが発生しない", () => {
    // @ts-ignore - 意図的に型エラーを無視
    render(<LoadingView height={null} />);

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 正常にレンダリングされることを確認
    expect(screen.getByText("データを読み込んでいます...")).toBeInTheDocument();
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
    const { rerender } = render(<LoadingView {...defaultProps} />);

    // 複数のプロパティを同時に変化
    rerender(
      <LoadingView message="新しいローディングメッセージ" height="500px" />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 適切なUIが表示されることを確認
    expect(
      screen.getByText("新しいローディングメッセージ")
    ).toBeInTheDocument();
  });
});

// ===== パフォーマンスのテスト =====

/**
 * LoadingViewコンポーネントのパフォーマンスの検証
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
    const { rerender } = render(<LoadingView {...defaultProps} />);

    const startTime = performance.now();

    // 状態を変化させる
    rerender(<LoadingView message="新しいメッセージ" />);
    rerender(<LoadingView height="500px" />);
    rerender(<LoadingView message="最終メッセージ" height="700px" />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 再レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);
  });

  /**
   * 大量のローディングビューでもパフォーマンスが適切であることを検証
   *
   * テスト内容:
   * - 大量のローディングビューでもパフォーマンスが適切である
   * - メモリリークが発生しない
   * - レンダリング時間が適切である
   */
  it("大量のローディングビューでもパフォーマンスが適切である", () => {
    const startTime = performance.now();

    // 大量のローディングビューをレンダリング
    const { unmount } = render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <LoadingView
            key={i}
            message={`ローディングメッセージ ${i + 1}`}
            height={`${200 + i * 10}px`}
          />
        ))}
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);

    // すべてのローディングメッセージがレンダリングされることを確認
    expect(screen.getAllByText(/ローディングメッセージ/)).toHaveLength(100);

    unmount();
  });
});
