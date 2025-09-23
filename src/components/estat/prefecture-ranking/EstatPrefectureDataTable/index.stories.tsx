import type { Meta, StoryObj } from "@storybook/react";
import EstatPrefectureDataTable from "./index";

const meta = {
  title: "estat/prefecture-ranking/EstatPrefectureDataTable",
  component: EstatPrefectureDataTable,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof EstatPrefectureDataTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = [
  {
    areaCode: "13000",
    areaName: "東京都",
    categoryCode: "A",
    timeCode: "2020000000",
    numericValue: 1000000,
    displayValue: "1,000,000",
    unit: "人",
  },
  {
    areaCode: "14000",
    areaName: "神奈川県",
    categoryCode: "A",
    timeCode: "2020000000",
    numericValue: 800000,
    displayValue: "800,000",
    unit: "人",
  },
  {
    areaCode: "27000",
    areaName: "大阪府",
    categoryCode: "A",
    timeCode: "2020000000",
    numericValue: 700000,
    displayValue: "700,000",
    unit: "人",
  },
];

export const Default: Story = {
  args: {
    data: mockData,
    rankingDirection: "desc",
  },
};

export const Empty: Story = {
  args: {
    data: [],
  },
};

export const AscendingOrder: Story = {
  args: {
    data: mockData,
    rankingDirection: "asc",
  },
};
