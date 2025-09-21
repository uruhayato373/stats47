import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EstatCategoriesTable from "./EstatCategoriesTable";
import { EstatStatsDataResponse } from "@/lib/estat/types";

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
            "@cat02": "B2201",
            "@cat03": "C3301",
            "@cat04": "D4401",
            "@cat05": "E5501",
            "@area": "00000",
            "@time": "2023000000",
            "@unit": "人",
            $: "124947000",
          },
          {
            "@cat01": "A1102",
            "@cat02": "B2202",
            "@cat03": "C3302",
            "@cat04": "D4402",
            "@cat05": "E5502",
            "@area": "00000",
            "@time": "2023000000",
            "@unit": "人",
            $: "14500000",
          },
        ],
      },
    },
  },
});

describe("EstatCategoriesTable", () => {
  it("正常なデータでレンダリングされる", () => {
    const data = createSampleData();
    render(<EstatCategoriesTable data={data} />);

    expect(screen.getByText("カテゴリ01")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ02")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ03")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ04")).toBeInTheDocument();
    expect(screen.getByText("カテゴリ05")).toBeInTheDocument();
  });

  it("カテゴリデータが正しく表示される", () => {
    const data = createSampleData();
    render(<EstatCategoriesTable data={data} />);

    expect(screen.getByText("A1101")).toBeInTheDocument();
    expect(screen.getByText("B2201")).toBeInTheDocument();
    expect(screen.getByText("C3301")).toBeInTheDocument();
    expect(screen.getByText("D4401")).toBeInTheDocument();
    expect(screen.getByText("E5501")).toBeInTheDocument();
  });

  it("複数のデータ行が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatCategoriesTable data={data} />);

    expect(screen.getByText("A1102")).toBeInTheDocument();
    expect(screen.getByText("B2202")).toBeInTheDocument();
    expect(screen.getByText("C3302")).toBeInTheDocument();
    expect(screen.getByText("D4402")).toBeInTheDocument();
    expect(screen.getByText("E5502")).toBeInTheDocument();
  });

  it("空のデータの場合は空メッセージが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [];

    render(<EstatCategoriesTable data={data} />);

    expect(screen.getByText("カテゴリ情報がありません")).toBeInTheDocument();
  });

  it("データが存在しない場合は何も表示されない", () => {
    const data = null as any;
    const { container } = render(<EstatCategoriesTable data={data} />);

    expect(container.firstChild).toBeNull();
  });

  it("単一データオブジェクトが正しく配列として処理される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = {
      "@cat01": "A1101",
      "@cat02": "B2201",
      "@cat03": "C3301",
      "@cat04": "D4401",
      "@cat05": "E5501",
      "@area": "00000",
      "@time": "2023000000",
      "@unit": "人",
      $: "124947000",
    } as any;

    render(<EstatCategoriesTable data={data} />);

    expect(screen.getByText("A1101")).toBeInTheDocument();
    expect(screen.getByText("B2201")).toBeInTheDocument();
    expect(screen.getByText("C3301")).toBeInTheDocument();
    expect(screen.getByText("D4401")).toBeInTheDocument();
    expect(screen.getByText("E5501")).toBeInTheDocument();
  });

  it("一部のカテゴリが欠けているデータでも正しく表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@cat02": "B2201",
        // @cat03, @cat04, @cat05 は欠けている
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: "124947000",
      },
    ];

    render(<EstatCategoriesTable data={data} />);

    expect(screen.getByText("A1101")).toBeInTheDocument();
    expect(screen.getByText("B2201")).toBeInTheDocument();
    // 欠けているカテゴリは空のセルとして表示される
  });

  it("nullデータの場合は空メッセージが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = null as any;

    render(<EstatCategoriesTable data={data} />);

    expect(screen.getByText("カテゴリ情報がありません")).toBeInTheDocument();
  });
});
