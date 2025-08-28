import type { Meta, StoryObj } from '@storybook/react';
import { EstatDataFetcher } from '../organisms/EstatDataFetcher';

const meta: Meta<typeof EstatDataFetcher> = {
  title: 'Components/EstatDataFetcher',
  component: EstatDataFetcher,
  parameters: {
    docs: {
      description: {
        component: 'e-Stat APIから統計データを取得するコンポーネント。地域コードに基づいてデータをフェッチし、親コンポーネントに通知します。',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    regionCode: {
      control: 'select',
      options: ['13', '27', '28', '40', '41', '47'],
      description: 'データを取得する地域コード',
    },
    onDataUpdate: {
      action: 'data-updated',
      description: 'データが更新された時のコールバック',
    },
    onLoadingChange: {
      action: 'loading-changed',
      description: 'ローディング状態が変更された時のコールバック',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    regionCode: '13',
    onDataUpdate: (data: any) => console.log('Data updated:', data),
    onLoadingChange: (loading: boolean) => console.log('Loading changed:', loading),
  },
};

export const DifferentRegion: Story = {
  args: {
    regionCode: '27',
    onDataUpdate: (data: any) => console.log('Data updated:', data),
    onLoadingChange: (loading: boolean) => console.log('Loading changed:', loading),
  },
};

export const WithMockData: Story = {
  args: {
    regionCode: '13',
    onDataUpdate: (data: any) => console.log('Data updated:', data),
    onLoadingChange: (loading: boolean) => console.log('Loading changed:', loading),
  },
  parameters: {
    docs: {
      description: {
        story: 'モックデータを使用した表示例',
      },
    },
  },
};
