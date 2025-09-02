import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EstatRawData from "./EstatRawData";
import { EstatStatsDataResponse } from "@/types/estat";

// navigator.clipboard.writeText のモック
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

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

describe("EstatRawData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常なデータでレンダリングされる", () => {
    const data = createSampleData();
    render(<EstatRawData data={data} />);

    expect(screen.getByText("コピー")).toBeInTheDocument();
    expect(screen.getByText('"人口推計"')).toBeInTheDocument();
  });

  it("JSONデータが正しく表示される", () => {
    const data = createSampleData();
    render(<EstatRawData data={data} />);

    // JSONの一部が表示されていることを確認
    expect(screen.getByText('"GET_STATS_DATA"')).toBeInTheDocument();
    expect(screen.getByText('"STATISTICAL_DATA"')).toBeInTheDocument();
    expect(screen.getByText('"124947000"')).toBeInTheDocument();
  });

  it("コピーボタンがクリックされたときにクリップボードにコピーされる", async () => {
    const data = createSampleData();
    render(<EstatRawData data={data} />);

    const copyButton = screen.getByText("コピー");
    fireEvent.click(copyButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      JSON.stringify(data, null, 2)
    );
  });

  it("複雑なデータ構造でも正しく表示される", () => {
    const data = {
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
            STAT_NAME: { $: "複雑な統計データ" },
            TITLE: { $: "多層構造のデータ例" },
            GOV_ORG: {
              "@code": "00200521",
              "@name": "総務省",
              SUB_ORG: [
                { "@code": "001", "@name": "統計局" },
                { "@code": "002", "@name": "政策統括官" },
              ],
            },
          },
          CLASS_INF: {
            CLASS_OBJ: [],
          },
          DATA_INF: {
            NOTE: [],
            VALUE: [],
          },
        },
      },
    };

    render(<EstatRawData data={data} />);

    expect(screen.getByText('"複雑な統計データ"')).toBeInTheDocument();
    expect(screen.getByText('"多層構造のデータ例"')).toBeInTheDocument();
    expect(screen.getByText('"総務省"')).toBeInTheDocument();
  });

  it("エラー状態のデータでも正しく表示される", () => {
    const data = {
      GET_STATS_DATA: {
        RESULT: {
          STATUS: 1,
          ERROR_MSG: "統計データが見つかりません",
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
            VALUE: [],
          },
        },
      },
    };

    render(<EstatRawData data={data} />);

    expect(
      screen.getByText('"統計データが見つかりません"')
    ).toBeInTheDocument();
  });

  it("空のデータでも正しく表示される", () => {
    const data = {
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
            STAT_NAME: { $: "テスト統計" },
            TITLE: { $: "テストデータ" },
          },
          CLASS_INF: {
            CLASS_OBJ: [],
          },
          DATA_INF: {
            NOTE: [],
            VALUE: [],
          },
        },
      },
    };

    render(<EstatRawData data={data} />);

    expect(screen.getByText('"テスト統計"')).toBeInTheDocument();
    expect(screen.getByText('"テストデータ"')).toBeInTheDocument();
  });

  it("大量データでも正しく表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = Array.from(
      { length: 100 },
      (_, i) => ({
        "@cat01": `A${String(i + 1).padStart(4, "0")}`,
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: String(Math.floor(Math.random() * 1000000)),
      })
    );

    render(<EstatRawData data={data} />);

    // 大量データでも表示されることを確認
    expect(screen.getByText('"GET_STATS_DATA"')).toBeInTheDocument();
  });

  it("JSONの整形が正しく行われる", () => {
    const data = createSampleData();
    render(<EstatRawData data={data} />);

    // JSON.stringify(data, null, 2) で整形されたJSONが表示される
    const jsonString = JSON.stringify(data, null, 2);
    expect(screen.getByText(jsonString.split('"')[1])).toBeInTheDocument();
  });

  it("コピーボタンのスタイリングが正しい", () => {
    const data = createSampleData();
    render(<EstatRawData data={data} />);

    const copyButton = screen.getByText("コピー");
    expect(copyButton).toHaveClass(
      "py-1.5",
      "px-3",
      "inline-flex",
      "items-center"
    );
  });

  it("JSON表示エリアのスタイリングが正しい", () => {
    const data = createSampleData();
    render(<EstatRawData data={data} />);

    const jsonArea = screen.getByText('"GET_STATS_DATA"').closest("div");
    expect(jsonArea).toHaveClass(
      "bg-gray-900",
      "rounded-lg",
      "p-4",
      "overflow-x-auto"
    );
  });
});
