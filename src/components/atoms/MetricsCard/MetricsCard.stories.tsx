import type { Meta, StoryObj } from "@storybook/react";
import MetricsCard from "./MetricsCard";

const meta: Meta<typeof MetricsCard> = {
  title: "Atoms/MetricsCard",
  component: MetricsCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "アナリティクスメトリクスを表示するカードコンポーネント。数値データ、トレンド表示、期間選択、チャートプレースホルダーを含みます。",
      },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const InContainer: Story = {
  render: () => (
    <div className="w-full max-w-4xl mx-auto">
      <MetricsCard />
    </div>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: "コンテナ内での表示例です。",
      },
    },
  },
};

export const MultipleCards: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">メインアナリティクス</h3>
        <MetricsCard />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">サブアナリティクス</h3>
        <MetricsCard />
      </div>
    </div>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: "複数のメトリクスカードを並べて表示する例です。",
      },
    },
  },
};

export const Responsive: Story = {
  render: () => (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricsCard />
        <MetricsCard />
        <MetricsCard />
      </div>
    </div>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: "レスポンシブレイアウトでの表示例です。",
      },
    },
  },
};

export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-gray-900 p-4">
      <MetricsCard />
    </div>
  ),
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: "ダークモードでの表示例です。",
      },
    },
  },
};

export const WithCustomWidth: Story = {
  render: () => (
    <div className="w-96">
      <MetricsCard />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "カスタム幅での表示例です。",
      },
    },
  },
};

export const Compact: Story = {
  render: () => (
    <div className="w-80">
      <MetricsCard />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "コンパクトなサイズでの表示例です。",
      },
    },
  },
};
