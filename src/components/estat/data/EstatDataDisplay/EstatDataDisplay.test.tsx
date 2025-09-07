import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EstatDataDisplay from "./EstatDataDisplay";
import { EstatStatsDataResponse } from "@/types/estat";

// サンプルデータの作成（実際のe-Stat APIレスポンス形式に基づく）
const createSampleData = (): EstatStatsDataResponse => ({
  GET_STATS_DATA: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: "正常に終了しました。",
      DATE: "2024-01-15T10:30:00+09:00",
    },
    PARAMETER: {
      LANG: "J",
      STATS_DATA_ID: "0000010101",
      NARROWING_COND: {
        CODE_CAT01_SELECT: "A1101",
      },
      DATA_FORMAT: "J",
      START_POSITION: 1,
      METAGET_FLG: "Y",
      CNT_GET_FLG: "N",
      EXPLANATION_GET_FLG: "N",
      ANNOTATION_GET_FLG: "N",
      REPLACE_SP_CHARS: "0",
    },
    STATISTICAL_DATA: {
      RESULT_INF: {
        TOTAL_NUMBER: 2400,
        FROM_NUMBER: 1,
        TO_NUMBER: 2400,
      },
      TABLE_INF: {
        STAT_NAME: {
          $: "社会・人口統計体系",
        },
        GOV_ORG: {
          $: "総務省",
        },
        STATISTICS_NAME: "都道府県データ 基礎データ",
        TITLE: {
          "@no": "0000010101",
          $: "Ａ　人口・世帯",
        },
        CYCLE: "年度次",
        SURVEY_DATE: "0",
        OPEN_DATE: "2025-06-30",
        SMALL_AREA: "0",
        COLLECT_AREA: "全国",
        MAIN_CATEGORY: {
          $: "その他",
        },
        SUB_CATEGORY: {
          $: "その他",
        },
        OVERALL_TOTAL_NUMBER: 2400,
        UPDATED_DATE: "2025-06-30",
        STATISTICS_NAME_SPEC: {
          TABULATION_CATEGORY: "都道府県データ",
          TABULATION_SUB_CATEGORY1: "基礎データ",
        },
        TITLE_SPEC: {
          TABLE_CATEGORY: "Ａ　人口・世帯",
          TABLE_NAME: "",
        },
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "cat01",
            "@name": "人口",
            CLASS: [
              {
                "@code": "A1101",
                "@name": "総人口",
                "@level": "1",
                "@unit": "人",
              },
            ],
          },
          {
            "@id": "area",
            "@name": "地域",
            CLASS: [
              {
                "@code": "00000",
                "@name": "全国",
                "@level": "1",
              },
              {
                "@code": "01000",
                "@name": "北海道",
                "@level": "2",
              },
              {
                "@code": "02000",
                "@name": "青森県",
                "@level": "2",
              },
            ],
          },
          {
            "@id": "time",
            "@name": "時間軸（調査年）",
            CLASS: [
              {
                "@code": "2023000000",
                "@name": "2023年",
                "@level": "1",
              },
              {
                "@code": "2022000000",
                "@name": "2022年",
                "@level": "1",
              },
            ],
          },
        ],
      },
      DATA_INF: {
        NOTE: [],
        VALUE: [
          {
            "@tab": "cat01",
            "@cat01": "A1101",
            "@area": "00000",
            "@time": "2023000000",
            "@unit": "人",
            $: "124947000",
          },
          {
            "@tab": "cat01",
            "@cat01": "A1101",
            "@area": "01000",
            "@time": "2023000000",
            "@unit": "人",
            $: "5184000",
          },
          {
            "@tab": "cat01",
            "@cat01": "A1101",
            "@area": "02000",
            "@time": "2023000000",
            "@unit": "人",
            $: "1200000",
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
    expect(screen.getByText("人口")).toBeInTheDocument();
    expect(screen.getByText("総人口")).toBeInTheDocument();
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
    expect(screen.getByText("124947000")).toBeInTheDocument();
    expect(screen.getByText("5184000")).toBeInTheDocument();
    expect(screen.getByText("1200000")).toBeInTheDocument();
  });

  it("地域タブが正しく動作する", () => {
    const data = createSampleData();
    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    // 地域タブをクリック
    const areasTab = screen.getByText("地域");
    fireEvent.click(areasTab);

    // 地域テーブルが表示される
    expect(screen.getByText("全国")).toBeInTheDocument();
    expect(screen.getByText("北海道")).toBeInTheDocument();
    expect(screen.getByText("青森県")).toBeInTheDocument();
  });

  it("年度タブが正しく動作する", () => {
    const data = createSampleData();
    render(<EstatDataDisplay data={data} loading={false} error={null} />);

    // 年度タブをクリック
    const yearsTab = screen.getByText("年度");
    fireEvent.click(yearsTab);

    // 年度テーブルが表示される
    expect(screen.getByText("2023年")).toBeInTheDocument();
    expect(screen.getByText("2022年")).toBeInTheDocument();
  });
});
