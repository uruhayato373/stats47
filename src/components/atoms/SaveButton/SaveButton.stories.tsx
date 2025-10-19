import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import SaveButton from "./SaveButton";

const meta: Meta<typeof SaveButton> = {
  title: "Atoms/SaveButton",
  component: SaveButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "保存ボタンコンポーネント。保存状態、結果表示、手動更新機能を提供します。",
      },
    },
  },
  argTypes: {
    onSave: {
      action: "save",
      description: "保存ボタンがクリックされた時のコールバック関数",
    },
    saving: {
      control: "boolean",
      description: "保存中の状態",
    },
    saveResult: {
      description: "保存結果（成功/失敗とメッセージ）",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    saving: false,
    saveResult: null,
  },
};

export const Saving: Story = {
  args: {
    saving: true,
    saveResult: null,
  },
};

export const Success: Story = {
  args: {
    saving: false,
    saveResult: {
      success: true,
      message: "メタ情報を正常に保存しました。画面を更新しています...",
    },
  },
};

export const Error: Story = {
  args: {
    saving: false,
    saveResult: {
      success: false,
      message: "保存に失敗しました。もう一度お試しください。",
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [saving, setSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{
      success: boolean;
      message: string;
    } | null>(null);

    const handleSave = async () => {
      setSaving(true);
      setSaveResult(null);

      // 模擬的な保存処理
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // ランダムに成功/失敗を決定
      const success = Math.random() > 0.3;
      setSaveResult({
        success,
        message: success
          ? "メタ情報を正常に保存しました。画面を更新しています..."
          : "保存に失敗しました。もう一度お試しください。",
      });

      setSaving(false);
    };

    return (
      <div className="w-80">
        <SaveButton
          onSave={handleSave}
          saving={saving}
          saveResult={saveResult}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "インタラクティブな例です。保存ボタンをクリックして動作を確認できます。",
      },
    },
  },
};

export const LongMessage: Story = {
  args: {
    saving: false,
    saveResult: {
      success: true,
      message:
        "大量のメタ情報が正常に保存されました。処理時間は約30秒でした。画面を更新しています...",
    },
  },
};

export const ErrorWithDetails: Story = {
  args: {
    saving: false,
    saveResult: {
      success: false,
      message:
        "データベース接続エラーが発生しました。システム管理者にお問い合わせください。",
    },
  },
};

export const SuccessWithUpdate: Story = {
  args: {
    saving: false,
    saveResult: {
      success: true,
      message: "メタ情報設定が更新されました。画面を更新しています...",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "成功時に更新ボタンが表示される例です。",
      },
    },
  },
};

export const DifferentStates: Story = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-medium mb-2">初期状態</h3>
        <SaveButton
          onSave={() => console.log("保存")}
          saving={false}
          saveResult={null}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">保存中</h3>
        <SaveButton
          onSave={() => console.log("保存")}
          saving={true}
          saveResult={null}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">保存成功</h3>
        <SaveButton
          onSave={() => console.log("保存")}
          saving={false}
          saveResult={{
            success: true,
            message: "メタ情報保存完了。画面を更新しています...",
          }}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">保存失敗</h3>
        <SaveButton
          onSave={() => console.log("保存")}
          saving={false}
          saveResult={{
            success: false,
            message: "保存失敗",
          }}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "異なる状態での表示例です。",
      },
    },
  },
};

export const InForm: Story = {
  render: () => {
    const [formData, setFormData] = useState({
      name: "",
      email: "",
    });
    const [saving, setSaving] = useState(false);
    const [saveResult, setSaveResult] = useState<{
      success: boolean;
      message: string;
    } | null>(null);

    const handleSave = async () => {
      setSaving(true);
      setSaveResult(null);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSaveResult({
        success: true,
        message:
          "メタ情報フォームデータが保存されました。画面を更新しています...",
      });

      setSaving(false);
    };

    return (
      <form className="w-80 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            名前
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, name: e.target.value }))
            }
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
            placeholder="名前を入力してください"
          />
        </div>

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

        <SaveButton
          onSave={handleSave}
          saving={saving}
          saveResult={saveResult}
        />
      </form>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "フォーム内での使用例です。",
      },
    },
  },
};
