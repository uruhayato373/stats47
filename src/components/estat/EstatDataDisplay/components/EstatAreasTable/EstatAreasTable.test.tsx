import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import EstatAreasTable from "./EstatAreasTable";
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
            "@cat01": "A1101",
            "@area": "01000",
            "@time": "2023000000",
            "@unit": "人",
            $: "5200000",
          },
        ],
      },
    },
  },
});

describe("EstatAreasTable", () => {
  it("正常なデータでレンダリングされる", () => {
    const data = createSampleData();
    render(<EstatAreasTable data={data} />);

    expect(screen.getByText("地域コード")).toBeInTheDocument();
    expect(screen.getByText("地域名")).toBeInTheDocument();
  });

  it("地域コードが正しく表示される", () => {
    const data = createSampleData();
    render(<EstatAreasTable data={data} />);

    expect(screen.getByText("00000")).toBeInTheDocument();
    expect(screen.getByText("01000")).toBeInTheDocument();
  });

  it("地域名が地域コードと同じ値で表示される", () => {
    const data = createSampleData();
    render(<EstatAreasTable data={data} />);

    // 地域名カラムには地域コードと同じ値が表示される
    const areaNameCells = screen.getAllByText("00000");
    expect(areaNameCells.length).toBeGreaterThan(0);
  });

  it("複数のデータ行が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatAreasTable data={data} />);

    expect(screen.getByText("00000")).toBeInTheDocument();
    expect(screen.getByText("01000")).toBeInTheDocument();
  });

  it("空のデータの場合は空メッセージが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [];

    render(<EstatAreasTable data={data} />);

    expect(screen.getByText("地域情報がありません")).toBeInTheDocument();
  });

  it("データが存在しない場合は何も表示されない", () => {
    const data = null as any;
    const { container } = render(<EstatAreasTable data={data} />);

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

    render(<EstatAreasTable data={data} />);

    expect(screen.getByText("00000")).toBeInTheDocument();
  });

  it("地域コードが欠けているデータでも正しく表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        // @area が欠けている
        "@time": "2023000000",
        "@unit": "人",
        $: "124947000",
      },
    ];

    render(<EstatAreasTable data={data} />);

    // 地域コードが欠けている場合は空のセルとして表示される
    expect(screen.getByText("地域コード")).toBeInTheDocument();
    expect(screen.getByText("地域名")).toBeInTheDocument();
  });

  it("nullデータの場合は空メッセージが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = null as any;

    render(<EstatAreasTable data={data} />);

    expect(screen.getByText("地域情報がありません")).toBeInTheDocument();
  });

  it("地域名のレンダリング関数が正しく動作する", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "12345",
        "@time": "2023000000",
        "@unit": "人",
        $: "124947000",
      },
    ];

    render(<EstatAreasTable data={data} />);

    // 地域名カラムには地域コードと同じ値が表示される
    expect(screen.getByText("12345")).toBeInTheDocument();
  });

  it("地域コードがnullの場合はハイフンが表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": null,
        "@time": "2023000000",
        "@unit": "人",
        $: "124947000",
      },
    ];

    render(<EstatAreasTable data={data} />);

    // 地域名カラムにはハイフンが表示される
    expect(screen.getByText("-")).toBeInTheDocument();
  });
});
