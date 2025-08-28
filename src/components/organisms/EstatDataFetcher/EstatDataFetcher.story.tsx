import type { Meta, StoryObj } from "@storybook/react";
import { EstatDataFetcher } from "./EstatDataFetcher";

const meta: Meta<typeof EstatDataFetcher> = {
  title: "Components/Organisms/EstatDataFetcher",
  component: EstatDataFetcher,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Stat APIからデータを取得し、統計情報を表示するコンポーネント。地域コードに基づいてデータを取得し、ローディング状態やエラー状態も管理します。",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    regionCode: {
      control: "select",
      options: ["13", "27", "23", "14", "11", "12", "28", "15", "16", "17"],
      description: "地域コード（都道府県コード）",
    },
    onDataUpdate: {
      action: "data-updated",
      description: "データ更新時のコールバック",
    },
    onLoadingChange: {
      action: "loading-changed",
      description: "ローディング状態変更時のコールバック",
    },
  },
  // グローバルデコレーターでNext.jsのコンテキストを提供
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-gray-50 p-4">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    regionCode: "13",
    onDataUpdate: (data: any) => console.log("Data updated:", data),
    onLoadingChange: (loading: boolean) => console.log("Loading:", loading),
  },
};

export const Tokyo: Story = {
  args: {
    regionCode: "13",
    onDataUpdate: (data: any) => console.log("Tokyo data:", data),
    onLoadingChange: (loading: boolean) =>
      console.log("Tokyo loading:", loading),
  },
};

export const Osaka: Story = {
  args: {
    regionCode: "27",
    onDataUpdate: (data: any) => console.log("Osaka data:", data),
    onLoadingChange: (loading: boolean) =>
      console.log("Osaka loading:", loading),
  },
};

export const Aichi: Story = {
  args: {
    regionCode: "23",
    onDataUpdate: (data: any) => console.log("Aichi data:", data),
    onLoadingChange: (loading: boolean) =>
      console.log("Aichi loading:", loading),
  },
};
