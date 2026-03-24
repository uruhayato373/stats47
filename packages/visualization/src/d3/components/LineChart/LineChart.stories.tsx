import type { Meta, StoryObj } from "@storybook/react";

import type { TimeSeriesDataNode } from "./types";
import { D3LineChart } from "./index";

const meta: Meta<typeof D3LineChart> = {
  title: "Features/Visualization/D3/LineChart",
  component: D3LineChart,
  tags: ["autodocs"],
  argTypes: {
    width: { control: { type: "number", min: 300, max: 1200, step: 50 } },
    height: { control: { type: "number", min: 200, max: 800, step: 50 } },
    showLegend: { control: "boolean" },
    isLoading: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof D3LineChart>;

const singleSeriesData: TimeSeriesDataNode[] = [
  { category: "2015", label: "2015年度", value: 580 },
  { category: "2016", label: "2016年度", value: 610 },
  { category: "2017", label: "2017年度", value: 620 },
  { category: "2018", label: "2018年度", value: 640 },
  { category: "2019", label: "2019年度", value: 650 },
  { category: "2020", label: "2020年度", value: 630 },
  { category: "2021", label: "2021年度", value: 660 },
];

export const Default: Story = {
  args: {
    data: singleSeriesData,
    categoryKey: "category",
    valueKey: "value",
    width: 800,
    height: 250,
    title: "単一系列の推移",
  },
};

const multiSeriesData: TimeSeriesDataNode[] = [
  { category: "2015", label: "2015年度", 男性: 610, 女性: 550 },
  { category: "2016", label: "2016年度", 男性: 620, 女性: 560 },
  { category: "2017", label: "2017年度", 男性: 630, 女性: 570 },
  { category: "2018", label: "2018年度", 男性: 640, 女性: 580 },
  { category: "2019", label: "2019年度", 男性: 650, 女性: 590 },
  { category: "2020", label: "2020年度", 男性: 630, 女性: 600 },
  { category: "2021", label: "2021年度", 男性: 660, 女性: 610 },
];

export const MultiSeries: Story = {
  args: {
    data: multiSeriesData,
    categoryKey: "category",
    series: [
      { dataKey: "男性", name: "男性", color: "#1f77b4" },
      { dataKey: "女性", name: "女性", color: "#ff7f0e" },
    ],
    showLegend: true,
    width: 800,
    height: 250,
    title: "複数系列の推移",
  },
};

export const Empty: Story = {
  args: {
    data: [],
    categoryKey: "category",
    valueKey: "value",
    width: 800,
    height: 250,
    title: "データなし",
  },
};
