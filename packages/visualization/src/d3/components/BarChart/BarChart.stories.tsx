import type { Meta, StoryObj } from "@storybook/react";
import type { ChartDataNode } from "../../types/base";
import { BarChart } from "./BarChart";

const meta: Meta<typeof BarChart> = {
    title: "Features/Visualization/D3/BarChart",
    component: BarChart,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        width: { control: { type: "number", min: 300, max: 1200, step: 50 } },
        height: { control: { type: "number", min: 200, max: 800, step: 50 } },
    },
};

export default meta;

type Story = StoryObj<typeof BarChart>;

const mockData: ChartDataNode[] = [
    { name: "東京", value: 500, "20代": 120, "30代": 150, "40代": 130, "50代": 100 },
    { name: "神奈川", value: 340, "20代": 80, "30代": 100, "40代": 90, "50代": 70 },
    { name: "大阪", value: 380, "20代": 90, "30代": 110, "40代": 100, "50代": 80 },
    { name: "愛知", value: 285, "20代": 70, "30代": 80, "40代": 75, "50代": 60 },
    { name: "福岡", value: 245, "20代": 60, "30代": 70, "40代": 65, "50代": 50 },
];

const keys = ["20代", "30代", "40代", "50代"];

const singleSeriesData: ChartDataNode[] = [
    { name: "項目A", value: 120 },
    { name: "項目B", value: 85 },
    { name: "項目C", value: 200 },
    { name: "項目D", value: 55 },
    { name: "項目E", value: 160 },
];

export const SingleSeries: Story = {
    args: {
        data: singleSeriesData,
        valueKey: "value",
        indexBy: "name",
        title: "単一系列の横棒グラフ",
        xLabel: "値",
        yLabel: "項目",
        unit: "件",
    },
};

export const Default: Story = {
    args: {
        data: mockData,
        keys: keys,
        title: "年齢層別 人口構成（主要都市）",
        xLabel: "人口 (万人)",
        yLabel: "都市名",
        unit: "万人",
    },
};

const revenueData: ChartDataNode[] = [
    { name: "Q1", value: 900, "サービス": 450, "製品": 300, "保守": 150 },
    { name: "Q2", value: 940, "サービス": 500, "製品": 280, "保守": 160 },
    { name: "Q3", value: 955, "サービス": 480, "製品": 320, "保守": 155 },
    { name: "Q4", value: 1080, "サービス": 550, "製品": 350, "保守": 180 },
];

export const Revenue: Story = {
    args: {
        data: revenueData,
        keys: ["サービス", "製品", "保守"],
        title: "四半期別 売上構成",
        unit: "万円",
        marginLeft: 60,
    },
};

export const Loading: Story = {
    args: {
        data: [],
        keys: [],
        isLoading: true,
        title: "ロード中",
    },
};

export const Landscape: Story = {
    args: {
        ...Default.args,
        width: 1920,
        height: 1080,
        title: "Landscape (16:9)",
    },
};

export const Square: Story = {
    args: {
        ...Default.args,
        width: 1080,
        height: 1080,
        title: "Square (1:1)",
    },
};

export const Portrait: Story = {
    args: {
        ...Default.args,
        width: 1080,
        height: 1920,
        title: "Portrait (9:16)",
    },
};
