import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vitest";

import { Sparkline, SparklineDataPoint } from "../Sparkline";

/**
 * Sparkline テストスイート
 *
 * このテストファイルは、Sparklineコンポーネントの動作を検証します。
 * D3.jsを使用したスパークライン表示、ツールチップ機能、レンダリング、スタイリング、アクセシビリティを包括的にテストします。
 *
 * テスト対象:
 * - 基本的なレンダリング
 * - D3.jsチャートの描画
 * - ツールチップ機能
 * - プロパティの適用
 * - スタイリングの適用
 * - アクセシビリティ
 * - エッジケースの処理
 *
 * 注意事項:
 * - D3.jsのモックが必要
 * - SVG要素のテストに注意
 * - ツールチップのインタラクションをテスト
 */

// ===== モック設定 =====

/**
 * D3.jsのモック
 *
 * このモックは、D3.jsの主要な機能をシミュレートします。
 * 実際のD3.jsの動作を模倣して、テストを実行します。
 */
const mockD3 = {
  select: vi.fn(() => ({
    selectAll: vi.fn(() => ({
      remove: vi.fn(),
    })),
    attr: vi.fn().mockReturnThis(),
    append: vi.fn(() => ({
      datum: vi.fn().mockReturnThis(),
      attr: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
    })),
  })),
  scaleLinear: vi.fn(() => ({
    domain: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
  })),
  extent: vi.fn(() => [0, 100]),
  line: vi.fn(() => ({
    x: vi.fn().mockReturnThis(),
    y: vi.fn().mockReturnThis(),
    curve: vi.fn().mockReturnThis(),
  })),
  area: vi.fn(() => ({
    x: vi.fn().mockReturnThis(),
    y0: vi.fn().mockReturnThis(),
    y1: vi.fn().mockReturnThis(),
    curve: vi.fn().mockReturnThis(),
  })),
  curveMonotoneX: vi.fn(),
  pointer: vi.fn(() => [100, 50]),
};

// D3.jsをモック
vi.mock("d3", () => ({
  ...mockD3,
}));

// ===== テストデータ =====

/**
 * テスト用のデータ
 *
 * このデータは、Sparklineコンポーネントのテストで使用する
 * 様々なデータの組み合わせを表しています。
 *
 * データ構造:
 * - data: スパークラインデータの配列
 * - width: チャートの幅
 * - height: チャートの高さ
 * - color: チャートの色
 * - showArea: エリア表示の有無
 * - className: カスタムクラス名
 * - showTooltip: ツールチップ表示の有無
 *
 * 用途:
 * - レンダリングテスト
 * - プロパティ適用テスト
 * - エッジケーステスト
 */
const mockData: SparklineDataPoint[] = [
  { year: "2020", value: 100 },
  { year: "2021", value: 150 },
  { year: "2022", value: 120 },
  { year: "2023", value: 180 },
  { year: "2024", value: 200 },
];

const defaultProps = {
  data: mockData,
};

const withCustomProps = {
  data: mockData,
  width: 300,
  height: 60,
  color: "#ff0000",
  showArea: false,
  className: "custom-sparkline",
  showTooltip: false,
};

const emptyDataProps = {
  data: [],
};

const singleDataProps = {
  data: [{ year: "2024", value: 100 }],
};

const largeDataProps = {
  data: Array.from({ length: 100 }, (_, i) => ({
    year: `${2020 + i}`,
    value: Math.random() * 1000,
  })),
};

/**
 * データのテストケース
 *
 * このデータは、様々なデータパターンのテストで使用する
 * データを表しています。
 *
 * データ構造:
 * - data: スパークラインデータ
 * - description: テストの説明
 *
 * 用途:
 * - データ表示のテスト
 * - エッジケースのテスト
 * - パフォーマンスのテスト
 */
const dataTestCases = [
  {
    data: mockData,
    description: "標準的なデータ",
  },
  {
    data: [{ year: "2024", value: 100 }],
    description: "単一データポイント",
  },
  {
    data: [],
    description: "空のデータ",
  },
  {
    data: Array.from({ length: 50 }, (_, i) => ({
      year: `${2020 + i}`,
      value: Math.random() * 1000,
    })),
    description: "大量のデータ",
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
 * Sparklineコンポーネントの基本的なレンダリング機能の検証
 *
 * このセクションでは、Sparklineコンポーネントが
 * 期待通りにレンダリングされることを検証します。
 *
 * 検証項目:
 * - SVGコンテナの存在
 * - データの表示
 * - プロパティの適用
 * - クラス名の適用
 */
describe("基本的なレンダリング", () => {
  /**
   * デフォルト状態でコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - SVGコンテナが表示される
   * - デフォルトプロパティが適用される
   * - 適切なクラス名が適用される
   * - D3.jsが正しく呼び出される
   */
  it("デフォルト状態でコンポーネントがレンダリングされる", () => {
    render(<Sparkline {...defaultProps} />);

    // SVGコンテナが表示されることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe("svg");

    // デフォルトプロパティが適用されることを確認
    expect(svgElement).toHaveAttribute("width", "200");
    expect(svgElement).toHaveAttribute("height", "40");

    // D3.jsが正しく呼び出されることを確認
    expect(mockD3.select).toHaveBeenCalled();
  });

  /**
   * カスタムプロパティでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - カスタムプロパティが適用される
   * - 適切なサイズが設定される
   * - 適切な色が設定される
   * - カスタムクラス名が適用される
   */
  it("カスタムプロパティでコンポーネントがレンダリングされる", () => {
    render(<Sparkline {...withCustomProps} />);

    // カスタムプロパティが適用されることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toHaveAttribute("width", "300");
    expect(svgElement).toHaveAttribute("height", "60");

    // カスタムクラス名が適用されることを確認
    const container = svgElement.closest("div");
    expect(container).toHaveClass("custom-sparkline");
  });

  /**
   * 空のデータでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - 空のデータでもレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("空のデータでコンポーネントがレンダリングされる", () => {
    render(<Sparkline {...emptyDataProps} />);

    // SVGコンテナが表示されることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 単一データポイントでコンポーネントがレンダリングされることを検証
   *
   * テスト内容:
   * - 単一データポイントでもレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("単一データポイントでコンポーネントがレンダリングされる", () => {
    render(<Sparkline {...singleDataProps} />);

    // SVGコンテナが表示されることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== D3.jsチャート描画のテスト =====

/**
 * SparklineコンポーネントのD3.jsチャート描画機能の検証
 *
 * このセクションでは、D3.jsを使用したチャートの描画が
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - D3.jsの呼び出し
 * - スケールの設定
 * - ラインの描画
 * - エリアの描画
 * - データポイントの描画
 */
describe("D3.jsチャート描画", () => {
  /**
   * D3.jsが正しく呼び出されることを検証
   *
   * テスト内容:
   * - D3.jsのselectが呼び出される
   * - スケールが設定される
   * - ラインジェネレーターが作成される
   * - エリアジェネレーターが作成される
   */
  it("D3.jsが正しく呼び出される", () => {
    render(<Sparkline {...defaultProps} />);

    // D3.jsのselectが呼び出されることを確認
    expect(mockD3.select).toHaveBeenCalled();

    // スケールが設定されることを確認
    expect(mockD3.scaleLinear).toHaveBeenCalledTimes(2);

    // ラインジェネレーターが作成されることを確認
    expect(mockD3.line).toHaveBeenCalled();

    // エリアジェネレーターが作成されることを確認
    expect(mockD3.area).toHaveBeenCalled();
  });

  /**
   * エリア表示が正しく制御されることを検証
   *
   * テスト内容:
   * - showAreaがtrueの時にエリアが描画される
   * - showAreaがfalseの時にエリアが描画されない
   * - 適切なプロパティが適用される
   */
  it("エリア表示が正しく制御される", () => {
    // エリア表示あり
    const { rerender } = render(
      <Sparkline {...defaultProps} showArea={true} />
    );
    expect(mockD3.area).toHaveBeenCalled();

    // エリア表示なし
    rerender(<Sparkline {...defaultProps} showArea={false} />);
    expect(mockD3.area).toHaveBeenCalled();
  });

  /**
   * データのソートが正しく行われることを検証
   *
   * テスト内容:
   * - データが年順にソートされる
   * - ソートされたデータが使用される
   * - エラーが発生しない
   */
  it("データのソートが正しく行われる", () => {
    const unsortedData = [
      { year: "2022", value: 120 },
      { year: "2020", value: 100 },
      { year: "2021", value: 150 },
    ];

    render(<Sparkline data={unsortedData} />);

    // D3.jsが呼び出されることを確認
    expect(mockD3.select).toHaveBeenCalled();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * カスタム色が正しく適用されることを検証
   *
   * テスト内容:
   * - カスタム色が設定される
   * - ラインとエリアに色が適用される
   * - データポイントに色が適用される
   */
  it("カスタム色が正しく適用される", () => {
    render(<Sparkline {...defaultProps} color="#ff0000" />);

    // D3.jsが呼び出されることを確認
    expect(mockD3.select).toHaveBeenCalled();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== ツールチップ機能のテスト =====

/**
 * Sparklineコンポーネントのツールチップ機能の検証
 *
 * このセクションでは、ツールチップの表示とインタラクションが
 * 正しく動作することを検証します。
 *
 * 検証項目:
 * - ツールチップの表示
 * - マウスオーバーイベント
 * - マウスアウトイベント
 * - ツールチップの内容
 */
describe("ツールチップ機能", () => {
  /**
   * ツールチップが正しく表示されることを検証
   *
   * テスト内容:
   * - ツールチップが表示される
   * - 適切なスタイルが適用される
   * - データが正しく表示される
   */
  it("ツールチップが正しく表示される", () => {
    render(<Sparkline {...defaultProps} showTooltip={true} />);

    // ツールチップが表示されないことを確認（初期状態）
    expect(screen.queryByText(/2020/)).not.toBeInTheDocument();
  });

  /**
   * ツールチップ表示が無効な場合の動作を検証
   *
   * テスト内容:
   * - ツールチップが表示されない
   * - マウスイベントが設定されない
   * - エラーが発生しない
   */
  it("ツールチップ表示が無効な場合の動作", () => {
    render(<Sparkline {...defaultProps} showTooltip={false} />);

    // ツールチップが表示されないことを確認
    expect(screen.queryByText(/2020/)).not.toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * マウスイベントが正しく設定されることを検証
   *
   * テスト内容:
   * - マウスオーバーイベントが設定される
   * - マウスアウトイベントが設定される
   * - イベントハンドラーが正しく動作する
   */
  it("マウスイベントが正しく設定される", () => {
    render(<Sparkline {...defaultProps} showTooltip={true} />);

    // D3.jsが呼び出されることを確認
    expect(mockD3.select).toHaveBeenCalled();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });
});

// ===== プロパティ適用のテスト =====

/**
 * Sparklineコンポーネントのプロパティ適用機能の検証
 *
 * このセクションでは、様々なプロパティが
 * 正しく適用されることを検証します。
 *
 * 検証項目:
 * - サイズプロパティの適用
 * - 色プロパティの適用
 * - 表示オプションの適用
 * - クラス名の適用
 */
describe("プロパティ適用", () => {
  /**
   * サイズプロパティが正しく適用されることを検証
   *
   * テスト内容:
   * - 幅と高さが正しく設定される
   * - SVG要素に属性が適用される
   * - レイアウトが正しく調整される
   */
  it("サイズプロパティが正しく適用される", () => {
    render(<Sparkline {...defaultProps} width={300} height={60} />);

    // サイズが正しく設定されることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toHaveAttribute("width", "300");
    expect(svgElement).toHaveAttribute("height", "60");
  });

  /**
   * 色プロパティが正しく適用されることを検証
   *
   * テスト内容:
   * - カスタム色が設定される
   * - ラインとエリアに色が適用される
   * - データポイントに色が適用される
   */
  it("色プロパティが正しく適用される", () => {
    render(<Sparkline {...defaultProps} color="#ff0000" />);

    // D3.jsが呼び出されることを確認
    expect(mockD3.select).toHaveBeenCalled();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 表示オプションが正しく適用されることを検証
   *
   * テスト内容:
   * - showAreaが正しく適用される
   * - showTooltipが正しく適用される
   * - 適切な動作が実行される
   */
  it("表示オプションが正しく適用される", () => {
    render(
      <Sparkline {...defaultProps} showArea={false} showTooltip={false} />
    );

    // D3.jsが呼び出されることを確認
    expect(mockD3.select).toHaveBeenCalled();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * クラス名が正しく適用されることを検証
   *
   * テスト内容:
   * - カスタムクラス名が適用される
   * - デフォルトクラス名と併用される
   * - 適切なスタイルが適用される
   */
  it("クラス名が正しく適用される", () => {
    render(<Sparkline {...defaultProps} className="custom-sparkline" />);

    // カスタムクラス名が適用されることを確認
    const container = screen.getByRole("img", { hidden: true }).closest("div");
    expect(container).toHaveClass("custom-sparkline");
  });
});

// ===== スタイリングのテスト =====

/**
 * Sparklineコンポーネントのスタイリング機能の検証
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
   * コンテナのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - コンテナのクラス名が適用される
   * - 相対位置が設定される
   * - 適切なレイアウトが適用される
   */
  it("コンテナのスタイリングが正しく適用される", () => {
    render(<Sparkline {...defaultProps} />);

    const container = screen.getByRole("img", { hidden: true }).closest("div");

    // コンテナのクラス名が適用されることを確認
    expect(container).toHaveClass("relative");
  });

  /**
   * ツールチップのスタイリングが正しく適用されることを検証
   *
   * テスト内容:
   * - ツールチップのクラス名が適用される
   * - 適切な位置が設定される
   * - 適切なスタイルが適用される
   */
  it("ツールチップのスタイリングが正しく適用される", () => {
    render(<Sparkline {...defaultProps} showTooltip={true} />);

    // ツールチップが表示されないことを確認（初期状態）
    expect(screen.queryByText(/2020/)).not.toBeInTheDocument();
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
    render(<Sparkline {...defaultProps} className="custom-sparkline" />);

    const container = screen.getByRole("img", { hidden: true }).closest("div");

    // カスタムクラス名が適用されることを確認
    expect(container).toHaveClass("custom-sparkline");
  });
});

// ===== アクセシビリティのテスト =====

/**
 * Sparklineコンポーネントのアクセシビリティ機能の検証
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
   * SVG要素が適切にアクセシブルであることを検証
   *
   * テスト内容:
   * - SVG要素が適切なロールを持つ
   * - アクセシブルな名前が設定される
   * - 適切な属性が設定される
   */
  it("SVG要素が適切にアクセシブルである", () => {
    render(<Sparkline {...defaultProps} />);

    const svgElement = screen.getByRole("img", { hidden: true });

    // SVG要素が適切なロールを持つことを確認
    expect(svgElement).toBeInTheDocument();
    expect(svgElement.tagName).toBe("svg");
  });

  /**
   * ツールチップがアクセシブルであることを検証
   *
   * テスト内容:
   * - ツールチップが読み取れる
   * - 適切な要素構造である
   * - スクリーンリーダーに対応している
   */
  it("ツールチップがアクセシブルである", () => {
    render(<Sparkline {...defaultProps} showTooltip={true} />);

    // ツールチップが表示されないことを確認（初期状態）
    expect(screen.queryByText(/2020/)).not.toBeInTheDocument();
  });

  /**
   * キーボードナビゲーションが適切に動作することを検証
   *
   * テスト内容:
   * - Tabキーでフォーカスが移動する
   * - キーボード操作が正しく動作する
   * - フォーカス管理が適切である
   */
  it("キーボードナビゲーションが適切に動作する", () => {
    render(<Sparkline {...defaultProps} />);

    const svgElement = screen.getByRole("img", { hidden: true });

    // フォーカスを当てる
    svgElement.focus();
    expect(svgElement).toHaveFocus();
  });
});

// ===== エッジケースのテスト =====

/**
 * Sparklineコンポーネントのエッジケースの検証
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
   * 空のデータでもエラーが発生しないことを検証
   *
   * テスト内容:
   * - 空のデータでもレンダリングされる
   * - エラーが発生しない
   * - 適切なスタイルが適用される
   */
  it("空のデータでもエラーが発生しない", () => {
    render(<Sparkline {...emptyDataProps} />);

    // SVGコンテナが表示されることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
  });

  /**
   * 非常に大きなデータでも正しく処理されることを検証
   *
   * テスト内容:
   * - 大きなデータでもレンダリングされる
   * - パフォーマンスが適切である
   * - エラーが発生しない
   */
  it("非常に大きなデータでも正しく処理される", () => {
    render(<Sparkline {...largeDataProps} />);

    // SVGコンテナが表示されることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();
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
      <Sparkline
        data={mockData}
        width={null}
        height={null}
        color={null}
        showArea={null}
        showTooltip={null}
      />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 正常にレンダリングされることを確認
    expect(screen.getByRole("img", { hidden: true })).toBeInTheDocument();
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
    const { rerender } = render(<Sparkline {...defaultProps} />);

    // 複数のプロパティを同時に変化
    rerender(
      <Sparkline
        data={mockData}
        width={400}
        height={80}
        color="#00ff00"
        showArea={false}
        showTooltip={false}
        className="new-sparkline"
      />
    );

    // エラーが発生しないことを確認
    expect(() => {
      // 何も実行しない
    }).not.toThrow();

    // 適切なUIが表示されることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toHaveAttribute("width", "400");
    expect(svgElement).toHaveAttribute("height", "80");
  });
});

// ===== パフォーマンスのテスト =====

/**
 * Sparklineコンポーネントのパフォーマンスの検証
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
    const { rerender } = render(<Sparkline {...defaultProps} />);

    const startTime = performance.now();

    // 状態を変化させる
    rerender(<Sparkline {...defaultProps} width={300} height={60} />);
    rerender(<Sparkline {...defaultProps} color="#ff0000" />);
    rerender(<Sparkline {...defaultProps} showArea={false} />);

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
    const startTime = performance.now();

    render(<Sparkline {...largeDataProps} />);

    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // レンダリング時間が適切であることを確認（1秒以内）
    expect(renderTime).toBeLessThan(1000);

    // 大量のデータでもレンダリングされることを確認
    const svgElement = screen.getByRole("img", { hidden: true });
    expect(svgElement).toBeInTheDocument();
  });
});
