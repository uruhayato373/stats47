import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
          {
            "@cat01": "A1103",
            "@area": "00000",
            "@time": "2023000000",
            "@unit": "人",
            $: "74000000",
          },
          {
            "@cat01": "A1104",
            "@area": "00000",
            "@time": "2023000000",
            "@unit": "人",
            $: "36447000",
          },
        ],
      },
    },
  },
});

const meta: Meta<typeof EstatValuesTable> = {
  title: "Estat/EstatValuesTable",
  component: EstatValuesTable,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Stat APIのレスポンスデータから統計値を表形式で表示するコンポーネントです。カテゴリ、地域、年度、値、単位を表示します。",
      },
    },
  },
  argTypes: {
    data: {
      description: "e-Stat APIのレスポンスデータ",
      control: false,
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EstatValuesTable>;

// 基本的な使用例
export const Default: Story = {
  args: {
    data: createSampleData(),
  },
};

// 空のデータ
export const Empty: Story = {
  args: {
    data: {
      ...createSampleData(),
      GET_STATS_DATA: {
        ...createSampleData().GET_STATS_DATA,
        STATISTICAL_DATA: {
          ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA.DATA_INF,
            VALUE: [],
          },
        },
      },
    },
  },
};

// 単一データ
export const SingleData: Story = {
  args: {
    data: {
      ...createSampleData(),
      GET_STATS_DATA: {
        ...createSampleData().GET_STATS_DATA,
        STATISTICAL_DATA: {
          ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA.DATA_INF,
            VALUE: {
              "@cat01": "A1101",
              "@area": "00000",
              "@time": "2023000000",
              "@unit": "人",
              $: "124947000",
            },
          },
        },
      },
    },
  },
};

// 大量データ
export const LargeDataset: Story = {
  args: {
    data: {
      ...createSampleData(),
      GET_STATS_DATA: {
        ...createSampleData().GET_STATS_DATA,
        STATISTICAL_DATA: {
          ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA.DATA_INF,
            VALUE: Array.from({ length: 50 }, (_, i) => ({
              "@cat01": `A${String(i + 1).padStart(4, "0")}`,
              "@area": "00000",
              "@time": "2023000000",
              "@unit": "人",
              $: String(Math.floor(Math.random() * 1000000)),
            })),
          },
        },
      },
    },
  },
};

// 複数カテゴリのデータ
export const MultipleCategories: Story = {
  args: {
    data: {
      ...createSampleData(),
      GET_STATS_DATA: {
        ...createSampleData().GET_STATS_DATA,
        STATISTICAL_DATA: {
          ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA.DATA_INF,
            VALUE: [
              {
                "@cat01": "A1101",
                "@cat02": "B2201",
                "@area": "00000",
                "@time": "2023000000",
                "@unit": "人",
                $: "124947000",
              },
              {
                "@cat01": "A1102",
                "@cat02": "B2202",
                "@area": "00000",
                "@time": "2023000000",
                "@unit": "人",
                $: "14500000",
              },
              {
                "@cat01": "A1103",
                "@cat02": "B2203",
                "@area": "00000",
                "@time": "2023000000",
                "@unit": "人",
                $: "74000000",
              },
            ],
          },
        },
      },
    },
  },
};

// 異なる地域のデータ
export const DifferentAreas: Story = {
  args: {
    data: {
      ...createSampleData(),
      GET_STATS_DATA: {
        ...createSampleData().GET_STATS_DATA,
        STATISTICAL_DATA: {
          ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA.DATA_INF,
            VALUE: [
              {
                "@cat01": "A1101",
                "@area": "00000", // 全国
                "@time": "2023000000",
                "@unit": "人",
                $: "124947000",
              },
              {
                "@cat01": "A1101",
                "@area": "01000", // 北海道
                "@time": "2023000000",
                "@unit": "人",
                $: "5200000",
              },
              {
                "@cat01": "A1101",
                "@area": "13000", // 東京都
                "@time": "2023000000",
                "@unit": "人",
                $: "14000000",
              },
            ],
          },
        },
      },
    },
  },
};

// 異なる年度のデータ
export const DifferentYears: Story = {
  args: {
    data: {
      ...createSampleData(),
      GET_STATS_DATA: {
        ...createSampleData().GET_STATS_DATA,
        STATISTICAL_DATA: {
          ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA.DATA_INF,
            VALUE: [
              {
                "@cat01": "A1101",
                "@area": "00000",
                "@time": "2023000000", // 2023年
                "@unit": "人",
                $: "124947000",
              },
              {
                "@cat01": "A1101",
                "@area": "00000",
                "@time": "2022000000", // 2022年
                "@unit": "人",
                $: "125000000",
              },
              {
                "@cat01": "A1101",
                "@area": "00000",
                "@time": "2021000000", // 2021年
                "@unit": "人",
                $: "125200000",
              },
            ],
          },
        },
      },
    },
  },
};

// 単位が異なるデータ
export const DifferentUnits: Story = {
  args: {
    data: {
      ...createSampleData(),
      GET_STATS_DATA: {
        ...createSampleData().GET_STATS_DATA,
        STATISTICAL_DATA: {
          ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA.DATA_INF,
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
                "@unit": "%",
                $: "11.6",
              },
              {
                "@cat01": "A1103",
                "@area": "00000",
                "@time": "2023000000",
                "@unit": "千円",
                $: "3500000",
              },
            ],
          },
        },
      },
    },
  },
};
