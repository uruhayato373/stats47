import type { Meta, StoryObj } from '@storybook/react';
import { RegionSelector } from './RegionSelector';

const meta: Meta<typeof RegionSelector> = {
  title: 'Components/RegionSelector',
  component: RegionSelector,
  parameters: {
    docs: {
      description: {
        component: '地域（都道府県）を選択するためのドロップダウンコンポーネント。選択された地域の変更を親コンポーネントに通知します。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    selectedRegion: {
      control: 'select',
      options: ['13', '27', '28', '40', '41', '47'],
      description: '選択された地域コード',
    },
    regions: {
      control: 'object',
      description: '地域のリスト',
    },
    onRegionChange: {
      action: 'region-changed',
      description: '地域が変更された時のコールバック',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const mockRegions = [
  { code: '13', name: '東京都' },
  { code: '27', name: '大阪府' },
  { code: '28', name: '兵庫県' },
  { code: '40', name: '福岡県' },
  { code: '41', name: '佐賀県' },
  { code: '47', name: '沖縄県' },
];

export const Default: Story = {
  args: {
    selectedRegion: '13',
    regions: mockRegions,
    onRegionChange: (regionCode: string) => console.log('Region changed:', regionCode),
  },
};

export const WithDifferentRegion: Story = {
  args: {
    selectedRegion: '27',
    regions: mockRegions,
    onRegionChange: (regionCode: string) => console.log('Region changed:', regionCode),
  },
};

export const EmptyRegions: Story = {
  args: {
    selectedRegion: '',
    regions: [],
    onRegionChange: (regionCode: string) => console.log('Region changed:', regionCode),
  },
};
