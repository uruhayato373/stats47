import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import DataTable, { TableColumn } from "./DataTable";

// サンプルデータの型定義
interface SampleData {
  id: number;
  name: string;
  email: string;
  age: number;
  status: "active" | "inactive";
  createdAt: string;
}

// サンプルデータ
const sampleData: SampleData[] = [
  {
    id: 1,
    name: "田中太郎",
    email: "tanaka@example.com",
    age: 30,
    status: "active",
    createdAt: "2024-01-15",
  },
  {
    id: 2,
    name: "佐藤花子",
    email: "sato@example.com",
    age: 25,
    status: "active",
    createdAt: "2024-02-20",
  },
  {
    id: 3,
    name: "鈴木一郎",
    email: "suzuki@example.com",
    age: 35,
    status: "inactive",
    createdAt: "2024-03-10",
  },
  {
    id: 4,
    name: "高橋美咲",
    email: "takahashi@example.com",
    age: 28,
    status: "active",
    createdAt: "2024-04-05",
  },
  {
    id: 5,
    name: "山田次郎",
    email: "yamada@example.com",
    age: 42,
    status: "inactive",
    createdAt: "2024-05-12",
  },
];

// カラム定義
const columns: TableColumn<SampleData>[] = [
  {
    key: "name",
    label: "名前",
  },
  {
    key: "email",
    label: "メールアドレス",
  },
  {
    key: "age",
    label: "年齢",
    render: (item) => `${item.age}歳`,
  },
  {
    key: "status",
    label: "ステータス",
    render: (item) => (
      <span
        className={`px-2 py-1 text-xs rounded-full ${
          item.status === "active"
            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
            : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
        }`}
      >
        {item.status === "active" ? "アクティブ" : "非アクティブ"}
      </span>
    ),
  },
  {
    key: "createdAt",
    label: "作成日",
    render: (item) => new Date(item.createdAt).toLocaleDateString("ja-JP"),
  },
];

const meta: Meta<typeof DataTable<SampleData>> = {
  title: "Common/DataTable",
  component: DataTable,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "データを表形式で表示するテーブルコンポーネントです。カスタムレンダリング機能とページネーション機能をサポートしています。",
      },
    },
  },
  argTypes: {
    data: {
      description: "表示するデータの配列",
      control: false,
    },
    columns: {
      description: "テーブルのカラム定義",
      control: false,
    },
    emptyMessage: {
      description: "データが空の場合に表示するメッセージ",
      control: "text",
    },
    maxRows: {
      description: "表示する最大行数",
      control: { type: "number", min: 1, max: 1000 },
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DataTable<SampleData>>;

// 基本的な使用例
export const Default: Story = {
  args: {
    data: sampleData,
    columns,
    emptyMessage: "データがありません",
    maxRows: 100,
  },
};

// 空のデータ
export const Empty: Story = {
  args: {
    data: [],
    columns,
    emptyMessage: "データが見つかりませんでした",
    maxRows: 100,
  },
};

// 行数制限あり
export const WithMaxRows: Story = {
  args: {
    data: sampleData,
    columns,
    emptyMessage: "データがありません",
    maxRows: 3,
  },
};

// 大量データ
export const LargeDataset: Story = {
  args: {
    data: Array.from({ length: 50 }, (_, i) => ({
      id: i + 1,
      name: `ユーザー${i + 1}`,
      email: `user${i + 1}@example.com`,
      age: 20 + (i % 40),
      status: i % 3 === 0 ? "inactive" : "active",
      createdAt: new Date(2024, 0, 1 + i).toISOString().split("T")[0],
    })),
    columns,
    emptyMessage: "データがありません",
    maxRows: 10,
  },
};

// シンプルなデータ
interface ProductData {
  id: number;
  name: string;
  price: number;
}

export const SimpleData: StoryObj<typeof DataTable<ProductData>> = {
  args: {
    data: [
      { id: 1, name: "商品A", price: 1000 },
      { id: 2, name: "商品B", price: 2000 },
      { id: 3, name: "商品C", price: 1500 },
    ],
    columns: [
      { key: "name", label: "商品名" },
      {
        key: "price",
        label: "価格",
        render: (item) => `¥${item.price.toLocaleString()}`,
      },
    ],
    emptyMessage: "商品がありません",
    maxRows: 100,
  },
};

// カスタムレンダリング
export const CustomRendering: Story = {
  args: {
    data: sampleData.slice(0, 3),
    columns: [
      {
        key: "name",
        label: "名前",
        render: (item) => (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
              {item.name.charAt(0)}
            </div>
            <span className="font-medium">{item.name}</span>
          </div>
        ),
      },
      {
        key: "email",
        label: "メールアドレス",
        render: (item) => (
          <a
            href={`mailto:${item.email}`}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {item.email}
          </a>
        ),
      },
      {
        key: "age",
        label: "年齢",
        render: (item) => (
          <div className="flex items-center gap-2">
            <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2 rounded-full"
                style={{ width: `${(item.age / 50) * 100}%` }}
              ></div>
            </div>
            <span>{item.age}歳</span>
          </div>
        ),
      },
    ],
    emptyMessage: "データがありません",
    maxRows: 100,
  },
};
