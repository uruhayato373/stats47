import type { Meta, StoryObj } from "@storybook/react";
import EstatPrefectureRankingFetcher from "./index";

const meta = {
  title: "estat/prefecture-ranking/EstatPrefectureRankingFetcher",
  component: EstatPrefectureRankingFetcher,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EstatPrefectureRankingFetcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    loading: false,
    onSubmit: (params) => {
      console.log("Form submitted:", params);
    },
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    onSubmit: (params) => {
      console.log("Form submitted:", params);
    },
  },
};
