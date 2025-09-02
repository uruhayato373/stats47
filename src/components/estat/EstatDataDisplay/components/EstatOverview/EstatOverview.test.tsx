import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import EstatOverview from "./EstatOverview";
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
        CYCLE: "年次",
        SURVEY_DATE: "2023年",
        GOV_ORG: {
          "@code": "00200521",
          "@name": "総務省",
        },
        STATISTICS_NAME: { $: "人口推計" },
        TABULATION_CATEGORY: { $: "人口・世帯" },
        TABULATION_SUB_CATEGORY1: { $: "人口" },
        TABULATION_SUB_CATEGORY2: { $: "年齢別人口" },
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "cat01",
            "@name": "年齢（3区分）",
            CLASS: [
              {
                "@code": "A1101",
                "@name": "総人口",
                "@unit": "人",
              },
            ],
          },
        ],
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

describe("EstatOverview", () => {
  it("正常なデータでレンダリングされる", () => {
    const data = createSampleData();
    render(<EstatOverview data={data} />);

    expect(screen.getByText("基本情報")).toBeInTheDocument();
    expect(screen.getByText("データ詳細")).toBeInTheDocument();
    expect(screen.getByText("統計表ID")).toBeInTheDocument();
    expect(screen.getByText("0003109941")).toBeInTheDocument();
  });

  it("成功ステータスが正しく表示される", () => {
    const data = createSampleData();
    render(<EstatOverview data={data} />);

    expect(screen.getByText("成功")).toBeInTheDocument();
  });

  it("エラーステータスが正しく表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.RESULT.STATUS = 1;
    data.GET_STATS_DATA.RESULT.ERROR_MSG = "エラーが発生しました";

    render(<EstatOverview data={data} />);

    expect(screen.getByText(/エラー \(コード: 1\)/)).toBeInTheDocument();
  });

  it("セクションの折りたたみが動作する", () => {
    const data = createSampleData();
    render(<EstatOverview data={data} />);

    // 基本情報セクションが初期状態で展開されている
    expect(screen.getByText("統計表ID")).toBeInTheDocument();

    // 基本情報セクションをクリックして折りたたむ
    const basicSectionButton = screen.getByText("基本情報").closest("button");
    if (basicSectionButton) {
      fireEvent.click(basicSectionButton);
    }

    // 統計表IDが非表示になる
    expect(screen.queryByText("統計表ID")).not.toBeInTheDocument();
  });

  it("データ詳細セクションの折りたたみが動作する", () => {
    const data = createSampleData();
    render(<EstatOverview data={data} />);

    // データ詳細セクションをクリックして展開
    const dataSectionButton = screen.getByText("データ詳細").closest("button");
    if (dataSectionButton) {
      fireEvent.click(dataSectionButton);
    }

    // データ件数が表示される
    expect(screen.getByText("データ件数")).toBeInTheDocument();
    expect(screen.getByText("1 件")).toBeInTheDocument();
  });

  it("統計表名と表題が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatOverview data={data} />);

    expect(screen.getByText("人口推計")).toBeInTheDocument();
    expect(screen.getByText("年齢（3区分）別人口")).toBeInTheDocument();
  });

  it("データが存在しない場合は何も表示されない", () => {
    const data = { GET_STATS_DATA: null } as any;
    const { container } = render(<EstatOverview data={data} />);

    expect(container.firstChild).toBeNull();
  });

  it("分類項目数が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatOverview data={data} />);

    // データ詳細セクションを展開
    const dataSectionButton = screen.getByText("データ詳細").closest("button");
    if (dataSectionButton) {
      fireEvent.click(dataSectionButton);
    }

    expect(screen.getByText("分類項目数")).toBeInTheDocument();
    expect(screen.getByText("1 項目")).toBeInTheDocument();
  });

  it("更新日時が正しく表示される", () => {
    const data = createSampleData();
    render(<EstatOverview data={data} />);

    // データ詳細セクションを展開
    const dataSectionButton = screen.getByText("データ詳細").closest("button");
    if (dataSectionButton) {
      fireEvent.click(dataSectionButton);
    }

    expect(screen.getByText("更新日時")).toBeInTheDocument();
    expect(screen.getByText("2024-01-15T10:30:00+09:00")).toBeInTheDocument();
  });

  it("配列データの件数が正しく表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = [
      {
        "@cat01": "A1101",
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: "100",
      },
      {
        "@cat01": "A1102",
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: "200",
      },
      {
        "@cat01": "A1103",
        "@area": "00000",
        "@time": "2023000000",
        "@unit": "人",
        $: "300",
      },
    ];

    render(<EstatOverview data={data} />);

    // データ詳細セクションを展開
    const dataSectionButton = screen.getByText("データ詳細").closest("button");
    if (dataSectionButton) {
      fireEvent.click(dataSectionButton);
    }

    expect(screen.getByText("3 件")).toBeInTheDocument();
  });

  it("単一データの件数が正しく表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = {
      "@cat01": "A1101",
      "@area": "00000",
      "@time": "2023000000",
      "@unit": "人",
      $: "100",
    } as any;

    render(<EstatOverview data={data} />);

    // データ詳細セクションを展開
    const dataSectionButton = screen.getByText("データ詳細").closest("button");
    if (dataSectionButton) {
      fireEvent.click(dataSectionButton);
    }

    expect(screen.getByText("1 件")).toBeInTheDocument();
  });

  it("データが存在しない場合は0件と表示される", () => {
    const data = createSampleData();
    data.GET_STATS_DATA.STATISTICAL_DATA.DATA_INF.VALUE = null as any;

    render(<EstatOverview data={data} />);

    // データ詳細セクションを展開
    const dataSectionButton = screen.getByText("データ詳細").closest("button");
    if (dataSectionButton) {
      fireEvent.click(dataSectionButton);
    }

    expect(screen.getByText("0 件")).toBeInTheDocument();
  });
});
