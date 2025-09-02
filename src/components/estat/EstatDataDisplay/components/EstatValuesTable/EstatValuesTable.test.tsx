import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EstatValuesTable from "./EstatValuesTable";
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
          {
            "@cat01": "A1102",
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

describe("EstatValuesTable", () => {
  it("正常なデータでレンダリングされる", () => {
    const data = createSampleData();
    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("カテゴリ")).toBeInTheDocument();
    expect(screen.getByText("地域")).toBeInTheDocument();
    expect(screen.getByText("年度")).toBeInTheDocument();
    expect(screen.getByText("値")).toBeInTheDocument();
    expect(screen.getByText("単位")).toBeInTheDocument();
  });

  it("カテゴリが正しく表示される", () => {
    const data = createSampleData();
    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("A1101")).toBeInTheDocument();
    expect(screen.getByText("A1102")).toBeInTheDocument();
  });

  it("地域が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("00000")).toBeInTheDocument();
  });

  it("年度が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("2023000000")).toBeInTheDocument();
  });

  it("値が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("124947000")).toBeInTheDocument();
    expect(screen.getByText("14500000")).toBeInTheDocument();
  });

  it("単位が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("人")).toBeInTheDocument();
  });

  it("空のデータの場合は空メッセージが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [];

    render(<EstatValuesTable data={data} />);

    expect(
      screen.getByText("表形式で表示できるデータがありません")
    ).toBeInTheDocument();
  });

  it("データが存在しない場合は何も表示されない", () => {
    const data = null as any;
    const { container } = render(<EstatValuesTable data={data} />);

    expect(container.firstChild).toBeNull();
  });

  it("単一データオブジェクトが正しく配列として処理される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = {
      "@cat01": "A1101",
      "@area": "00000",
      "@time": "2023000000",
      "@unit": "人",
      $: "124947000",
    } as any;

    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("A1101")).toBeInTheDocument();
    expect(screen.getByText("00000")).toBeInTheDocument();
    expect(screen.getByText("2023000000")).toBeInTheDocument();
    expect(screen.getByText("124947000")).toBeInTheDocument();
    expect(screen.getByText("人")).toBeInTheDocument();
  });

  it("複数カテゴリの場合は最初のカテゴリが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@cat02": "B2201",
        "@cat03": "C3301",
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: "124947000",
      },
    ];

    render(<EstatValuesTable data={data} />);

    // 最初のカテゴリ（@cat01）が表示される
    expect(screen.getByText("A1101")).toBeInTheDocument();
  });

  it("カテゴリが存在しない場合はハイフンが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        // カテゴリが存在しない
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: "124947000",
      },
    ];

    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("値が文字列として表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: 124947000, // 数値として設定
      },
    ];

    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("124947000")).toBeInTheDocument();
  });

  it("単位が存在しない場合はハイフンが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "00000",
        "@time": "2023000000",
        // @unit が存在しない
        $: "124947000",
      },
    ];

    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("nullデータの場合は空メッセージが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = null as any;

    render(<EstatValuesTable data={data} />);

    expect(
      screen.getByText("表形式で表示できるデータがありません")
    ).toBeInTheDocument();
  });

  it("値のレンダリング関数が正しく動作する", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: "999999999",
      },
    ];

    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("999999999")).toBeInTheDocument();
  });

  it("異なる単位のデータが正しく表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: "124947000",
      },
      {
        "@cat01": "A1102",
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "%",
        $: "11.6",
      },
    ];

    render(<EstatValuesTable data={data} />);

    expect(screen.getByText("人")).toBeInTheDocument();
    expect(screen.getByText("%")).toBeInTheDocument();
  });
});
