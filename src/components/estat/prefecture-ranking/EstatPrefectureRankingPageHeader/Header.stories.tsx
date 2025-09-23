import type { Meta, StoryObj } from "@storybook/react";
import Header from "./Header";

const meta = {
  title: "estat/prefecture-ranking/EstatPrefectureRankingPageHeader",
  component: Header,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Header>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    loading: false,
    currentStatsId: "0003425774",
    onRefresh: () => console.log("Refresh clicked"),
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    currentStatsId: "0003425774",
    onRefresh: () => console.log("Refresh clicked"),
  },
};

export const NoStatsId: Story = {
  args: {
    loading: false,
    currentStatsId: "",
    onRefresh: () => console.log("Refresh clicked"),
  },
};
