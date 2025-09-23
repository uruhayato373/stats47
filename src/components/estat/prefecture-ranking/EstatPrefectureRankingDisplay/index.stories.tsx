import type { Meta, StoryObj } from "@storybook/react";
import EstatPrefectureRankingDisplay from "./index";

const meta = {
  title: "estat/prefecture-ranking/EstatPrefectureRankingDisplay",
  component: EstatPrefectureRankingDisplay,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EstatPrefectureRankingDisplay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  args: {
    loading: true,
    data: null,
    error: null,
    params: null,
  },
};

export const Error: Story = {
  args: {
    loading: false,
    data: null,
    error: "データの取得に失敗しました。",
    params: null,
  },
};

export const Empty: Story = {
  args: {
    loading: false,
    data: null,
    error: null,
    params: null,
  },
};

export const WithData: Story = {
  args: {
    loading: false,
    data: {
      GET_STATS_DATA: {
        STATISTICAL_DATA: {
          DATA_INF: {
            VALUE: [
              {
                "@time": "2020000000",
                "@cat01": "A",
                "@area": "13000",
                $: "100",
              },
              {
                "@time": "2020000000",
                "@cat01": "A",
                "@area": "14000",
                $: "200",
              },
            ],
          },
        },
      },
    },
    error: null,
    params: {
      statsDataId: "0003425774",
      categoryCode: "A",
    },
  },
};
