import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import type { HierarchyDataNode } from "../../types/base";
import { TreemapChart } from ".";

const meta: Meta<typeof TreemapChart> = {
  title: "Features/Visualization/D3/TreemapChart",
  component: TreemapChart,
  tags: ["autodocs"],
  argTypes: {
    width: { control: { type: "number", min: 200, max: 1000, step: 50 } },
    height: { control: { type: "number", min: 200, max: 800, step: 50 } },
    isLoading: { control: "boolean" },
  },
  args: {
    onNodeClick: fn(),
  },
};

export default meta;
type Story = StoryObj<typeof TreemapChart>;

const mockData: HierarchyDataNode = {
  name: "Root",
  children: [
    {
      name: "Category A",
      children: [
        { name: "A1", value: 100 },
        { name: "A2", value: 80 },
        { name: "A3", value: 60 },
      ],
    },
    {
      name: "Category B",
      children: [
        { name: "B1", value: 120 },
        { name: "B2", value: 90 },
      ],
    },
    {
      name: "Category C",
      children: [
        { name: "C1", value: 70 },
        { name: "C2", value: 50 },
        { name: "C3", value: 40 },
        { name: "C4", value: 30 },
      ],
    },
    {
      name: "Category D",
      value: 150,
    },
  ],
};

export const Default: Story = {
  args: {
    data: mockData,
    width: 600,
    height: 400,
  },
};

export const TwoLevels: Story = {
  args: {
    ...Default.args,
    data: {
      name: "Root",
      children: [
        { name: "Alpha", value: 100 },
        { name: "Beta", value: 85 },
        { name: "Gamma", value: 70 },
        { name: "Delta", value: 60 },
      ],
    },
  },
};

export const Empty: Story = {
  args: {
    ...Default.args,
    data: { name: "Root", children: [] },
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const WithClickHandler: Story = {
  args: {
    ...Default.args,
    onNodeClick: (node) => alert(`Clicked on: ${node.name}`),
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
