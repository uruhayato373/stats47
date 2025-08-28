import type { Meta, StoryObj } from '@storybook/react';
import { StatisticsDisplay } from '../molecules/StatisticsDisplay';

const meta: Meta<typeof StatisticsDisplay> = {
  title: 'Components/StatisticsDisplay',
  component: StatisticsDisplay,
  parameters: {
    docs: {
      description: {
        component: '統計データをグラフやチャートで可視化するコンポーネント。人口、GDP、失業率、人口構成などのデータを表示します。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    data: {
      control: 'object',
      description: '表示する統計データ',
    },
    regionName: {
      control: 'text',
      description: '地域名',
    },
    categoryName: {
      control: 'text',
      description: 'カテゴリ名',
    },
    subcategoryName: {
      control: 'text',
      description: 'サブカテゴリ名',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockData = {
  population: [
    { year: 2019, value: 13929286 },
    { year: 2020, value: 13836251 },
    { year: 2021, value: 13732951 },
    { year: 2022, value: 13636251 },
    { year: 2023, value: 13536251 },
  ],
  gdp: [
    { year: 2019, value: 106.8 },
    { year: 2020, value: 103.9 },
    { year: 2021, value: 105.2 },
    { year: 2022, value: 107.1 },
    { year: 2023, value: 108.5 },
  ],
  unemployment: [
    { year: 2019, value: 2.4 },
    { year: 2020, value: 2.8 },
    { year: 2021, value: 2.8 },
    { year: 2022, value: 2.6 },
    { year: 2023, value: 2.5 },
  ],
  demographics: {
    ageGroups: ['0-14歳', '15-64歳', '65歳以上'],
    values: [12.1, 59.4, 28.5],
  },
};

export const Default: Story = {
  args: {
    data: mockData,
    regionName: '東京都',
  },
};

export const WithCategory: Story = {
  args: {
    data: mockData,
    regionName: '東京都',
    categoryName: '人口・世帯',
  },
};

export const WithSubcategory: Story = {
  args: {
    data: mockData,
    regionName: '東京都',
    categoryName: '人口・世帯',
    subcategoryName: '人口推移',
  },
};

export const EmptyData: Story = {
  args: {
    data: null,
    regionName: '東京都',
  },
};

export const LoadingState: Story = {
  args: {
    data: mockData,
    regionName: '東京都',
  },
  parameters: {
    docs: {
      description: {
        story: 'データ読み込み中の状態を表示',
      },
    },
  },
};
