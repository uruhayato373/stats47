import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { PasswordInput } from "./PasswordInput";

const meta: Meta<typeof PasswordInput> = {
  title: "Atoms/PasswordInput",
  component: PasswordInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "パスワード入力フィールドコンポーネント。表示/非表示の切り替え、パスワード強度表示機能を提供します。",
      },
    },
  },
  argTypes: {
    showStrength: {
      control: "boolean",
      description: "パスワード強度表示の有無",
    },
    placeholder: {
      control: "text",
      description: "プレースホルダーテキスト",
    },
    disabled: {
      control: "boolean",
      description: "無効化状態",
    },
    value: {
      control: "text",
      description: "入力値",
    },
    onChange: {
      action: "change",
      description: "値変更時のコールバック関数",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "パスワードを入力してください",
  },
};

export const WithStrength: Story = {
  args: {
    placeholder: "パスワードを入力してください",
    showStrength: true,
  },
};

export const WithValue: Story = {
  args: {
    placeholder: "パスワードを入力してください",
    value: "password123",
    showStrength: true,
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "パスワードを入力してください",
    disabled: true,
    value: "password123",
  },
};

export const Interactive: Story = {
  render: () => {
    const [value, setValue] = useState("");

    return (
      <div className="w-80">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          パスワード
        </label>
        <PasswordInput
          placeholder="パスワードを入力してください"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          showStrength={true}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          入力値: {value || "（未入力）"}
        </p>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "インタラクティブな例です。入力値の変更とパスワード強度の表示を確認できます。",
      },
    },
  },
};

export const DifferentStrengths: Story = {
  render: () => {
    const [passwords, setPasswords] = useState({
      weak: "123",
      medium: "password123",
      strong: "Password123!",
    });

    return (
      <div className="space-y-6 w-80">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            弱いパスワード
          </label>
          <PasswordInput
            placeholder="弱いパスワード"
            value={passwords.weak}
            onChange={(e) =>
              setPasswords((prev) => ({ ...prev, weak: e.target.value }))
            }
            showStrength={true}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            普通のパスワード
          </label>
          <PasswordInput
            placeholder="普通のパスワード"
            value={passwords.medium}
            onChange={(e) =>
              setPasswords((prev) => ({ ...prev, medium: e.target.value }))
            }
            showStrength={true}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            強いパスワード
          </label>
          <PasswordInput
            placeholder="強いパスワード"
            value={passwords.strong}
            onChange={(e) =>
              setPasswords((prev) => ({ ...prev, strong: e.target.value }))
            }
            showStrength={true}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "異なる強度のパスワードの例です。",
      },
    },
  },
};

export const FormExample: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      email: "",
      password: "",
      confirmPassword: "",
    });

    return (
      <form className="w-80 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            メールアドレス
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, email: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="メールアドレスを入力してください"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            パスワード
          </label>
          <PasswordInput
            value={formData.password}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, password: e.target.value }))
            }
            showStrength={true}
            placeholder="パスワードを入力してください"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            パスワード確認
          </label>
          <PasswordInput
            value={formData.confirmPassword}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                confirmPassword: e.target.value,
              }))
            }
            placeholder="パスワードを再入力してください"
          />
          {formData.password && formData.confirmPassword && (
            <p
              className={`text-xs mt-1 ${
                formData.password === formData.confirmPassword
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {formData.password === formData.confirmPassword
                ? "パスワードが一致しています"
                : "パスワードが一致しません"}
            </p>
          )}
        </div>

        <button
          type="submit"
          className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          登録
        </button>
      </form>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "フォーム内での使用例です。パスワード確認機能も含まれています。",
      },
    },
  },
};

export const WithoutStrength: Story = {
  args: {
    placeholder: "パスワードを入力してください",
    showStrength: false,
  },
  parameters: {
    docs: {
      description: {
        story: "パスワード強度表示なしの例です。",
      },
    },
  },
};

export const CustomPlaceholder: Story = {
  args: {
    placeholder: "新しいパスワードを設定してください",
    showStrength: true,
  },
};

export const Required: Story = {
  args: {
    placeholder: "パスワードを入力してください",
    required: true,
    showStrength: true,
  },
  parameters: {
    docs: {
      description: {
        story: "必須フィールドの例です。",
      },
    },
  },
};
