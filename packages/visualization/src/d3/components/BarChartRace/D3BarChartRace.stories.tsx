import type { Meta, StoryObj } from "@storybook/react";

import { D3BarChartRace } from "./D3BarChartRace";
import type { BarChartRaceFrame } from "./types";

const meta: Meta<typeof D3BarChartRace> = {
  title: "Features/Visualization/D3/D3BarChartRace",
  component: D3BarChartRace,
  tags: ["autodocs"],
  argTypes: {
    width: { control: { type: "number", min: 100, max: 1200, step: 50 } },
    height: { control: { type: "number", min: 100, max: 800, step: 50 } },
    topN: { control: { type: "number", min: 3, max: 20, step: 1 } },
    duration: { control: { type: "number", min: 100, max: 3000, step: 100 } },
    title: { control: "text" },
    unit: { control: "text" },
    isLoading: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof D3BarChartRace>;

const mockData: BarChartRaceFrame[] = [
  {
    date: "2020",
    items: [
      { name: "Tokyo", value: 100 },
      { name: "Osaka", value: 85 },
      { name: "Nagoya", value: 70 },
      { name: "Fukuoka", value: 60 },
      { name: "Sapporo", value: 50 },
      { name: "Sendai", value: 45 },
      { name: "Hiroshima", value: 40 },
      { name: "Kyoto", value: 35 },
      { name: "Kobe", value: 30 },
      { name: "Saitama", value: 25 },
    ],
  },
  {
    date: "2021",
    items: [
      { name: "Tokyo", value: 110 },
      { name: "Fukuoka", value: 95 }, // Rank up
      { name: "Osaka", value: 90 },
      { name: "Nagoya", value: 75 },
      { name: "Sapporo", value: 55 },
      { name: "Sendai", value: 60 }, // Rank up
      { name: "Hiroshima", value: 42 },
      { name: "Kyoto", value: 38 },
      { name: "Kobe", value: 32 },
      { name: "Saitama", value: 28 },
    ],
  },
  {
    date: "2022",
    items: [
      { name: "Tokyo", value: 120 },
      { name: "Fukuoka", value: 105 },
      { name: "Osaka", value: 92 },
      { name: "Sendai", value: 85 }, // Big rank up
      { name: "Nagoya", value: 80 },
      { name: "Sapporo", value: 60 },
      { name: "Hiroshima", value: 45 },
      { name: "Kyoto", value: 40 },
      { name: "Kobe", value: 35 },
      { name: "Chiba", value: 30 }, // New entry
    ],
  },
];

export const Default: Story = {
  args: {
    data: mockData,
    width: 800,
    height: 500,
    topN: 8,
    duration: 750,
    title: "都市別 人口推移（架空）",
    unit: "万人",
  },
};

export const FewerTopN: Story = {
  args: {
    ...Default.args,
    topN: 5,
    title: "上位5都市",
  },
};

export const SlowerDuration: Story = {
  args: {
    ...Default.args,
    duration: 2000,
    title: "ゆっくり再生",
  },
};

export const EmptyData: Story = {
  args: {
    ...Default.args,
    data: [],
    title: "データなし",
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
    title: "ロード中...",
  },
};

export const Landscape: Story = {
  args: {
    ...Default.args,
    width: 1920,
    height: 1080,
  },
};

export const Square: Story = {
  args: {
    ...Default.args,
    width: 1080,
    height: 1080,
  },
};

export const Portrait: Story = {
  args: {
    ...Default.args,
    width: 1080,
    height: 1920,
  },
};
