import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EstatYearsTable from "./EstatYearsTable";
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
            "@area": "00000",
            "@time": "2023000000",
            "@unit": "人",
            $: "124947000",
          },
          {
            "@cat01": "A1101",
            "@area": "00000",
            "@time": "2022000000",
            "@unit": "人",
            $: "125000000",
          },
        ],
      },
    },
  },
});

describe("EstatYearsTable", () => {
  it("正常なデータでレンダリングされる", () => {
    const data = createSampleData();
    render(<EstatYearsTable data={data} />);

    expect(screen.getByText("年度")).toBeInTheDocument();
    expect(screen.getByText("説明")).toBeInTheDocument();
  });

  it("年度コードが正しく表示される", () => {
    const data = createSampleData();
    render(<EstatYearsTable data={data} />);

    expect(screen.getByText("2023000000")).toBeInTheDocument();
    expect(screen.getByText("2022000000")).toBeInTheDocument();
  });

  it("説明が年度コードと同じ値で表示される", () => {
    const data = createSampleData();
    render(<EstatYearsTable data={data} />);

    // 説明カラムには年度コードと同じ値が表示される
    const timeDescCells = screen.getAllByText("2023000000");
    expect(timeDescCells.length).toBeGreaterThan(0);
  });

  it("複数のデータ行が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatYearsTable data={data} />);

    expect(screen.getByText("2023000000")).toBeInTheDocument();
    expect(screen.getByText("2022000000")).toBeInTheDocument();
  });

  it("空のデータの場合は空メッセージが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [];

    render(<EstatYearsTable data={data} />);

    expect(screen.getByText("年度情報がありません")).toBeInTheDocument();
  });

  it("データが存在しない場合は何も表示されない", () => {
    const data = null as any;
    const { container } = render(<EstatYearsTable data={data} />);

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

    render(<EstatYearsTable data={data} />);

    expect(screen.getByText("2023000000")).toBeInTheDocument();
  });

  it("年度コードが欠けているデータでも正しく表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "00000",
        // @time が欠けている
        "@unit": "人",
        $: "124947000",
      },
    ];

    render(<EstatYearsTable data={data} />);

    // 年度コードが欠けている場合は空のセルとして表示される
    expect(screen.getByText("年度")).toBeInTheDocument();
    expect(screen.getByText("説明")).toBeInTheDocument();
  });

  it("nullデータの場合は空メッセージが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = null as any;

    render(<EstatYearsTable data={data} />);

    expect(screen.getByText("年度情報がありません")).toBeInTheDocument();
  });

  it("説明のレンダリング関数が正しく動作する", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "00000",
        "@time": "2023010000",
        "@unit": "人",
        $: "124947000",
      },
    ];

    render(<EstatYearsTable data={data} />);

    // 説明カラムには年度コードと同じ値が表示される
    expect(screen.getByText("2023010000")).toBeInTheDocument();
  });

  it("年度コードがnullの場合はハイフンが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "00000",
        "@time": null,
        "@unit": "人",
        $: "124947000",
      },
    ];

    render(<EstatYearsTable data={data} />);

    // 説明カラムにはハイフンが表示される
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("異なる年度形式のデータが正しく表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "00000",
        "@time": "2023000000", // 年次データ
        "@unit": "人",
        $: "124947000",
      },
      {
        "@cat01": "A1101",
        "@area": "00000",
        "@time": "2023010000", // 月次データ
        "@unit": "人",
        $: "124900000",
      },
    ];

    render(<EstatYearsTable data={data} />);

    expect(screen.getByText("2023000000")).toBeInTheDocument();
    expect(screen.getByText("2023010000")).toBeInTheDocument();
  });
});
