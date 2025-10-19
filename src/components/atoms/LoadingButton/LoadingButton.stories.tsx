import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { Search, Save, Download, RefreshCw, Trash2 } from "lucide-react";
import LoadingButton from "./LoadingButton";

const meta: Meta<typeof LoadingButton> = {
  title: "Atoms/LoadingButton",
  component: LoadingButton,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "汎用的なアクションボタンコンポーネント。ローディング状態、サイズバリエーション、カラーバリエーション、アイコン表示に対応しています。",
      },
    },
  },
  argTypes: {
    children: {
      control: "text",
      description: "ボタンのテキスト",
    },
    loading: {
      control: "boolean",
      description: "ローディング状態",
    },
    loadingText: {
      control: "text",
      description: "ローディング時のテキスト",
    },
    disabled: {
      control: "boolean",
      description: "ボタンが無効かどうか",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "ボタンのサイズ",
    },
    variant: {
      control: "select",
      options: ["primary", "secondary", "success", "warning", "danger"],
      description: "ボタンのカラーバリエーション",
    },
    width: {
      control: "select",
      options: ["auto", "full"],
      description: "ボタンの幅",
    },
    iconSize: {
      control: "select",
      options: ["sm", "md", "lg"],
      description: "アイコンのサイズ",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "ボタン",
    loading: false,
    disabled: false,
  },
};

export const WithIcon: Story = {
  args: {
    children: "検索",
    icon: Search,
    loading: false,
    disabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: "アイコン付きのボタン。検索アイコンが表示されます。",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    children: "保存中",
    loading: true,
    loadingText: "保存中...",
    icon: Save,
  },
  parameters: {
    docs: {
      description: {
        story:
          "ローディング状態のボタン。スピナーアイコンとローディングテキストが表示されます。",
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    children: "無効",
    disabled: true,
    icon: Save,
  },
  parameters: {
    docs: {
      description: {
        story: "無効状態のボタン。クリックできません。",
      },
    },
  },
};

export const SizeVariations: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          スモールサイズ
        </h3>
        <LoadingButton size="sm" icon={Search}>
          検索
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          ミディアムサイズ（デフォルト）
        </h3>
        <LoadingButton size="md" icon={Save}>
          保存
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          ラージサイズ
        </h3>
        <LoadingButton size="lg" icon={Download}>
          ダウンロード
        </LoadingButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "サイズバリエーション。スモール、ミディアム、ラージの3つのサイズを比較できます。",
      },
    },
  },
};

export const ColorVariations: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          プライマリ（デフォルト）
        </h3>
        <LoadingButton variant="primary" icon={Save}>
          保存
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          セカンダリ
        </h3>
        <LoadingButton variant="secondary" icon={RefreshCw}>
          更新
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          サクセス
        </h3>
        <LoadingButton variant="success" icon={Download}>
          完了
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          ワーニング
        </h3>
        <LoadingButton variant="warning" icon={RefreshCw}>
          警告
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          デンジャー
        </h3>
        <LoadingButton variant="danger" icon={Trash2}>
          削除
        </LoadingButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "カラーバリエーション。プライマリ、セカンダリ、サクセス、ワーニング、デンジャーの5つの色を比較できます。",
      },
    },
  },
};

export const WidthVariations: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          自動幅
        </h3>
        <LoadingButton width="auto" icon={Search}>
          検索
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          全幅
        </h3>
        <LoadingButton width="full" icon={Save}>
          保存
        </LoadingButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "幅のバリエーション。自動幅と全幅の2つの設定を比較できます。",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [count, setCount] = useState(0);

    const handleClick = async () => {
      setLoading(true);
      setCount((prev) => prev + 1);

      // 模擬的な処理
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setLoading(false);
    };

    return (
      <div className="space-y-4">
        <LoadingButton
          loading={loading}
          loadingText="処理中..."
          onClick={handleClick}
          icon={Save}
        >
          クリック回数: {count}
        </LoadingButton>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>ボタンをクリックして動作を確認してください。</p>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "インタラクティブな例。ボタンをクリックしてローディング状態を確認できます。",
      },
    },
  },
};

export const FormExample: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setSubmitted(false);

      // 模擬的な送信処理
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setLoading(false);
      setSubmitted(true);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            名前
          </label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="お名前を入力してください"
          />
        </div>

        <div className="flex gap-2">
          <LoadingButton
            type="submit"
            loading={loading}
            loadingText="送信中..."
            icon={Save}
            width="auto"
          >
            送信
          </LoadingButton>

          <LoadingButton
            type="button"
            variant="secondary"
            icon={RefreshCw}
            width="auto"
            onClick={() => setSubmitted(false)}
          >
            リセット
          </LoadingButton>
        </div>

        {submitted && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200">
              送信が完了しました！
            </p>
          </div>
        )}
      </form>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "フォームでの使用例。送信ボタンとリセットボタンの組み合わせを確認できます。",
      },
    },
  },
};

export const LoadingStates: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          通常状態
        </h3>
        <LoadingButton icon={Save}>保存</LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          ローディング状態
        </h3>
        <LoadingButton loading icon={Save}>
          保存
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          カスタムローディングテキスト
        </h3>
        <LoadingButton loading loadingText="データを保存中..." icon={Save}>
          保存
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          無効状態
        </h3>
        <LoadingButton disabled icon={Save}>
          保存
        </LoadingButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "異なる状態での表示例。通常、ローディング、無効状態を比較できます。",
      },
    },
  },
};

export const IconSizes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          スモールアイコン
        </h3>
        <LoadingButton size="sm" icon={Search} iconSize="sm">
          検索
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          ミディアムアイコン（デフォルト）
        </h3>
        <LoadingButton size="md" icon={Save} iconSize="md">
          保存
        </LoadingButton>
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">
          ラージアイコン
        </h3>
        <LoadingButton size="lg" icon={Download} iconSize="lg">
          ダウンロード
        </LoadingButton>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "アイコンサイズのバリエーション。スモール、ミディアム、ラージの3つのサイズを比較できます。",
      },
    },
  },
};
