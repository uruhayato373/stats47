import type { Meta, StoryObj } from "@storybook/react";
import Message from "./Message";

const meta: Meta<typeof Message> = {
  title: "Components/Common/Message",
  component: Message,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "メッセージ表示用の共通コンポーネント。成功、エラー、情報、警告の4種類のメッセージタイプに対応しています。",
      },
    },
  },
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["success", "error", "info", "warning"],
      description: "メッセージのタイプ",
    },
    message: {
      control: { type: "text" },
      description: "表示するメッセージ",
    },
    className: {
      control: { type: "text" },
      description: "追加のCSSクラス名",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// 成功メッセージ
export const Success: Story = {
  args: {
    type: "success",
    message: "データの保存が完了しました",
  },
};

// エラーメッセージ
export const Error: Story = {
  args: {
    type: "error",
    message: "エラーが発生しました。もう一度お試しください。",
  },
};

// 情報メッセージ
export const Info: Story = {
  args: {
    type: "info",
    message: "新しい機能が利用可能になりました",
  },
};

// 警告メッセージ
export const Warning: Story = {
  args: {
    type: "warning",
    message: "保存する前に変更内容を確認してください",
  },
};

// カスタムクラス付き
export const WithCustomClass: Story = {
  args: {
    type: "success",
    message: "カスタムスタイルが適用されたメッセージ",
    className: "mt-4 shadow-lg",
  },
};

// 長いメッセージ
export const LongMessage: Story = {
  args: {
    type: "info",
    message:
      "これは非常に長いメッセージの例です。実際のアプリケーションでは、ユーザーに対して詳細な情報や手順を提供するために使用されることがあります。",
  },
};

// 日本語メッセージ
export const JapaneseMessage: Story = {
  args: {
    type: "success",
    message:
      "統計表ID 0003448237 のメタ情報を正常に保存しました。データベースへの反映には数分かかる場合があります。",
  },
};
