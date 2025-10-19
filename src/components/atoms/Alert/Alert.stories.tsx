import type { Meta, StoryObj } from "@storybook/react";
import Alert from "./Alert";
import { Heart, Star } from "lucide-react";

const meta: Meta<typeof Alert> = {
  title: "Atoms/Alert",
  component: Alert,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "メッセージ表示用の共通コンポーネント。成功・エラー・情報・警告の4種類のメッセージを統一されたスタイルで表示します。",
      },
    },
  },
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["success", "error", "info", "warning"],
      description: "アラートの種類",
    },
    message: {
      control: { type: "text" },
      description: "表示するメッセージ",
    },
    showIcon: {
      control: { type: "boolean" },
      description: "アイコンを表示するかどうか",
    },
    className: {
      control: { type: "text" },
      description: "追加のCSSクラス",
    },
    onDismiss: {
      action: "dismissed",
      description: "閉じるボタンがクリックされた時のコールバック",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

// 基本的な使用例
export const Success: Story = {
  args: {
    type: "success",
    message: "操作が正常に完了しました",
    showIcon: true,
  },
};

export const Error: Story = {
  args: {
    type: "error",
    message: "エラーが発生しました。もう一度お試しください。",
    showIcon: true,
  },
};

export const Info: Story = {
  args: {
    type: "info",
    message: "新しい機能が利用可能になりました",
    showIcon: true,
  },
};

export const Warning: Story = {
  args: {
    type: "warning",
    message: "この操作は取り消すことができません",
    showIcon: true,
  },
};

// アイコンなし
export const WithoutIcon: Story = {
  args: {
    type: "success",
    message: "アイコンなしのメッセージ",
    showIcon: false,
  },
};

// 閉じるボタン付き
export const WithDismiss: Story = {
  args: {
    type: "info",
    message: "このメッセージは閉じることができます",
    showIcon: true,
    onDismiss: () => console.log("Alert dismissed"),
  },
};

// カスタムアイコン
export const WithCustomIcon: Story = {
  args: {
    type: "success",
    message: "カスタムアイコン付きのメッセージ",
    showIcon: true,
    icon: Heart,
  },
};

// 長いメッセージ
export const LongMessage: Story = {
  args: {
    type: "warning",
    message:
      "これは非常に長いメッセージです。複数行にわたる可能性があり、適切に表示される必要があります。ユーザーにとって重要な情報が含まれているため、読みやすく表示されることが重要です。",
    showIcon: true,
  },
};

// カスタムクラス
export const WithCustomClass: Story = {
  args: {
    type: "error",
    message: "カスタムクラス付きのメッセージ",
    showIcon: true,
    className: "border-2 border-dashed",
  },
};

// すべてのバリエーション
export const AllVariants: Story = {
  render: () => (
    <div className="space-y-4">
      <Alert type="success" message="成功メッセージ" />
      <Alert type="error" message="エラーメッセージ" />
      <Alert type="info" message="情報メッセージ" />
      <Alert type="warning" message="警告メッセージ" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "すべてのアラートタイプを並べて表示した例",
      },
    },
  },
};

// ダークモード対応
export const DarkMode: Story = {
  render: () => (
    <div className="dark bg-gray-900 p-4 space-y-4">
      <Alert type="success" message="ダークモードでの成功メッセージ" />
      <Alert type="error" message="ダークモードでのエラーメッセージ" />
      <Alert type="info" message="ダークモードでの情報メッセージ" />
      <Alert type="warning" message="ダークモードでの警告メッセージ" />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "ダークモードでの表示例",
      },
    },
  },
};
