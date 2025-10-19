import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import InputField from "./InputField";

const meta: Meta<typeof InputField> = {
  title: "Atoms/InputField",
  component: InputField,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "フォーム入力用のテキストフィールドコンポーネントです。ラベル、プレースホルダー、バリデーション機能をサポートしています。",
      },
    },
  },
  argTypes: {
    name: {
      description: "入力フィールドのname属性",
      control: "text",
    },
    label: {
      description: "ラベルテキスト",
      control: "text",
    },
    placeholder: {
      description: "プレースホルダーテキスト",
      control: "text",
    },
    value: {
      description: "入力値",
      control: "text",
    },
    onChange: {
      description: "値変更時のコールバック関数",
      action: "changed",
    },
    disabled: {
      description: "無効化状態",
      control: "boolean",
    },
    required: {
      description: "必須項目かどうか",
      control: "boolean",
    },
    type: {
      description: "入力タイプ",
      control: "select",
      options: ["text", "email", "password", "number", "tel", "url"],
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof InputField>;

// 基本的な使用例
export const Default: Story = {
  args: {
    name: "username",
    label: "ユーザー名",
    placeholder: "ユーザー名を入力してください",
    value: "",
    disabled: false,
    required: false,
    type: "text",
  },
};

// 必須項目
export const Required: Story = {
  args: {
    name: "email",
    label: "メールアドレス",
    placeholder: "example@domain.com",
    value: "",
    disabled: false,
    required: true,
    type: "email",
  },
};

// 無効化状態
export const Disabled: Story = {
  args: {
    name: "readonly",
    label: "読み取り専用フィールド",
    placeholder: "このフィールドは編集できません",
    value: "読み取り専用の値",
    disabled: true,
    required: false,
    type: "text",
  },
};

// パスワードフィールド
export const Password: Story = {
  args: {
    name: "password",
    label: "パスワード",
    placeholder: "パスワードを入力してください",
    value: "",
    disabled: false,
    required: true,
    type: "password",
  },
};

// 数値入力
export const Number: Story = {
  args: {
    name: "age",
    label: "年齢",
    placeholder: "年齢を入力してください",
    value: "",
    disabled: false,
    required: false,
    type: "number",
  },
};

// 電話番号
export const Phone: Story = {
  args: {
    name: "phone",
    label: "電話番号",
    placeholder: "090-1234-5678",
    value: "",
    disabled: false,
    required: false,
    type: "tel",
  },
};

// URL入力
export const URL: Story = {
  args: {
    name: "website",
    label: "ウェブサイトURL",
    placeholder: "https://example.com",
    value: "",
    disabled: false,
    required: false,
    type: "url",
  },
};
