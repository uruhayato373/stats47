import type { Meta, StoryObj } from "@storybook/nextjs-vite";
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
              {
                "@code": "A1102",
                "@name": "0～14歳人口",
                "@unit": "人",
              },
              {
                "@code": "A1103",
                "@name": "15～64歳人口",
                "@unit": "人",
              },
              {
                "@code": "A1104",
                "@name": "65歳以上人口",
                "@unit": "人",
              },
            ],
          },
        ],
      },
      DATA_INF: {
        NOTE: [
          {
            "@char": "※",
            $: "このデータは推計値です。",
          },
        ],
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

const meta: Meta<typeof EstatOverview> = {
  title: "Estat/EstatOverview",
  component: EstatOverview,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Stat APIのレスポンスデータの概要を表示するコンポーネントです。基本情報とデータ詳細を折りたたみ可能なセクションで表示します。",
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
type Story = StoryObj<typeof EstatOverview>;

// 基本的な使用例
export const Default: Story = {
  args: {
    data: createSampleData(),
  },
};

// エラー状態のデータ
export const WithError: Story = {
  args: {
    data: {
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
            CLASS_OBJ: [],
          },
          DATA_INF: {
            NOTE: [],
            VALUE: [],
          },
        },
      },
    },
  },
};

// 大量データの例
export const WithLargeDataset: Story = {
  args: {
    data: {
      ...createSampleData(),
      GET_STATS_DATA: {
        ...createSampleData().GET_STATS_DATA,
        STATISTICAL_DATA: {
          ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA,
          DATA_INF: {
            ...createSampleData().GET_STATS_DATA.STATISTICAL_DATA.DATA_INF,
            VALUE: Array.from({ length: 1000 }, (_, i) => ({
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

// 最小限のデータ
export const MinimalData: Story = {
  args: {
    data: {
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
    },
  },
};
