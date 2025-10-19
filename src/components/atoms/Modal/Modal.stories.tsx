import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Modal } from "./Modal";
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from "lucide-react";

const meta: Meta<typeof Modal> = {
  title: "Atoms/Modal",
  component: Modal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "モーダルダイアログコンポーネント。オーバーレイ、サイズ選択、クリック外部で閉じる機能を提供します。",
      },
    },
  },
  argTypes: {
    isOpen: {
      control: "boolean",
      description: "モーダルの表示状態",
    },
    onClose: {
      action: "close",
      description: "モーダルを閉じる時のコールバック関数",
    },
    children: {
      description: "モーダル内に表示するコンテンツ",
    },
    size: {
      control: "select",
      options: ["sm", "md", "lg", "xl"],
      description: "モーダルのサイズ",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// モーダルを開くためのラッパーコンポーネント
const ModalWrapper = ({
  size = "md",
  children,
}: {
  size?: "sm" | "md" | "lg" | "xl";
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        モーダルを開く
      </button>
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} size={size}>
        {children}
      </Modal>
    </div>
  );
};

export const Default: Story = {
  render: () => (
    <ModalWrapper>
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-4">デフォルトモーダル</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          これはデフォルトサイズのモーダルです。
        </p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          アクション
        </button>
      </div>
    </ModalWrapper>
  ),
};

export const Small: Story = {
  render: () => (
    <ModalWrapper size="sm">
      <div className="text-center">
        <h2 className="text-lg font-semibold mb-3">小さいモーダル</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          これは小さいサイズのモーダルです。
        </p>
        <button className="px-3 py-1.5 bg-green-500 text-white rounded hover:bg-green-600">
          確認
        </button>
      </div>
    </ModalWrapper>
  ),
};

export const Large: Story = {
  render: () => (
    <ModalWrapper size="lg">
      <div>
        <h2 className="text-2xl font-semibold mb-4">大きいモーダル</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          これは大きいサイズのモーダルです。より多くのコンテンツを表示できます。
        </p>
        <div className="space-y-4">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
            <h3 className="font-medium mb-2">セクション1</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              ここに詳細な情報を表示できます。
            </p>
          </div>
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
            <h3 className="font-medium mb-2">セクション2</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              複数のセクションを含むことができます。
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            キャンセル
          </button>
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            保存
          </button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const ExtraLarge: Story = {
  render: () => (
    <ModalWrapper size="xl">
      <div>
        <h2 className="text-3xl font-semibold mb-6">特大モーダル</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          これは特大サイズのモーダルです。最大限のコンテンツを表示できます。
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">左側のコンテンツ</h3>
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                左側に配置されたコンテンツです。
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">右側のコンテンツ</h3>
            <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                右側に配置されたコンテンツです。
              </p>
            </div>
          </div>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <ModalWrapper>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900 mb-4">
          <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-semibold mb-4">成功</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          操作が正常に完了しました。
        </p>
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          閉じる
        </button>
      </div>
    </ModalWrapper>
  ),
};

export const Warning: Story = {
  render: () => (
    <ModalWrapper>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h2 className="text-xl font-semibold mb-4">警告</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          この操作は取り消すことができません。続行しますか？
        </p>
        <div className="flex justify-center gap-2">
          <button className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            キャンセル
          </button>
          <button className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600">
            続行
          </button>
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const Error: Story = {
  render: () => (
    <ModalWrapper>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 dark:bg-red-900 mb-4">
          <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold mb-4">エラー</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          エラーが発生しました。しばらく時間をおいてから再度お試しください。
        </p>
        <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
          閉じる
        </button>
      </div>
    </ModalWrapper>
  ),
};

export const InfoModal: Story = {
  render: () => (
    <ModalWrapper>
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
          <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold mb-4">情報</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          この機能についての詳細情報をお伝えします。
        </p>
        <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          了解
        </button>
      </div>
    </ModalWrapper>
  ),
};

export const LongContent: Story = {
  render: () => (
    <ModalWrapper size="lg">
      <div>
        <h2 className="text-2xl font-semibold mb-4">長いコンテンツ</h2>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
              <h3 className="font-medium mb-2">セクション {i + 1}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                これは長いコンテンツの例です。スクロール可能な領域内に表示されます。
              </p>
            </div>
          ))}
        </div>
      </div>
    </ModalWrapper>
  ),
};

export const Form: Story = {
  render: () => (
    <ModalWrapper size="md">
      <div>
        <h2 className="text-xl font-semibold mb-4">フォーム</h2>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              名前
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="名前を入力してください"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="メールアドレスを入力してください"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              メッセージ
            </label>
            <textarea
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="メッセージを入力してください"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              送信
            </button>
          </div>
        </form>
      </div>
    </ModalWrapper>
  ),
};
