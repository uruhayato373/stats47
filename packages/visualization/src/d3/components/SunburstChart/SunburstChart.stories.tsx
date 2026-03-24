import type { Meta, StoryObj } from "@storybook/react";
import type { HierarchyDataNode } from "../../types/base";
import { SunburstChart } from "./index";

const meta: Meta<typeof SunburstChart> = {
    title: "Features/Visualization/D3/SunburstChart",
    component: SunburstChart,
    parameters: {
        layout: "centered",
    },
};

export default meta;
type Story = StoryObj<typeof SunburstChart>;

// 都道府県財政：歳入決算総額（内訳）のサンプルデータ
const revenueData: HierarchyDataNode = {
    name: "歳入決算総額（都道府県財政）",
    children: [
        { name: "地方税", value: 1000000 },
        { name: "地方譲与税", value: 200000 },
        { name: "地方交付税", value: 500000 },
        { name: "国庫支出金", value: 800000 },
        { name: "地方債", value: 300000 },
        {
            name: "その他",
            children: [
                { name: "使用料・手数料", value: 150000 },
                { name: "財産収入", value: 50000 },
                { name: "寄附金", value: 20000 },
                { name: "繰入・繰越金", value: 100000 },
                { name: "諸収入", value: 80000 },
                { name: "地方特例交付金", value: 30000 },
            ],
        },
    ],
};

export const Default: Story = {
    args: {
        data: revenueData,
        width: 600,
        height: 600,
    },
};

export const Small: Story = {
    args: {
        data: revenueData,
        width: 400,
        height: 400,
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
