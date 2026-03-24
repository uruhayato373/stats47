import type { Meta, StoryObj } from "@storybook/react";
import { Scatterplot } from "./Scatterplot";
import type { ScatterplotDataNode } from "./types";

const meta: Meta<typeof Scatterplot> = {
    title: "Features/Visualization/D3/Scatterplot",
    component: Scatterplot,
    parameters: {
        layout: "padded",
    },
    tags: ["autodocs"],
    argTypes: {
        xType: {
            control: "select",
            options: ["linear", "log", "time"],
        },
        yType: {
            control: "select",
            options: ["linear", "log", "time"],
        },
        fill: { control: "color" },
        stroke: { control: "color" },
    },
};

export default meta;

type Story = StoryObj<typeof Scatterplot>;

// 基本的なデータセット
const basicData: ScatterplotDataNode[] = Array.from({ length: 50 }, (_, i) => ({
    x: Math.random() * 100,
    y: Math.random() * 100,
    label: `Point ${i + 1}`,
    category: i % 2 === 0 ? "Category A" : "Category B",
}));

export const Default: Story = {
    args: {
        data: basicData,
        width: 640,
        height: 400,
        xLabel: "X Axis Label",
        yLabel: "Y Axis Label",
        title: "Basic Scatterplot",
        fill: "steelblue",
        stroke: "white",
        strokeWidth: 1,
    },
};

// 対数スケールのデータ
const logData: ScatterplotDataNode[] = Array.from({ length: 50 }, (_, i) => ({
    x: Math.pow(10, Math.random() * 4),
    y: Math.pow(10, Math.random() * 4),
    label: `Point ${i + 1}`,
}));

export const LogScale: Story = {
    args: {
        data: logData,
        xType: "log",
        yType: "log",
        xLabel: "X Axis (Log)",
        yLabel: "Y Axis (Log)",
        title: "Logarithmic Scale Scatterplot",
        fill: "indianred",
        stroke: "white",
        grid: true,
    },
};

// 時系列データの例
const now = new Date();
const timeData: ScatterplotDataNode[] = Array.from({ length: 30 }, (_, i) => ({
    x: new Date(now.getTime() - (30 - i) * 24 * 60 * 60 * 1000),
    y: Math.random() * 100,
    label: `Date ${i + 1}`,
}));

export const TimeScale: Story = {
    args: {
        data: timeData,
        xType: "time",
        xLabel: "Date",
        yLabel: "Value",
        title: "Time Scale Scatterplot",
        fill: "mediumseagreen",
        stroke: "white",
        r: 5,
    },
};

export const Loading: Story = {
    args: {
        data: [],
        isLoading: true,
        title: "Loading State",
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
