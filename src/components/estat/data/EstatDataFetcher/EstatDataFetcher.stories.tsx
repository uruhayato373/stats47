import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "@storybook/test";
import EstatDataFetcher from "./EstatDataFetcher";
import { GetStatsDataParams } from "@/lib/estat/types";

const meta: Meta<typeof EstatDataFetcher> = {
  title: "Estat/EstatDataFetcher",
  component: EstatDataFetcher,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Stat APIから統計データを取得するためのパラメータ入力フォームコンポーネントです。統計表ID、分類、地域、時間軸のパラメータを設定できます。",
      },
    },
  },
  argTypes: {
    onSubmit: {
      description: "フォーム送信時に呼び出されるコールバック関数",
      action: "submitted",
    },
    loading: {
      description: "データ取得中の状態",
      control: "boolean",
    },
  },
  args: {
    onSubmit: fn(),
    loading: false,
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof EstatDataFetcher>;

// 基本的な使用例
export const Default: Story = {
  args: {
    loading: false,
  },
};

// ローディング状態
export const Loading: Story = {
  args: {
    loading: true,
  },
};

// カスタムパラメータの例
export const WithCustomParams: Story = {
  args: {
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "統計表IDが設定され、その他のパラメータも入力された状態の例です。",
      },
    },
  },
};

// エラー状態のシミュレーション
export const WithError: Story = {
  args: {
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "フォーム送信時にエラーが発生した場合の状態をシミュレートします。",
      },
    },
  },
};

// 最小限のパラメータ
export const MinimalParams: Story = {
  args: {
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "統計表IDのみが設定された最小限のパラメータの例です。",
      },
    },
  },
};

// 大量のパラメータ
export const ManyParams: Story = {
  args: {
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story: "複数の分類、地域、時間軸パラメータが設定された例です。",
      },
    },
  },
};
