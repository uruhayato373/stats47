import type { Meta, StoryObj } from "@storybook/react";
import { DonutChart } from "./DonutChart";
import type { DonutChartDataNode } from "./types";

const meta: Meta<typeof DonutChart> = {
    title: "Features/Visualization/D3/DonutChart",
    component: DonutChart,
    parameters: {
        layout: "centered",
    },
    tags: ["autodocs"],
    argTypes: {
        innerRadius: { control: { type: "range", min: 0, max: 300, step: 10 } },
        outerRadius: { control: { type: "range", min: 50, max: 300, step: 10 } },
        width: { control: { type: "number", min: 300, max: 1000, step: 100 } },
        height: { control: { type: "number", min: 300, max: 1000, step: 100 } },
    },
};

export default meta;

type Story = StoryObj<typeof DonutChart>;

const mockData: DonutChartDataNode[] = [
    { name: "カテゴリーA", value: 4500 },
    { name: "カテゴリーB", value: 3000 },
    { name: "カテゴリーC", value: 1500 },
    { name: "カテゴリーD", value: 1000 },
    { name: "カテゴリーE", value: 500 },
];

export const Default: Story = {
    args: {
        data: mockData,
        title: "基本のドーナツチャート",
        centerText: "合計",
    },
};

export const CustomRadius: Story = {
    args: {
        data: mockData,
        title: "カスタム半径（細いリング）",
        innerRadius: 200,
        outerRadius: 250,
    },
};

export const PieStyle: Story = {
    args: {
        data: mockData,
        title: "パイチャートスタイル",
        innerRadius: 0,
    },
};

export const Loading: Story = {
    args: {
        data: [],
        isLoading: true,
        title: "ロード中",
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
