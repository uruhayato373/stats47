import { SEQUENTIAL_COLOR_SCHEMES } from "@stats47/visualization/d3";

import { PrefectureMapChart } from ".";

import { geoshape, ranking } from "@stats47/mock";
import type { TopoJSONTopology } from "@stats47/types";
import type { PrefectureMapProps } from "@stats47/visualization/d3";
const annualSalesData = ranking.annualSalesAmountPerEmployeeData;
const criminalRecognitionData = ranking.criminalRecognitionCountData;
const movingInExcessData = ranking.movingInExcessRateJapaneseData;
const jpPrefecturesData = geoshape.jpPrefectures as unknown as TopoJSONTopology;

import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof PrefectureMapChart> = {
  title: "Features/Visualization/D3/PrefectureMapChart",
  component: PrefectureMapChart,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {} as any,
};

export default meta;

type Story = StoryObj<typeof PrefectureMapChart>;

export const Default: Story = {
  args: {
    data: annualSalesData as PrefectureMapProps["data"],
    topology: jpPrefecturesData,
    colorConfig: {
      colorSchemeType: "sequential",
      colorScheme: "interpolatePurples",
    },
    width: 600,
    height: 900,
  },
};

export const WithoutData: Story = {
  args: {
    ...Default.args,
    data: [],
    topology: jpPrefecturesData,
    colorConfig: {
      colorSchemeType: "sequential",
      colorScheme: "interpolateBlues",
    },
  },
};

export const CustomColorScheme: Story = {
  args: {
    ...Default.args,
    data: criminalRecognitionData as PrefectureMapProps["data"],
    topology: jpPrefecturesData,
    colorConfig: {
      colorSchemeType: "sequential",
      colorScheme: "interpolateReds",
    },
  },
};

export const WithDivergingScale: Story = {
  args: {
    ...Default.args,
    data: movingInExcessData as PrefectureMapProps["data"],
    topology: jpPrefecturesData,
    colorConfig: {
      colorSchemeType: "diverging",
      colorScheme: "interpolateRdBu",
      divergingMidpoint: "zero",
      divergingMidpointValue: 0,
    },
  },
};

/**
 * Sequential 色スキームを Controls の select で切り替えるストーリー。
 * colorScheme をトップレベル arg にしているため、Storybook に select が表示される。
 */
export const SequentialColorSchemes: StoryObj<PrefectureMapProps & { colorScheme: string }> = {
  args: {
    colorScheme: "interpolatePurples",
    data: annualSalesData as PrefectureMapProps["data"],
    topology: jpPrefecturesData,
    width: 600,
    height: 900,
  } as any,
  argTypes: {
    data: { table: { disable: true } },
    colorConfig: { table: { disable: true } },
    topology: { table: { disable: true } },
    colorScheme: {
      control: "select",
      options: SEQUENTIAL_COLOR_SCHEMES.map((s) => s.value),
    },
  },
  render: (args: any) => (
    <PrefectureMapChart
      data={args.data}
      topology={args.topology}
      width={args.width}
      height={args.height}
      colorConfig={{
        colorSchemeType: "sequential",
        colorScheme: args.colorScheme ?? "interpolatePurples",
      }}
    />
  ),
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

