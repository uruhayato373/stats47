import type { Meta, StoryObj } from "@storybook/react";
import { LoadingView } from "./LoadingView";

const meta: Meta<typeof LoadingView> = {
  title: "Atoms/LoadingView",
  component: LoadingView,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ローディング状態を表示するコンポーネント。スピナーアイコンとメッセージを表示し、カスタマイズ可能な高さとメッセージを提供します。",
      },
    },
  },
  argTypes: {
    message: {
      control: "text",
      description: "表示するローディングメッセージ",
    },
    height: {
      control: "text",
      description: "コンテナの高さ（CSS値）",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    message: "データを読み込んでいます...",
    height: "600px",
  },
};

export const CustomMessage: Story = {
  args: {
    message: "統計データを取得中です...",
    height: "400px",
  },
};

export const ShortHeight: Story = {
  args: {
    message: "読み込み中...",
    height: "200px",
  },
};

export const TallHeight: Story = {
  args: {
    message: "大量のデータを処理しています...",
    height: "800px",
  },
};

export const LongMessage: Story = {
  args: {
    message:
      "サーバーから最新の統計情報を取得しています。しばらくお待ちください...",
    height: "500px",
  },
};

export const ShortMessage: Story = {
  args: {
    message: "読み込み中",
    height: "300px",
  },
};

export const DifferentHeights: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">小さいサイズ (200px)</h3>
        <LoadingView message="読み込み中..." height="200px" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">標準サイズ (400px)</h3>
        <LoadingView message="データを読み込んでいます..." height="400px" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">大きいサイズ (600px)</h3>
        <LoadingView message="大量のデータを処理しています..." height="600px" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "異なる高さでの表示例です。",
      },
    },
  },
};

export const DifferentMessages: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">データ取得</h3>
        <LoadingView message="データを読み込んでいます..." height="300px" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">統計処理</h3>
        <LoadingView message="統計データを処理しています..." height="300px" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">API通信</h3>
        <LoadingView message="サーバーと通信中です..." height="300px" />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">ファイル生成</h3>
        <LoadingView message="レポートを生成しています..." height="300px" />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "異なるメッセージでの表示例です。",
      },
    },
  },
};

export const FullWidth: Story = {
  args: {
    message: "データを読み込んでいます...",
    height: "400px",
  },
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        story: "全幅での表示例です。",
      },
    },
  },
};

export const Minimal: Story = {
  args: {
    message: "読み込み中",
    height: "150px",
  },
  parameters: {
    docs: {
      description: {
        story: "最小限のサイズとメッセージでの表示例です。",
      },
    },
  },
};
