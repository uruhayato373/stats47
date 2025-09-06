import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import EstatCategoriesTable from "./EstatCategoriesTable";
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
          {
            "@cat01": "A1103",
            "@cat02": "B2203",
            "@cat03": "C3303",
            "@cat04": "D4403",
            "@cat05": "E5503",
            "@area": "00000",
            "@time": "2023000000",
            "@unit": "人",
            $: "74000000",
          },
        ],
      },
    },
  },
});

const meta: Meta<typeof EstatCategoriesTable> = {
  title: "Estat/EstatCategoriesTable",
  component: EstatCategoriesTable,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Stat APIのレスポンスデータからカテゴリ情報を表形式で表示するコンポーネントです。カテゴリ01から05までの分類コードを表示します。",
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
type Story = StoryObj<typeof EstatCategoriesTable>;

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

// 一部のカテゴリのみのデータ
export const PartialCategories: Story = {
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
                "@cat03": "C3302",
                "@area": "00000",
                "@time": "2023000000",
                "@unit": "人",
                $: "14500000",
              },
            ],
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
              "@cat02": `B${String(i + 1).padStart(4, "0")}`,
              "@cat03": `C${String(i + 1).padStart(4, "0")}`,
              "@cat04": `D${String(i + 1).padStart(4, "0")}`,
              "@cat05": `E${String(i + 1).padStart(4, "0")}`,
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
              "@cat02": "B2201",
              "@cat03": "C3301",
              "@cat04": "D4401",
              "@cat05": "E5501",
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
