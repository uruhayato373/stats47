import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import EstatMetaInfoFetcher from "./EstatMetaInfoFetcher";

const meta: Meta<typeof EstatMetaInfoFetcher> = {
  title: "Organisms/EstatApi/EstatMetaInfoFetcher",
  component: EstatMetaInfoFetcher,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Statメタ情報取得フォームコンポーネント。統計表IDを入力してメタ情報を取得するためのフォームを提供します。",
      },
    },
  },
  argTypes: {
    onSubmit: {
      action: "submit",
      description: "統計表IDが送信された時のコールバック関数",
    },
    loading: {
      control: "boolean",
      description: "API通信中のローディング状態",
    },
    clearOnSuccess: {
      control: "boolean",
      description: "送信成功後に入力フィールドをクリアするかどうか",
    },
    size: {
      control: "select",
      options: ["compact", "default", "large"],
      description: "コンポーネントのサイズ",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    loading: false,
    clearOnSuccess: false,
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    clearOnSuccess: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "ローディング状態の表示。API通信中にボタンが無効化され、ローディングアイコンが表示されます。",
      },
    },
  },
};

export const WithClearOnSuccess: Story = {
  args: {
    loading: false,
    clearOnSuccess: true,
  },
  parameters: {
    docs: {
      description: {
        story: "送信成功後に入力フィールドがクリアされる設定。",
      },
    },
  },
};

export const Compact: Story = {
  args: {
    loading: false,
    clearOnSuccess: false,
    size: "compact",
  },
  parameters: {
    docs: {
      description: {
        story: "コンパクトサイズ。高さを低くしたバージョンです。",
      },
    },
  },
};

export const Large: Story = {
  args: {
    loading: false,
    clearOnSuccess: false,
    size: "large",
  },
  parameters: {
    docs: {
      description: {
        story: "ラージサイズ。より大きく表示されたバージョンです。",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [submittedIds, setSubmittedIds] = useState<string[]>([]);

    const handleSubmit = async (statsDataId: string) => {
      setLoading(true);
      setSubmittedIds((prev) => [...prev, statsDataId]);

      // 模擬的なAPI通信
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setLoading(false);
    };

    return (
      <div className="space-y-6">
        <EstatMetaInfoFetcher
          onSubmit={handleSubmit}
          loading={loading}
          clearOnSuccess={true}
        />

        {submittedIds.length > 0 && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              送信された統計表ID:
            </h4>
            <ul className="space-y-1">
              {submittedIds.map((id, index) => (
                <li
                  key={index}
                  className="text-sm text-gray-600 dark:text-gray-300"
                >
                  {id}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "インタラクティブな例です。統計表IDを入力して送信ボタンをクリックして動作を確認できます。",
      },
    },
  },
};

export const ValidationExample: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (statsDataId: string) => {
      setLoading(true);
      console.log("送信された統計表ID:", statsDataId);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    };

    return (
      <div className="space-y-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          <p>バリデーション例:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>有効: 10桁の数字（例: 0000010101）</li>
            <li>無効: 9桁以下、11桁以上、文字を含む</li>
          </ul>
        </div>

        <EstatMetaInfoFetcher
          onSubmit={handleSubmit}
          loading={loading}
          clearOnSuccess={false}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "バリデーション機能の例。10桁の数字のみが有効な統計表IDとして受け入れられます。",
      },
    },
  },
};

export const InCard: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (statsDataId: string) => {
      setLoading(true);
      console.log("送信された統計表ID:", statsDataId);
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLoading(false);
    };

    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              e-Stat メタ情報取得
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              統計表IDを入力してメタ情報を取得してください。
            </p>
          </div>

          <EstatMetaInfoFetcher
            onSubmit={handleSubmit}
            loading={loading}
            clearOnSuccess={true}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "カード内での使用例。実際のページレイアウトでの表示イメージです。",
      },
    },
  },
};

export const MobileLayout: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (statsDataId: string) => {
      setLoading(true);
      console.log("送信された統計表ID:", statsDataId);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setLoading(false);
    };

    return (
      <div className="w-80 mx-auto">
        <EstatMetaInfoFetcher
          onSubmit={handleSubmit}
          loading={loading}
          clearOnSuccess={true}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "モバイルレイアウトでの表示例。狭い画面でも適切に表示されます。",
      },
    },
  },
};

export const SizeComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-4 text-gray-900 dark:text-gray-100">
          コンパクトサイズ
        </h3>
        <EstatMetaInfoFetcher
          onSubmit={() => console.log("送信")}
          loading={false}
          clearOnSuccess={false}
          size="compact"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 text-gray-900 dark:text-gray-100">
          デフォルトサイズ
        </h3>
        <EstatMetaInfoFetcher
          onSubmit={() => console.log("送信")}
          loading={false}
          clearOnSuccess={false}
          size="default"
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 text-gray-900 dark:text-gray-100">
          ラージサイズ
        </h3>
        <EstatMetaInfoFetcher
          onSubmit={() => console.log("送信")}
          loading={false}
          clearOnSuccess={false}
          size="large"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "サイズ比較。コンパクト、デフォルト、ラージの3つのサイズを比較できます。",
      },
    },
  },
};

export const DifferentStates: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-medium mb-4 text-gray-900 dark:text-gray-100">
          初期状態
        </h3>
        <EstatMetaInfoFetcher
          onSubmit={() => console.log("送信")}
          loading={false}
          clearOnSuccess={false}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 text-gray-900 dark:text-gray-100">
          ローディング状態
        </h3>
        <EstatMetaInfoFetcher
          onSubmit={() => console.log("送信")}
          loading={true}
          clearOnSuccess={false}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium mb-4 text-gray-900 dark:text-gray-100">
          バリデーションエラー状態
        </h3>
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          ※ 無効な値を入力してエラー表示を確認してください
        </div>
        <EstatMetaInfoFetcher
          onSubmit={() => console.log("送信")}
          loading={false}
          clearOnSuccess={false}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "異なる状態での表示例。初期状態、ローディング状態、バリデーションエラー状態を確認できます。",
      },
    },
  },
};
