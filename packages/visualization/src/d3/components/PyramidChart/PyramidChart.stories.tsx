import type { Meta, StoryObj } from "@storybook/react";

import { D3PyramidChart } from ".";
import { D3PyramidChartData } from "@stats47/visualization/d3";

const meta: Meta<typeof D3PyramidChart> = {
  title: "Features/Visualization/D3/PyramidChart",
  component: D3PyramidChart,
  tags: ["autodocs"],
  argTypes: {
    width: { control: { type: "number", min: 300, max: 1200, step: 50 } },
    height: { control: { type: "number", min: 200, max: 800, step: 50 } },
  },
};

export default meta;
type Story = StoryObj<typeof D3PyramidChart>;

const mockData2020: D3PyramidChartData[] = [
  { ageGroup: "0～4歳", male: -175, female: 167 },
  { ageGroup: "5～9歳", male: -184, female: 175 },
  { ageGroup: "10～14歳", male: -198, female: 188 },
  { ageGroup: "15～19歳", male: -223, female: 212 },
  { ageGroup: "20～24歳", male: -268, female: 255 },
  { ageGroup: "25～29歳", male: -293, female: 279 },
  { ageGroup: "30～34歳", male: -321, female: 306 },
  { ageGroup: "35～39歳", male: -358, female: 343 },
  { ageGroup: "40～44歳", male: -411, female: 395 },
  { ageGroup: "45～49歳", male: -482, female: 468 },
  { ageGroup: "50～54歳", male: -432, female: 421 },
  { ageGroup: "55～59歳", male: -351, female: 348 },
  { ageGroup: "60～64歳", male: -310, female: 318 },
  { ageGroup: "65～69歳", male: -380, female: 400 },
  { ageGroup: "70～74歳", male: -410, female: 450 },
  { ageGroup: "75～79歳", male: -320, female: 380 },
  { ageGroup: "80～84歳", male: -230, female: 310 },
  { ageGroup: "85～89歳", male: -140, female: 250 },
  { ageGroup: "90～94歳", male: -60, female: 150 },
  { ageGroup: "95～99歳", male: -20, female: 60 },
  { ageGroup: "100歳以上", male: -5, female: 20 },
].map(d => ({ ...d, male: d.male * 10000, female: d.female * 10000 }));

export const Default: Story = {
  args: {
    chartData: mockData2020,
    width: 928,
    height: 600,
  },
};

export const EmptyData: Story = {
  args: {
    ...Default.args,
    chartData: [],
  },
};

export const FewerAgeGroups: Story = {
  args: {
    ...Default.args,
    chartData: mockData2020.filter((_, i) => i % 3 === 0),
    height: 300,
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
