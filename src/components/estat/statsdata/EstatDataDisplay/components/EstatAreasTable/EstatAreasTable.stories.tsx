import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EstatAreasTable from "./EstatAreasTable";
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
            "@area": "01000",
            "@time": "2023000000",
            "@unit": "人",
            $: "5200000",
          },
          {
            "@cat01": "A1101",
            "@area": "02000",
            "@time": "2023000000",
            "@unit": "人",
            $: "1200000",
          },
          {
            "@cat01": "A1101",
            "@area": "03000",
            "@time": "2023000000",
            "@unit": "人",
            $: "1200000",
          },
          {
            "@cat01": "A1101",
            "@area": "04000",
            "@time": "2023000000",
            "@unit": "人",
            $: "2200000",
          },
        ],
      },
    },
  },
});

const meta: Meta<typeof EstatAreasTable> = {
  title: "Estat/EstatAreasTable",
  component: EstatAreasTable,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Stat APIのレスポンスデータから地域情報を表形式で表示するコンポーネントです。地域コードと地域名を表示します。",
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
type Story = StoryObj<typeof EstatAreasTable>;

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
              "@cat01": "A1101",
              "@area": String(i).padStart(5, "0"),
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

// 地域コードが欠けているデータ
export const MissingAreaCode: Story = {
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
                // @area が欠けている
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
    },
  },
};
