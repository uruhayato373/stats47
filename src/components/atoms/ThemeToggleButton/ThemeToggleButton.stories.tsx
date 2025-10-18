import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import React from "react";
import { ThemeToggleButton } from "./ThemeToggleButton";

const meta: Meta<typeof ThemeToggleButton> = {
  title: "Components/Atoms/ThemeToggleButton",
  component: ThemeToggleButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ライトテーマとダークテーマを切り替えるためのボタンコンポーネント。lucide-react のアイコンを使用し、テーマの状態に応じて適切なアイコンを表示します。",
      },
    },
  },
  argTypes: {
    // ThemeToggleButton は props を受け取らないため、argTypes は空
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// デフォルトのストーリー
export const Default: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "デフォルトのテーマ切り替えボタン。現在のテーマに応じて太陽または月のアイコンが表示されます。",
      },
    },
  },
};

// ライトテーマでの表示
export const LightTheme: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "ライトテーマ時の表示。太陽アイコンが表示され、クリックするとダークテーマに切り替わります。",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="light">
        <div className="bg-white p-8 rounded-lg shadow-lg">
          <Story />
        </div>
      </div>
    ),
  ],
};

// ダークテーマでの表示
export const DarkTheme: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "ダークテーマ時の表示。月アイコンが表示され、クリックするとライトテーマに切り替わります。",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="dark">
        <div className="bg-neutral-800 p-8 rounded-lg shadow-lg">
          <Story />
        </div>
      </div>
    ),
  ],
};

// ローディング状態
export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "ローディング状態の表示。SSR時のハイドレーション不整合を防ぐために表示される状態です。",
      },
    },
  },
  decorators: [
    (Story) => {
      // ローディング状態をシミュレート
      const [mounted, setMounted] = React.useState(false);

      React.useEffect(() => {
        // マウント状態を遅延させる
        const timer = setTimeout(() => setMounted(true), 2000);
        return () => clearTimeout(timer);
      }, []);

      if (!mounted) {
        return (
          <div className="p-8">
            <div className="text-sm text-gray-500 mb-4">
              ローディング状態（2秒後にマウント完了）
            </div>
            <Story />
          </div>
        );
      }

      return (
        <div className="p-8">
          <div className="text-sm text-gray-500 mb-4">マウント完了</div>
          <Story />
        </div>
      );
    },
  ],
};

// ヘッダー内での使用例
export const InHeader: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "ヘッダー内での使用例。ナビゲーションバーに配置された状態での表示です。",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full">
        <header className="bg-white dark:bg-neutral-900 border-b border-gray-200 dark:border-neutral-700 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                統計で見る都道府県
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Story />
              <button className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                ログイン
              </button>
            </div>
          </div>
        </header>
      </div>
    ),
  ],
};

// サイドバー内での使用例
export const InSidebar: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "サイドバー内での使用例。サイドバーのヘッダー部分に配置された状態での表示です。",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <div className="bg-gray-100 dark:bg-neutral-900 border-r border-gray-200 dark:border-neutral-700 h-64">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-gray-900 dark:text-white">
                ナビゲーション
              </h2>
              <Story />
            </div>
          </div>
          <div className="p-4">
            <nav className="space-y-2">
              <a
                href="#"
                className="block text-sm text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white"
              >
                ダッシュボード
              </a>
              <a
                href="#"
                className="block text-sm text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white"
              >
                統計データ
              </a>
              <a
                href="#"
                className="block text-sm text-gray-700 dark:text-neutral-300 hover:text-gray-900 dark:hover:text-white"
              >
                設定
              </a>
            </nav>
          </div>
        </div>
      </div>
    ),
  ],
};

// アクセシビリティテスト用
export const Accessibility: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "アクセシビリティ機能の確認。aria-label、title属性、キーボードナビゲーションが適切に設定されています。",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-4">
        <div className="text-sm text-gray-600 dark:text-neutral-400">
          <h3 className="font-medium mb-2">アクセシビリティ機能:</h3>
          <ul className="list-disc list-inside space-y-1">
            <li>aria-label: ボタンの目的を説明</li>
            <li>title: 現在のテーマと次のアクションを説明</li>
            <li>キーボードナビゲーション対応</li>
            <li>フォーカス状態の視覚的フィードバック</li>
          </ul>
        </div>
        <Story />
      </div>
    ),
  ],
};

// インタラクション例
export const Interactive: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story:
          "インタラクションの確認。ボタンをクリックしてテーマが切り替わることを確認できます。",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="p-8 space-y-4">
        <div className="text-sm text-gray-600 dark:text-neutral-400">
          <p>ボタンをクリックしてテーマを切り替えてみてください。</p>
        </div>
        <div className="flex items-center gap-4">
          <Story />
          <div className="text-sm text-gray-500 dark:text-neutral-400">
            現在のテーマ:{" "}
            <span className="font-mono" id="current-theme">
              light
            </span>
          </div>
        </div>
      </div>
    ),
  ],
};
