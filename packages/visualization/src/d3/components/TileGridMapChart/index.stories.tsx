import type { StatsSchema } from "@stats47/types";


import { TileGridMap } from ".";

import { ranking } from "@stats47/mock";
const annualSalesData = ranking.annualSalesAmountPerEmployeeData as StatsSchema[];

import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof TileGridMap> = {
  title: "Components/Organisms/TileGridMap",
  component: TileGridMap,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onPrefectureClick: { action: "clicked" },
  },
};

export default meta;

type Story = StoryObj<typeof TileGridMap>;

export const Default: Story = {
  args: {
    data: annualSalesData,
    colorConfig: {
      colorSchemeType: "sequential",
      colorScheme: "interpolateBlues",
    },
    width: 800,
    height: 600,
  },
};

export const WithoutData: Story = {
  args: {
    ...Default.args,
    data: undefined,
    colorConfig: {
      colorSchemeType: "sequential",
      colorScheme: "interpolateBlues",
    },
  },
};

export const CustomColorScheme: Story = {
  args: {
    ...Default.args,
    data: annualSalesData,
    colorConfig: {
      colorSchemeType: "sequential",
      colorScheme: "interpolateReds",
    },
  },
};

export const WithDivergingScale: Story = {
  args: {
    ...Default.args,
    data: annualSalesData,
    colorConfig: {
      colorSchemeType: "diverging",
      colorScheme: "interpolateRdBu",
      divergingMidpoint: "mean",
    },
  },
};

export const SelectedPrefecture: Story = {
  args: {
    ...Default.args,
    data: annualSalesData,
    colorConfig: {
      colorSchemeType: "sequential",
      colorScheme: "interpolateBlues",
    },
    selectedPrefectureCode: "13000",
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
