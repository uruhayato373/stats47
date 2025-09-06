import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EstatDataDisplay from "./EstatDataDisplay";
import { EstatStatsDataResponse } from "@/types/estat";

// サンプルデータの作成
const createSampleData = (): EstatStatsDataResponse => ({
  GET_STATS_DATA: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: "",
      DATE: "2024-01-15T10:30:00+09:00",
    },
    PARAMETER: {
      APP_ID: "test-app-id",
      LANG: "J",
      STATS_DATA_ID: "0003109941",
      META_GET_FLG: "Y",
      CNT_GET_FLG: "N",
      START_POSITION: 1,
      LIMIT: 100,
    },
    STATISTICAL_DATA: {
      TABLE_INF: {
        "@id": "0003109941",
        STAT_NAME: { $: "人口推計" },
        TITLE: { $: "年齢（3区分）別人口" },
      },
      CLASS_INF: {
        CLASS_OBJ: [],
      },
      DATA_INF: {
        NOTE: [],
        VALUE: [
          {
            "@cat01": "A1101",
            "@area": "00000",
            "@time": "2023000000",
            "@unit": "人",
            $: "124947000",
          },
        ],
      },
    },
  },
});

describe("EstatDataDisplay", () => {
  it("正常なデータでレンダリングされる", () => {
    const data = createSampleData();
    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    expect(screen.getByText("APIレスポンス")).toBeInTheDocument();
    expect(screen.getByText("概要")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ")).toBeInTheDocument();
    expect(screen.getByText("地域")).toBeInTheDocument();
    expect(screen.getByText("年度")).toBeInTheDocument();
    expect(screen.getByText("値")).toBeInTheDocument();
    expect(screen.getByText("Raw JSON")).toBeInTheDocument();
  });

  it("ローディング状態が正しく表示される", () => {
    render(<EstatDataDisplay data={null} loading={true} error={null} />);

    expect(screen.getByText("データを取得中...")).toBeInTheDocument();
  });

  it("エラー状態が正しく表示される", () => {
    render(
      <EstatDataDisplay
        data={null}
        loading={false}
        error="統計データが見つかりません"
      />
    );

    expect(screen.getByText("データ取得エラー")).toBeInTheDocument();
    expect(screen.getByText("統計データが見つかりません")).toBeInTheDocument();
  });

  it("データなし状態が正しく表示される", () => {
    render(<EstatDataDisplay data={null} loading={false} error={null} />);

    expect(screen.getByText("データ取得前")).toBeInTheDocument();
    expect(
      screen.getByText(
        "上のフォームからパラメータを入力してデータを取得してください"
      )
    ).toBeInTheDocument();
  });

  it("タブの切り替えが動作する", () => {
    const data = createSampleData();
    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    // 初期状態では概要タブがアクティブ
    expect(screen.getByText("基本情報")).toBeInTheDocument();

    // カテゴリタブをクリック
    const categoriesTab = screen.getByText("カテゴリ");
    fireEvent.click(categoriesTab);

    // カテゴリテーブルが表示される
    expect(screen.getByText("カテゴリ01")).toBeInTheDocument();
  });

  it("JSONダウンロードボタンが表示される", () => {
    const data = createSampleData();
    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    expect(screen.getByText("JSONダウンロード")).toBeInTheDocument();
  });

  it("JSONダウンロードボタンがクリックされたときにダウンロードが実行される", () => {
    const data = createSampleData();

    // URL.createObjectURL と document.createElement をモック
    const mockCreateObjectURL = vi.fn(() => "mock-url");
    const mockRevokeObjectURL = vi.fn();
    const mockClick = vi.fn();
    const mockAppendChild = vi.fn();
    const mockRemoveChild = vi.fn();

    Object.defineProperty(URL, "createObjectURL", {
      value: mockCreateObjectURL,
      writable: true,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      value: mockRevokeObjectURL,
      writable: true,
    });

    // document.createElement をモック
    const mockAnchor = {
      href: "",
      download: "",
      click: mockClick,
    };
    vi.spyOn(document, "createElement").mockReturnValue(mockAnchor as any);
    vi.spyOn(document.body, "appendChild").mockImplementation(mockAppendChild);
    vi.spyOn(document.body, "removeChild").mockImplementation(mockRemoveChild);

    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    const downloadButton = screen.getByText("JSONダウンロード");
    fireEvent.click(downloadButton);

    expect(mockCreateObjectURL).toHaveBeenCalled();
    expect(mockClick).toHaveBeenCalled();
    expect(mockAppendChild).toHaveBeenCalled();
    expect(mockRemoveChild).toHaveBeenCalled();
    expect(mockRevokeObjectURL).toHaveBeenCalled();
  });

  it("データがない場合はダウンロードボタンが動作しない", () => {
    render(<EstatDataDisplay data={null} loading={false} error={null} />);

    // データなし状態ではダウンロードボタンが表示されない
    expect(screen.queryByText("JSONダウンロード")).not.toBeInTheDocument();
  });

  it("ローディング中はダウンロードボタンが表示されない", () => {
    render(<EstatDataDisplay data={null} loading={true} error={null} />);

    // ローディング中はダウンロードボタンが表示されない
    expect(screen.queryByText("JSONダウンロード")).not.toBeInTheDocument();
  });

  it("エラー時はダウンロードボタンが表示されない", () => {
    render(
      <EstatDataDisplay
        data={null}
        loading={false}
        error="エラーが発生しました"
      />
    );

    // エラー時はダウンロードボタンが表示されない
    expect(screen.queryByText("JSONダウンロード")).not.toBeInTheDocument();
  });

  it("Raw JSONタブが正しく動作する", () => {
    const data = createSampleData();
    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    // Raw JSONタブをクリック
    const rawJsonTab = screen.getByText("Raw JSON");
    fireEvent.click(rawJsonTab);

    // JSONデータが表示される
    expect(screen.getByText('"GET_STATS_DATA"')).toBeInTheDocument();
  });

  it("値タブが正しく動作する", () => {
    const data = createSampleData();
    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    // 値タブをクリック
    const valuesTab = screen.getByText("値");
    fireEvent.click(valuesTab);

    // 値テーブルが表示される
    expect(screen.getByText("カテゴリ")).toBeInTheDocument();
    expect(screen.getByText("地域")).toBeInTheDocument();
    expect(screen.getByText("年度")).toBeInTheDocument();
    expect(screen.getByText("値")).toBeInTheDocument();
    expect(screen.getByText("単位")).toBeInTheDocument();
  });

  it("地域タブが正しく動作する", () => {
    const data = createSampleData();
    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    // 地域タブをクリック
    const areasTab = screen.getByText("地域");
    fireEvent.click(areasTab);

    // 地域テーブルが表示される
    expect(screen.getByText("地域コード")).toBeInTheDocument();
    expect(screen.getByText("地域名")).toBeInTheDocument();
  });

  it("年度タブが正しく動作する", () => {
    const data = createSampleData();
    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    // 年度タブをクリック
    const yearsTab = screen.getByText("年度");
    fireEvent.click(yearsTab);

    // 年度テーブルが表示される
    expect(screen.getByText("年度")).toBeInTheDocument();
    expect(screen.getByText("説明")).toBeInTheDocument();
  });
});
