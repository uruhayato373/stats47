import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
          {
            "@cat01": "A1101",
            "@area": "00000",
            "@time": "2021000000",
            "@unit": "人",
            $: "125200000",
          },
          {
            "@cat01": "A1101",
            "@area": "00000",
            "@time": "2020000000",
            "@unit": "人",
            $: "125800000",
          },
          {
            "@cat01": "A1101",
            "@area": "00000",
            "@time": "2019000000",
            "@unit": "人",
            $: "126200000",
          },
        ],
      },
    },
  },
});

const meta: Meta<typeof EstatYearsTable> = {
  title: "Estat/EstatYearsTable",
  component: EstatYearsTable,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Stat APIのレスポンスデータから年度情報を表形式で表示するコンポーネントです。年度コードと説明を表示します。",
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
type Story = StoryObj<typeof EstatYearsTable>;

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
            VALUE: Array.from({ length: 20 }, (_, i) => ({
              "@cat01": "A1101",
              "@area": "00000",
              "@time": `${2023 - i}000000`,
              "@unit": "人",
              $: String(Math.floor(Math.random() * 1000000)),
            })),
          },
        },
      },
    },
  },
};

// 年度コードが欠けているデータ
export const MissingTimeCode: Story = {
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
                // @time が欠けている
                "@unit": "人",
                $: "124947000",
              },
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
    },
  },
};

// 異なる年度形式のデータ
export const DifferentTimeFormats: Story = {
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
              {
                "@cat01": "A1101",
                "@area": "00000",
                "@time": "2023010100", // 日次データ
                "@unit": "人",
                $: "124800000",
              },
            ],
          },
        },
      },
    },
  },
};
