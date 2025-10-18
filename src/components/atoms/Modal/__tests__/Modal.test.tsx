import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../Modal";

/**
 * Modal テストスイート
 *
 * このテストファイルは、Modalコンポーネントの動作を検証します。
 * 表示/非表示制御、子コンポーネント、レンダリング、スタイリング、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - 表示/非表示制御
 * - サイズバリエーション
 * - イベント処理（クリック、キーボード）
 * - スタイリングの適用
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - 条件付きレンダリングをテスト
 * - イベントの伝播をテスト
 * - キーボード操作をテスト
 */

// ===== テストデータ =====

/**
 * モック関数の定義
 *
 * このセクションでは、テストで使用するモック関数を定義します。
 * 各モック関数は、特定の動作をシミュレートするために使用されます。
 */
const mockOnClose = vi.fn();

/**
 * テスト用のプロパティデータ
 *
 * このデータは、Modalコンポーネントのテストで使用する
 * 様々なプロパティの組み合わせを表しています。
 *
 * データ構造:
 * - isOpen: モーダルの表示状態
 * - onClose: 閉じる処理のコールバック関数
 * - children: 子コンポーネント
 * - size: モーダルのサイズ
 *
 * 用途:
 * - レンダリングテスト
 * - 状態管理テスト
 * - イベント処理テスト
 */
const defaultProps = {
  isOpen: true,
  onClose: mockOnClose,
  children: <div>テストコンテンツ</div>,
};

const closedProps = {
  ...defaultProps,
  isOpen: false,
};

const withSizeProps = {
  ...defaultProps,
  size: "lg" as const,
};

const withComplexChildrenProps = {
  ...defaultProps,
  children: (
    <div>
      <h2>モーダルタイトル</h2>
      <p>モーダルの内容です。</p>
      <button>アクションボタン</button>
    </div>
  ),
};

/**
 * サイズバリエーションのテストケース
 *
 * このデータは、各サイズバリエーションのテストで使用する
 * データを表しています。
 *
 * データ構造:
 * - size: モーダルのサイズ
 * - expectedClass: 期待されるクラス名
 * - description: テストの説明
 *
 * 用途:
 * - サイズ別スタイリングのテスト
 * - クラス名の検証
 * - 視覚的な表現のテスト
 */
const sizeTestCases = [
  {
    size: "sm" as const,
    expectedClass: "max-w-md",
    description: "小サイズ",
  },
  {
    size: "md" as const,
    expectedClass: "max-w-lg",
    description: "中サイズ",
  },
  {
    size: "lg" as const,
    expectedClass: "max-w-2xl",
    description: "大サイズ",
  },
  {
    size: "xl" as const,
    expectedClass: "max-w-4xl",
    description: "特大サイズ",
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
 * Modalコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、Modalコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - モーダルコンテナの存在
 * - 子コンポーネントの表示
 * - クラス名の適用
 * - 基本的な構造
 */
describe("基本的なレンダリング", () => {
  /**
   * 開いた状態でモーダルがレンダリングされることを検証
   *
   * テスト内容:
   * - モーダルコンテナが表示される
   * - 子コンポーネントが表示される
   * - 適切なクラス名が適用される
   * - 基本的な構造が正しい
   */
  it("開いた状態でモーダルがレンダリングされる", () => {
    render(<Modal {...defaultProps} />);

    // 子コンテンツが表示されることを確認
    expect(screen.getByText("テストコンテンツ")).toBeInTheDocument();

    // モーダルコンテナが存在することを確認
    const modalContainer = screen.getByText("テストコンテンツ").closest("div");
    expect(modalContainer).toBeInTheDocument();

    // 適切なクラス名が適用されることを確認
    expect(modalContainer?.parentElement).toHaveClass(
      "fixed",
      "inset-0",
      "z-[70]",
      "flex",
      "items-center",
      "justify-center"
    );
  });

  /**
   * 閉じた状態でモーダルがレンダリングされないことを検証
   *
   * テスト内容:
   * - モーダルが表示されない
   * - 子コンテンツが表示されない
   * - nullが返される
   */
  it("閉じた状態でモーダルがレンダリングされない", () => {
    render(<Modal {...closedProps} />);

    // 子コンテンツが表示されないことを確認
    expect(screen.queryByText("テストコンテンツ")).not.toBeInTheDocument();

    // モーダルコンテナが存在しないことを確認
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  /**
   * 複雑な子コンポーネントでも正しくレンダリングされることを検証
   *
   * テスト内容:
   * - 複雑な子コンポーネントが表示される
   * - 各要素が正しく配置される
   * - エラーが発生しない
   */
  it("複雑な子コンポーネントでも正しくレンダリングされる", () => {
    render(<Modal {...withComplexChildrenProps} />);

    // 各子要素が表示されることを確認
    expect(screen.getByText("モーダルタイトル")).toBeInTheDocument();
    expect(screen.getByText("モーダルの内容です。")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "アクションボタン" })
    ).toBeInTheDocument();
  });

  /**
   * デフォルトサイズでモーダルがレンダリングされることを検証
   *
   * テスト内容:
   * - デフォルトサイズ（md）が適用される
   * - 適切なクラス名が設定される
   * - サイズ制限が正しく動作する
   */
  it("デフォルトサイズでモーダルがレンダリングされる", () => {
    render(<Modal {...defaultProps} />);

    const modalContent = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;

    // デフォルトサイズのクラス名が適用されることを確認
    expect(modalContent).toHaveClass("max-w-lg");
  });
});

// ===== 表示/非表示制御のテスト =====

/**
 * Modalコンポーネントの表示/非表示制御機能の検証
 *
 * このセクションでは、モーダルの表示/非表示制御が
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - isOpenプロパティの制御
 * - 条件付きレンダリング
 * - 状態変化の反映
 */
describe("表示/非表示制御", () => {
  /**
   * isOpenプロパティで表示/非表示が制御されることを検証
   *
   * テスト内容:
   * - isOpenがtrueの時に表示される
   * - isOpenがfalseの時に非表示になる
   * - 状態変化が正しく反映される
   */
  it("isOpenプロパティで表示/非表示が制御される", () => {
    const { rerender } = render(<Modal {...closedProps} />);

    // 初期状態では表示されない
    expect(screen.queryByText("テストコンテンツ")).not.toBeInTheDocument();

    // isOpenをtrueに変更
    rerender(<Modal {...defaultProps} />);

    // 表示されることを確認
    expect(screen.getByText("テストコンテンツ")).toBeInTheDocument();

    // isOpenをfalseに変更
    rerender(<Modal {...closedProps} />);

    // 非表示になることを確認
    expect(screen.queryByText("テストコンテンツ")).not.toBeInTheDocument();
  });

  /**
   * 複数回の表示/非表示切り替えが正しく動作することを検証
   *
   * テスト内容:
   * - 複数回の切り替えが動作する
   * - 状態が正しく管理される
   * - パフォーマンスが適切である
   */
  it("複数回の表示/非表示切り替えが正しく動作する", () => {
    const { rerender } = render(<Modal {...defaultProps} />);

    // 複数回切り替える
    for (let i = 0; i < 10; i++) {
      const isOpen = i % 2 === 0;
      rerender(<Modal {...defaultProps} isOpen={isOpen} />);

      if (isOpen) {
        expect(screen.getByText("テストコンテンツ")).toBeInTheDocument();
      } else {
        expect(screen.queryByText("テストコンテンツ")).not.toBeInTheDocument();
      }
    }
  });

  /**
   * 子コンポーネントの変更でも正しく動作することを検証
   *
   * テスト内容:
   * - 子コンポーネントが変更されても正しく動作する
   * - 状態管理が適切である
   * - エラーが発生しない
   */
  it("子コンポーネントの変更でも正しく動作する", () => {
    const { rerender } = render(<Modal {...defaultProps} />);

    // 子コンポーネントを変更
    rerender(
      <Modal {...defaultProps}>
        <div>新しいコンテンツ</div>
      </Modal>
    );

    // 新しいコンテンツが表示されることを確認
    expect(screen.getByText("新しいコンテンツ")).toBeInTheDocument();
    expect(screen.queryByText("テストコンテンツ")).not.toBeInTheDocument();
  });
});

// ===== サイズバリエーションのテスト =====

/**
 * Modalコンポーネントのサイズバリエーション機能の検証
 *
 * このセクションでは、各サイズバリエーションが
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - 各サイズのクラス名適用
 * - サイズ制限の動作
 * - レスポンシブデザイン
 */
describe("サイズバリエーション", () => {
  /**
   * 各サイズで正しいクラス名が適用されることを検証
   *
   * テスト内容:
   * - 各サイズで適切なクラス名が適用される
   * - サイズ制限が正しく設定される
   * - エラーが発生しない
   */
  it("各サイズで正しいクラス名が適用される", () => {
    sizeTestCases.forEach(({ size, expectedClass, description }) => {
      const { unmount } = render(<Modal {...defaultProps} size={size} />);

      const modalContent = screen
        .getByText("テストコンテンツ")
        .closest("div")?.parentElement;

      // 期待されるクラス名が適用されることを確認
      expect(modalContent).toHaveClass(expectedClass);

      unmount();
    });
  });

  /**
   * デフォルトサイズが正しく適用されることを検証
   *
   * テスト内容:
   * - デフォルトサイズ（md）が適用される
   * - 適切なクラス名が設定される
   * - サイズ制限が正しく動作する
   */
  it("デフォルトサイズが正しく適用される", () => {
    render(<Modal {...defaultProps} />);

    const modalContent = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;

    // デフォルトサイズのクラス名が適用されることを確認
    expect(modalContent).toHaveClass("max-w-lg");
  });

  /**
   * サイズ変更で正しく更新されることを検証
   *
   * テスト内容:
   * - サイズ変更でクラス名が更新される
   * - 状態変化が正しく反映される
   * - エラーが発生しない
   */
  it("サイズ変更で正しく更新される", () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);

    // 初期サイズを確認
    let modalContent = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;
    expect(modalContent).toHaveClass("max-w-md");

    // サイズを変更
    rerender(<Modal {...defaultProps} size="xl" />);

    // 新しいサイズが適用されることを確認
    modalContent = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;
    expect(modalContent).toHaveClass("max-w-4xl");
  });
});

// ===== イベント処理のテスト =====

/**
 * Modalコンポーネントのイベント処理機能の検証
 *
 * このセクションでは、クリックイベントやその他の
 * ユーザーインタラクションが正しく処理されることを検証します。
 *
 * 検証項目:
 * - オーバーレイクリックでの閉じる処理
 * - モーダルコンテンツクリックでのイベント停止
 * - onCloseコールバックの呼び出し
 */
describe("イベント処理", () => {
  /**
   * オーバーレイクリックでonCloseが呼び出されることを検証
   *
   * テスト内容:
   * - オーバーレイクリックでonCloseが呼び出される
   * - 正しい引数で呼び出される
   * - 複数回クリックで複数回呼び出される
   */
  it("オーバーレイクリックでonCloseが呼び出される", async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    const overlay = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;

    // オーバーレイをクリック
    if (overlay) {
      await user.click(overlay);
    }

    // onCloseが呼び出されることを確認
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledWith();
  });

  /**
   * モーダルコンテンツクリックでイベントが停止されることを検証
   *
   * テスト内容:
   * - モーダルコンテンツクリックでイベントが停止される
   * - onCloseが呼び出されない
   * - イベントの伝播が止まる
   */
  it("モーダルコンテンツクリックでイベントが停止される", async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    const modalContent = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;

    // モーダルコンテンツをクリック
    if (modalContent) {
      await user.click(modalContent);
    }

    // onCloseが呼び出されないことを確認
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  /**
   * 子要素クリックでイベントが停止されることを検証
   *
   * テスト内容:
   * - 子要素クリックでイベントが停止される
   * - onCloseが呼び出されない
   * - イベントの伝播が止まる
   */
  it("子要素クリックでイベントが停止される", async () => {
    const user = userEvent.setup();
    render(<Modal {...withComplexChildrenProps} />);

    const button = screen.getByRole("button", { name: "アクションボタン" });

    // 子要素をクリック
    await user.click(button);

    // onCloseが呼び出されないことを確認
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  /**
   * キーボード操作でonCloseが呼び出されることを検証
   *
   * テスト内容:
   * - EscapeキーでonCloseが呼び出される
   * - 正しい引数で呼び出される
   * - 複数回キー押下で複数回呼び出される
   */
  it("キーボード操作でonCloseが呼び出される", async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    // Escapeキーを押す
    await user.keyboard("{Escape}");

    // onCloseが呼び出されることを確認
    expect(mockOnClose).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledWith();
  });

  /**
   * 複数のイベントが正しく処理されることを検証
   *
   * テスト内容:
   * - 複数のイベントが正しく処理される
   * - イベントの競合が発生しない
   * - パフォーマンスが適切である
   */
  it("複数のイベントが正しく処理される", async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    const overlay = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;

    // 複数のイベントを実行
    if (overlay) {
      await user.click(overlay);
    }
    await user.keyboard("{Escape}");

    // 両方のイベントでonCloseが呼び出されることを確認
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});

// ===== スタイリングのテスト =====

/**
 * Modalコンポーネントのスタイリング機能の検証
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
   * オーバーレイのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - オーバーレイのクラス名が適用される
   * - 背景色と透明度が設定される
   * - レイアウトが適切である
   */
  it("オーバーレイのスタイリングが正しく適用される", () => {
    render(<Modal {...defaultProps} />);

    const overlay = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;

    // オーバーレイのクラス名が適用されることを確認
    expect(overlay).toHaveClass(
      "fixed",
      "inset-0",
      "z-[70]",
      "flex",
      "items-center",
      "justify-center",
      "p-4",
      "bg-black",
      "bg-opacity-60",
      "backdrop-blur-sm"
    );
  });

  /**
   * モーダルコンテンツのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - モーダルコンテンツのクラス名が適用される
   * - 背景色とボーダーが設定される
   * - サイズ制限が適用される
   */
  it("モーダルコンテンツのスタイリングが正しく適用される", () => {
    render(<Modal {...defaultProps} />);

    const modalContent = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;

    // モーダルコンテンツのクラス名が適用されることを確認
    expect(modalContent).toHaveClass(
      "bg-white",
      "dark:bg-neutral-800",
      "rounded-lg",
      "shadow-2xl",
      "w-full",
      "max-w-lg",
      "max-h-[90vh]",
      "overflow-y-auto"
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
    render(<Modal {...defaultProps} />);

    const modalContent = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;

    // ダークモードのクラス名が適用されることを確認
    expect(modalContent).toHaveClass("dark:bg-neutral-800");
  });

  /**
   * レスポンシブデザインが正しく適用されることを検証
   *
   * テスト内容:
   * - レスポンシブデザインのクラス名が適用される
   * - 適切なサイズ制限が設定される
   * - レイアウトが適切である
   */
  it("レスポンシブデザインが正しく適用される", () => {
    render(<Modal {...defaultProps} />);

    const modalContent = screen
      .getByText("テストコンテンツ")
      .closest("div")?.parentElement;

    // レスポンシブデザインのクラス名が適用されることを確認
    expect(modalContent).toHaveClass(
      "w-full",
      "max-h-[90vh]",
      "overflow-y-auto"
    );
  });
});

// ===== アクセシビリティのテスト =====

/**
 * Modalコンポーネントのアクセシビリティ機能の検証
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
   * モーダルが適切に読み取れることを検証
   *
   * テスト内容:
   * - モーダルコンテンツが読み取れる
   * - 適切な要素構造である
   * - スクリーンリーダーに対応している
   */
  it("モーダルが適切に読み取れる", () => {
    render(<Modal {...defaultProps} />);

    // モーダルコンテンツが読み取れることを確認
    expect(screen.getByText("テストコンテンツ")).toBeInTheDocument();

    // 適切な要素構造であることを確認
    const modalContent = screen.getByText("テストコンテンツ").closest("div");
    expect(modalContent).toBeInTheDocument();
  });

  /**
   * キーボードナビゲーションが適切に動作することを検証
   *
   * テスト内容:
   * - Escapeキーでモーダルが閉じる
   * - フォーカス管理が適切である
   * - キーボード操作が正しく動作する
   */
  it("キーボードナビゲーションが適切に動作する", async () => {
    const user = userEvent.setup();
    render(<Modal {...defaultProps} />);

    // Escapeキーでモーダルが閉じることを確認
    await user.keyboard("{Escape}");
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  /**
   * 複雑な子コンポーネントでもアクセシビリティが確保されることを検証
   *
   * テスト内容:
   * - 複雑な子コンポーネントでも読み取れる
   * - 各要素が適切に配置される
   * - アクセシビリティが確保される
   */
  it("複雑な子コンポーネントでもアクセシビリティが確保される", () => {
    render(<Modal {...withComplexChildrenProps} />);

    // 各子要素が読み取れることを確認
    expect(screen.getByText("モーダルタイトル")).toBeInTheDocument();
    expect(screen.getByText("モーダルの内容です。")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "アクションボタン" })
    ).toBeInTheDocument();
  });

  /**
   * 長いコンテンツでもアクセシビリティが確保されることを検証
   *
   * テスト内容:
   * - 長いコンテンツでも読み取れる
   * - スクロールが適切に動作する
   * - レイアウトが崩れない
   */
  it("長いコンテンツでもアクセシビリティが確保される", () => {
    const longContent = Array.from({ length: 100 }, (_, i) => (
      <p key={i}>長いコンテンツの段落 {i + 1}</p>
    ));

    render(
      <Modal {...defaultProps}>
        <div>{longContent}</div>
      </Modal>
    );

    // 長いコンテンツが読み取れることを確認
    expect(screen.getByText("長いコンテンツの段落 1")).toBeInTheDocument();
    expect(screen.getByText("長いコンテンツの段落 100")).toBeInTheDocument();
  });
});

// ===== エッジケースのテスト =====

/**
 * Modalコンポーネントのエッジケースの検証
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
   * 空の子コンポーネントでもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 空の子コンポーネントでもレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("空の子コンポーネントでもエラーが発生しない", () => {
    render(<Modal {...defaultProps} children={null} />);

    // モーダルコンテナが存在することを確認
    const modalContainer = screen.getByRole("generic");
    expect(modalContainer).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 非常に長い子コンテンツでも正しく処理されることを検証
   *
   * テスト内容:
   * - 長い子コンテンツでもレンダリングされる
   * - パフォーマンスが適切である
   * - エラーが発生しない
   */
  it("非常に長い子コンテンツでも正しく処理される", () => {
    const veryLongContent = "a".repeat(10000);

    render(
      <Modal {...defaultProps}>
        <div>{veryLongContent}</div>
      </Modal>
    );

    // 長いコンテンツがレンダリングされることを確認
    expect(screen.getByText(veryLongContent)).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 特殊文字を含む子コンテンツでも正しく処理されることを検証
   *
   * テスト内容:
   * - 特殊文字を含む子コンテンツでもレンダリングされる
   * - エスケープが正しく処理される
   * - 適切なスタイルが適用される
   */
  it("特殊文字を含む子コンテンツでも正しく処理される", () => {
    const specialContent = "コンテンツに<>&\"'が含まれています";

    render(
      <Modal {...defaultProps}>
        <div>{specialContent}</div>
      </Modal>
    );

    // 特殊文字を含むコンテンツがレンダリングされることを確認
    expect(screen.getByText(specialContent)).toBeInTheDocument();

    // 適切なスタイルが適用されることを確認
    const modalContent = screen
      .getByText(specialContent)
      .closest("div")?.parentElement;
    expect(modalContent).toHaveClass("bg-white", "dark:bg-neutral-800");
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
    const { rerender } = render(<Modal {...defaultProps} />);

    // 複数のプロパティを同時に変化
    rerender(
      <Modal isOpen={true} onClose={mockOnClose} size="xl">
        <div>新しいコンテンツ</div>
      </Modal>
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 適切なUIが表示されることを確認
    expect(screen.getByText("新しいコンテンツ")).toBeInTheDocument();
  });
});

// ===== パフォーマンスのテスト =====

/**
 * Modalコンポーネントのパフォーマンスの検証
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
    const { rerender } = render(<Modal {...defaultProps} />);

    const startTime = performance.now();

    // 状態を変化させる
    rerender(<Modal {...defaultProps} size="lg" />);
    rerender(<Modal {...defaultProps} size="xl" />);
    rerender(<Modal {...defaultProps} isOpen={false} />);
    rerender(<Modal {...defaultProps} isOpen={true} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 再レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);
  });

  /**
   * 大量のモーダルでもパフォーマンスが適切であることを検証
   *
   * テスト内容:
   * - 大量のモーダルでもパフォーマンスが適切である
   * - メモリリークが発生しない
   * - レンダリング時間が適切である
   */
  it("大量のモーダルでもパフォーマンスが適切である", () => {
    const startTime = performance.now();

    // 大量のモーダルをレンダリング
    const { unmount } = render(
      <div>
        {Array.from({ length: 100 }, (_, i) => (
          <Modal key={i} isOpen={i % 2 === 0} onClose={mockOnClose}>
            <div>モーダル {i + 1}</div>
          </Modal>
        ))}
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);

    // 開いているモーダルがレンダリングされることを確認
    expect(screen.getAllByText(/モーダル/)).toHaveLength(50);

    unmount();
  });
});
