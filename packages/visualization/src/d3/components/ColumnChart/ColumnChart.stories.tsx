import type { Meta, StoryObj } from "@storybook/react";

import type { ChartDataNode } from "../../types/base";
import { ColumnChart } from "./ColumnChart";

const meta: Meta<typeof ColumnChart> = {
  title: "Features/Visualization/D3/ColumnChart",
  component: ColumnChart,
  tags: ["autodocs"],
  argTypes: {
    width: { control: { type: "number", min: 300, max: 1200, step: 50 } },
    height: { control: { type: "number", min: 200, max: 800, step: 50 } },
    isLoading: { control: "boolean" },
  },
};

export default meta;
type Story = StoryObj<typeof ColumnChart>;

// Simplified mock data based on the Observable example
const mockData: ChartDataNode[] = [
  { name: "CA", value: 15831484, state: "CA", "<10": 4822023, "10-19": 5085432, "20-29": 5924049 },
  { name: "TX", value: 12166055, state: "TX", "<10": 3985631, "10-19": 4115931, "20-29": 4064493 },
  { name: "FL", value: 7094631, state: "FL", "<10": 2198118, "10-19": 2303512, "20-29": 2593001 },
  { name: "NY", value: 7094631, state: "NY", "<10": 2198118, "10-19": 2303512, "20-29": 2593001 },
  { name: "PA", value: 4605804, state: "PA", "<10": 1412336, "10-19": 1511370, "20-29": 1682098 },
];

const ageKeys = ["<10", "10-19", "20-29"];

export const Default: Story = {
  args: {
    data: mockData,
    indexBy: "state",
    keys: ageKeys,
    width: 800,
    height: 500,
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    data: [],
    isLoading: true,
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
