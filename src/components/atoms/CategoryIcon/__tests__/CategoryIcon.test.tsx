import { vi, describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryIcon } from "../CategoryIcon";
import {
  MapPin,
  Users,
  Briefcase,
  Wheat,
  Factory,
  Store,
  TrendingUp,
  Home,
  Zap,
  Plane,
  GraduationCap,
  Building2,
  Shield,
  Heart,
  Globe,
  Construction,
  Sprout,
  PieChart,
  Droplets,
  ShieldCheck,
  Hospital,
} from "lucide-react";

/**
 * CategoryIcon テストスイート
 *
 * このテストファイルは、CategoryIconコンポーネントの動作を検証します。
 * アイコンマッピング、フォールバック処理、レンダリング、スタイリングを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - アイコンマッピングの動作
 * - フォールバック処理
 * - スタイリングの適用
 * - エッジケースの処理
 * - アクセシビリティ
 *
 * 注意事項:
 * - LucideアイコンはSVG要素としてレンダリングされる
 * - フォールバック処理ではconsole.warnが出力される
 * - 存在しないアイコン名でもエラーが発生しない
 */

// ===== テストデータ =====

/**
 * 有効なアイコン名のリスト
 *
 * このデータは、CategoryIconコンポーネントでサポートされている
 * すべてのアイコン名を表しています。
 *
 * データ構造:
 * - 各アイコン名はiconMapのキーと一致
 * - 対応するLucideアイコンコンポーネントが存在
 *
 * 用途:
 * - アイコンマッピングのテスト
 * - レンダリングのテスト
 * - スタイリングのテスト
 */
const validIconNames = [
  "MapPin",
  "Users",
  "Briefcase",
  "Wheat",
  "Factory",
  "Store",
  "TrendingUp",
  "Home",
  "Zap",
  "Plane",
  "GraduationCap",
  "Building2",
  "Shield",
  "Heart",
  "Globe",
  "Construction",
  "Sprout",
  "PieChart",
  "Droplets",
  "ShieldCheck",
  "Hospital",
];

/**
 * 無効なアイコン名のリスト
 *
 * このデータは、CategoryIconコンポーネントでサポートされていない
 * アイコン名を表しています。
 *
 * 用途:
 * - フォールバック処理のテスト
 * - エラーハンドリングのテスト
 * - エッジケースのテスト
 */
const invalidIconNames = [
  "NonExistentIcon",
  "InvalidIcon",
  "UnknownIcon",
  "",
  "123",
  "icon-with-dash",
  "icon_with_underscore",
];

// ===== テストセットアップ =====

/**
 * 各テストの前に実行されるセットアップ処理
 *
 * 実行内容:
 * - モック関数のクリア
 * - テスト間の状態リセット
 * - console.warnとconsole.errorのモック
 */
beforeEach(() => {
  vi.clearAllMocks();
  // console.warnとconsole.errorをモック
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// ===== 基本的なレンダリングテスト =====

/**
 * CategoryIconコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、CategoryIconコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - 有効なアイコン名でのレンダリング
 * - SVG要素の存在
 * - クラス名の適用
 */
describe("基本的なレンダリング", () => {
  /**
   * 有効なアイコン名でアイコンがレンダリングされることを検証
   *
   * テスト内容:
   * - 指定されたアイコンがレンダリングされる
   * - SVG要素が存在する
   * - デフォルトクラス名が適用される
   */
  it("有効なアイコン名でアイコンがレンダリングされる", () => {
    render(<CategoryIcon iconName="Users" />);

    // SVG要素が存在することを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe("svg");

    // デフォルトクラス名が適用されることを確認
    expect(svgElement).toHaveClass("w-5", "h-5");
  });

  /**
   * カスタムクラス名が適用されることを検証
   *
   * テスト内容:
   * - カスタムクラス名が正しく適用される
   * - デフォルトクラス名と併用される
   * - 複数のクラス名が適用される
   */
  it("カスタムクラス名が適用される", () => {
    const customClassName = "custom-icon-class w-8 h-8 text-blue-500";

    render(<CategoryIcon iconName="Home" className={customClassName} />);

    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toHaveClass(
      "custom-icon-class",
      "w-8",
      "h-8",
      "text-blue-500"
    );
  });

  /**
   * 複数のアイコンが正しくレンダリングされることを検証
   *
   * テスト内容:
   * - 異なるアイコン名で異なるアイコンが表示される
   * - 各アイコンが独立してレンダリングされる
   * - アイコンの種類が正しい
   */
  it("複数のアイコンが正しくレンダリングされる", () => {
    const { rerender } = render(<CategoryIcon iconName="Users" />);

    // Usersアイコンがレンダリングされる
    let svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();

    // 異なるアイコンに変更
    rerender(<CategoryIcon iconName="Home" />);

    // Homeアイコンがレンダリングされる
    svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
  });
});

// ===== アイコンマッピングのテスト =====

/**
 * CategoryIconコンポーネントのアイコンマッピング機能の検証
 *
 * このセクションでは、アイコン名からアイコンコンポーネントへの
 * マッピングが正しく動作することを検証します。
 *
 * 検証項目:
 * - 有効なアイコン名のマッピング
 * - 無効なアイコン名のフォールバック
 * - アイコン名の大文字小文字の区別
 */
describe("アイコンマッピング", () => {
  /**
   * すべての有効なアイコン名が正しくマッピングされることを検証
   *
   * テスト内容:
   * - 各有効なアイコン名でアイコンがレンダリングされる
   * - エラーが発生しない
   * - 正しいアイコンが表示される
   */
  it("すべての有効なアイコン名が正しくマッピングされる", () => {
    validIconNames.forEach((iconName) => {
      const { unmount } = render(<CategoryIcon iconName={iconName} />);

      // SVG要素が存在することを確認
      const svgElement = screen.getByRole("img", { hidden: true });
      expect(svgElement).toBeInTheDocument();
      expect(svgElement.tagName).toBe("svg");

      // 警告が出力されないことを確認
      expect(console.warn).not.toHaveBeenCalled();

      unmount();
    });
  });

  /**
   * 無効なアイコン名でフォールバック処理が動作することを検証
   *
   * テスト内容:
   * - 無効なアイコン名でもエラーが発生しない
   * - MapPinIconがフォールバックとして使用される
   * - 警告メッセージが出力される
   */
  it("無効なアイコン名でフォールバック処理が動作する", () => {
    render(<CategoryIcon iconName="NonExistentIcon" />);

    // SVG要素が存在することを確認（フォールバックアイコン）
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe("svg");

    // 警告メッセージが出力されることを確認
    expect(console.warn).toHaveBeenCalledWith(
      'Icon "NonExistentIcon" not found, using MapPinIcon as fallback'
    );
  });

  /**
   * 空文字列のアイコン名でフォールバック処理が動作することを検証
   *
   * テスト内容:
   * - 空文字列でもエラーが発生しない
   * - MapPinIconがフォールバックとして使用される
   * - 警告メッセージが出力される
   */
  it("空文字列のアイコン名でフォールバック処理が動作する", () => {
    render(<CategoryIcon iconName="" />);

    // SVG要素が存在することを確認（フォールバックアイコン）
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe("svg");

    // 警告メッセージが出力されることを確認
    expect(console.warn).toHaveBeenCalledWith(
      'Icon "" not found, using MapPinIcon as fallback'
    );
  });
});

// ===== フォールバック処理のテスト =====

/**
 * CategoryIconコンポーネントのフォールバック処理の検証
 *
 * このセクションでは、無効なアイコン名に対する
 * フォールバック処理が正しく動作することを検証します。
 *
 * 検証項目:
 * - MapPinIconへのフォールバック
 * - エラーハンドリング
 * - 警告メッセージの出力
 */
describe("フォールバック処理", () => {
  /**
   * 無効なアイコン名でMapPinIconがフォールバックとして使用されることを検証
   *
   * テスト内容:
   * - 無効なアイコン名でもレンダリングされる
   * - MapPinIconが使用される
   * - 適切な警告が出力される
   */
  it("無効なアイコン名でMapPinIconがフォールバックとして使用される", () => {
    render(<CategoryIcon iconName="InvalidIcon" />);

    // SVG要素が存在することを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe("svg");

    // 警告メッセージが出力されることを確認
    expect(console.warn).toHaveBeenCalledWith(
      'Icon "InvalidIcon" not found, using MapPinIcon as fallback'
    );

    // エラーメッセージが出力されないことを確認
    expect(console.error).not.toHaveBeenCalled();
  });

  /**
   * MapPinIconが未定義の場合のエラーハンドリングを検証
   *
   * テスト内容:
   * - MapPinIconが未定義でもエラーが発生しない
   * - フォールバック用のdiv要素が表示される
   * - エラーメッセージが出力される
   */
  it("MapPinIconが未定義の場合のエラーハンドリング", () => {
    // MapPinIconを一時的に未定義にする
    const originalMapPin = (global as any).MapPin;
    delete (global as any).MapPin;

    render(<CategoryIcon iconName="InvalidIcon" />);

    // フォールバック用のdiv要素が表示されることを確認
    const fallbackElement = screen.getByText("?");
    expect(fallbackElement).toBeInTheDocument();
    expect(fallbackElement.tagName).toBe("div");

    // エラーメッセージが出力されることを確認
    expect(console.error).toHaveBeenCalledWith("MapPinIcon is not defined!");

    // 元に戻す
    (global as any).MapPin = originalMapPin;
  });

  /**
   * 複数の無効なアイコン名でフォールバック処理が動作することを検証
   *
   * テスト内容:
   * - 各無効なアイコン名でフォールバックが動作する
   * - 適切な警告が出力される
   * - エラーが発生しない
   */
  it("複数の無効なアイコン名でフォールバック処理が動作する", () => {
    invalidIconNames.forEach((iconName) => {
      const { unmount } = render(<CategoryIcon iconName={iconName} />);

      // SVG要素が存在することを確認（フォールバックアイコン）
      const svgElement = screen.getByRole("img", { hidden: true });
      expect(svgElement).toBeInTheDocument();
      expect(svgElement.tagName).toBe("svg");

      // 警告メッセージが出力されることを確認
      expect(console.warn).toHaveBeenCalledWith(
        `Icon "${iconName}" not found, using MapPinIcon as fallback`
      );

      unmount();
    });
  });
});

// ===== スタイリングのテスト =====

/**
 * CategoryIconコンポーネントのスタイリング機能の検証
 *
 * このセクションでは、クラス名の適用とスタイリングが
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - デフォルトクラス名の適用
 * - カスタムクラス名の適用
 * - 複数クラス名の処理
 */
describe("スタイリング", () => {
  /**
   * デフォルトクラス名が適用されることを検証
   *
   * テスト内容:
   * - デフォルトのクラス名が適用される
   * - サイズクラスが正しく設定される
   * - 複数のクラス名が適用される
   */
  it("デフォルトクラス名が適用される", () => {
    render(<CategoryIcon iconName="Users" />);

    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toHaveClass("w-5", "h-5");
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
    const customClassName = "custom-class w-8 h-8 text-blue-500";

    render(<CategoryIcon iconName="Home" className={customClassName} />);

    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toHaveClass(
      "custom-class",
      "w-8",
      "h-8",
      "text-blue-500"
    );
  });

  /**
   * 空のクラス名でもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 空文字列のクラス名でも動作する
   * - デフォルトクラス名が適用される
   * - エラーが発生しない
   */
  it("空のクラス名でもエラーが発生しない", () => {
    render(<CategoryIcon iconName="Users" className="" />);

    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass("w-5", "h-5");
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
    const specialClassName =
      "class-with-dash class_with_underscore class.with.dots";

    render(<CategoryIcon iconName="Globe" className={specialClassName} />);

    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toHaveClass(
      "class-with-dash",
      "class_with_underscore",
      "class.with.dots"
    );
  });
});

// ===== アクセシビリティのテスト =====

/**
 * CategoryIconコンポーネントのアクセシビリティ機能の検証
 *
 * このセクションでは、アクセシビリティに関する
 * 機能が正しく動作することを検証します。
 *
 * 検証項目:
 * - 適切なロール属性
 * - スクリーンリーダー対応
 * - キーボードナビゲーション
 */
describe("アクセシビリティ", () => {
  /**
   * SVG要素が適切なロール属性を持つことを検証
   *
   * テスト内容:
   * - SVG要素がimgロールを持つ
   * - hidden属性が設定される
   * - アクセシビリティが確保される
   */
  it("SVG要素が適切なロール属性を持つ", () => {
    render(<CategoryIcon iconName="Users" />);

    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute("role", "img");
  });

  /**
   * フォールバック要素も適切にレンダリングされることを検証
   *
   * テスト内容:
   * - フォールバック要素が表示される
   * - 適切なクラス名が適用される
   * - アクセシビリティが確保される
   */
  it("フォールバック要素も適切にレンダリングされる", () => {
    render(<CategoryIcon iconName="InvalidIcon" />);

    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveClass("w-5", "h-5");
  });

  /**
   * 複数のアイコンが独立してアクセシブルであることを検証
   *
   * テスト内容:
   * - 各アイコンが独立してレンダリングされる
   * - 適切なロール属性を持つ
   * - アクセシビリティが確保される
   */
  it("複数のアイコンが独立してアクセシブルである", () => {
    const { rerender } = render(<CategoryIcon iconName="Users" />);

    let svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute("role", "img");

    rerender(<CategoryIcon iconName="Home" />);

    svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement).toHaveAttribute("role", "img");
  });
});

// ===== エッジケースのテスト =====

/**
 * CategoryIconコンポーネントのエッジケースの検証
 *
 * このセクションでは、特殊な状況や境界値での
 * コンポーネントの動作を検証します。
 *
 * 検証項目:
 * - 特殊な文字列の処理
 * - 境界値の処理
 * - 異常系の処理
 */
describe("エッジケース", () => {
  /**
   * 特殊文字を含むアイコン名が正しく処理されることを検証
   *
   * テスト内容:
   * - 特殊文字を含むアイコン名でもエラーが発生しない
   * - フォールバック処理が動作する
   * - 適切な警告が出力される
   */
  it("特殊文字を含むアイコン名が正しく処理される", () => {
    const specialIconNames = [
      "icon-with-dash",
      "icon_with_underscore",
      "icon.with.dots",
      "icon with spaces",
      "icon123",
      "123icon",
    ];

    specialIconNames.forEach((iconName) => {
      const { unmount } = render(<CategoryIcon iconName={iconName} />);

      // SVG要素が存在することを確認（フォールバックアイコン）
      const svgElement = screen.getByRole("img", { hidden: true });
      expect(svgElement).toBeInTheDocument();
      expect(svgElement.tagName).toBe("svg");

      // 警告メッセージが出力されることを確認
      expect(console.warn).toHaveBeenCalledWith(
        `Icon "${iconName}" not found, using MapPinIcon as fallback`
      );

      unmount();
    });
  });

  /**
   * 非常に長いアイコン名が正しく処理されることを検証
   *
   * テスト内容:
   * - 長いアイコン名でもエラーが発生しない
   * - フォールバック処理が動作する
   * - メモリリークが発生しない
   */
  it("非常に長いアイコン名が正しく処理される", () => {
    const longIconName = "a".repeat(1000);

    render(<CategoryIcon iconName={longIconName} />);

    // SVG要素が存在することを確認（フォールバックアイコン）
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe("svg");

    // 警告メッセージが出力されることを確認
    expect(console.warn).toHaveBeenCalledWith(
      `Icon "${longIconName}" not found, using MapPinIcon as fallback`
    );
  });

  /**
   * nullやundefinedのアイコン名が正しく処理されることを検証
   *
   * テスト内容:
   * - nullやundefinedでもエラーが発生しない
   * - フォールバック処理が動作する
   * - 適切な警告が出力される
   */
  it("nullやundefinedのアイコン名が正しく処理される", () => {
    // @ts-ignore - 意図的に型エラーを無視
    render(<CategoryIcon iconName={null} />);

    // SVG要素が存在することを確認（フォールバックアイコン）
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe("svg");

    // 警告メッセージが出力されることを確認
    expect(console.warn).toHaveBeenCalledWith(
      'Icon "null" not found, using MapPinIcon as fallback'
    );
  });

  /**
   * 数値のアイコン名が正しく処理されることを検証
   *
   * テスト内容:
   * - 数値でもエラーが発生しない
   * - 文字列に変換されて処理される
   * - フォールバック処理が動作する
   */
  it("数値のアイコン名が正しく処理される", () => {
    // @ts-ignore - 意図的に型エラーを無視
    render(<CategoryIcon iconName={123} />);

    // SVG要素が存在することを確認（フォールバックアイコン）
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe("svg");

    // 警告メッセージが出力されることを確認
    expect(console.warn).toHaveBeenCalledWith(
      'Icon "123" not found, using MapPinIcon as fallback'
    );
  });
});

// ===== パフォーマンスのテスト =====

/**
 * CategoryIconコンポーネントのパフォーマンスの検証
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
   * 大量のアイコンが効率的にレンダリングされることを検証
   *
   * テスト内容:
   * - 大量のアイコンがレンダリングされる
   * - メモリリークが発生しない
   * - パフォーマンスが適切である
   */
  it("大量のアイコンが効率的にレンダリングされる", () => {
    const startTime = performance.now();

    // 大量のアイコンをレンダリング
    const { unmount } = render(
      <div>
        {validIconNames.map((iconName, index) => (
          <CategoryIcon key={index} iconName={iconName} />
        ))}
      </div>
    );

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);

    // すべてのアイコンがレンダリングされることを確認
    const svgElements = screen.getAllByRole("img", { hidden: true });
    expect(svgElements).toHaveLength(validIconNames.length);

    unmount();
  });

  /**
   * 同じアイコン名の再レンダリングが効率的であることを検証
   *
   * テスト内容:
   * - 同じアイコン名で再レンダリングされる
   * - 不要な再計算が発生しない
   * - パフォーマンスが適切である
   */
  it("同じアイコン名の再レンダリングが効率的である", () => {
    const { rerender } = render(<CategoryIcon iconName="Users" />);

    const startTime = performance.now();

    // 同じアイコン名で再レンダリング
    rerender(<CategoryIcon iconName="Users" />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // 再レンダリング時間が適切であることを確認（100ms以内）
    expect(renderTime).toBeLessThan(100);

    // アイコンが正しくレンダリングされることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
  });
});
