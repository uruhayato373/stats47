import { useState } from "react";

import type { EstatMetaInfo } from "@/infrastructure/database/estat/types";

import EstatMetaInfoSidebar from "./EstatMetaInfoSidebar";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// モックデータ
const mockSavedStatsList: EstatMetaInfo[] = [
  {
    stats_data_id: "0000010101",
    stat_name: "社会・人口統計体系",
    title: "Ａ　人口・世帯",
    area_type: "prefecture",
    cycle: "年度次",
    survey_date: "2020",
    description:
      "社会・人口統計体系の都道府県ごとに集計したデータを提供します。",
    last_fetched_at: "2025-01-15T10:30:00Z",
    created_at: "2025-01-15T10:30:00Z",
    updated_at: "2025-01-15T10:30:00Z",
  },
  {
    stats_data_id: "0000010102",
    stat_name: "社会・人口統計体系",
    title: "Ｂ　労働",
    area_type: "prefecture",
    cycle: "年度次",
    survey_date: "2020",
    description:
      "社会・人口統計体系の都道府県ごとに集計した労働データを提供します。",
    last_fetched_at: "2025-01-14T15:20:00Z",
    created_at: "2025-01-14T15:20:00Z",
    updated_at: "2025-01-14T15:20:00Z",
  },
  {
    stats_data_id: "0000010103",
    stat_name: "社会・人口統計体系",
    title: "Ｃ　住宅",
    area_type: "prefecture",
    cycle: "年度次",
    survey_date: "2020",
    description:
      "社会・人口統計体系の都道府県ごとに集計した住宅データを提供します。",
    last_fetched_at: "2025-01-13T09:15:00Z",
    created_at: "2025-01-13T09:15:00Z",
    updated_at: "2025-01-13T09:15:00Z",
  },
  {
    stats_data_id: "0000020101",
    stat_name: "労働力調査",
    title: "労働力調査（2022年平均）",
    area_type: "country",
    cycle: "年次",
    survey_date: "2022-01-01",
    description: "全国の労働力調査データ",
    last_fetched_at: "2025-01-12T14:45:00Z",
    created_at: "2025-01-12T14:45:00Z",
    updated_at: "2025-01-12T14:45:00Z",
  },
  {
    stats_data_id: "0000030101",
    stat_name: "住宅・土地統計調査",
    title: "住宅・土地統計調査（2018年）",
    area_type: "municipality",
    cycle: "5年次",
    survey_date: "2018-10-01",
    description: "市区町村別の住宅・土地統計データ",
    last_fetched_at: "2025-01-11T11:30:00Z",
    created_at: "2025-01-11T11:30:00Z",
    updated_at: "2025-01-11T11:30:00Z",
  },
  {
    stats_data_id: "0000040101",
    stat_name: "経済センサス",
    title: "経済センサス（2021年）",
    area_type: "prefecture",
    cycle: "5年次",
    survey_date: "2021-02-01",
    description: "都道府県別の経済センサスデータ",
    last_fetched_at: "2025-01-10T16:20:00Z",
    created_at: "2025-01-10T16:20:00Z",
    updated_at: "2025-01-10T16:20:00Z",
  },
  {
    stats_data_id: "0000050101",
    stat_name: "家計調査",
    title: "家計調査（2022年）",
    area_type: "prefecture",
    cycle: "年次",
    survey_date: "2022-01-01",
    description: "都道府県別の家計調査データ",
    last_fetched_at: "2025-01-09T13:10:00Z",
    created_at: "2025-01-09T13:10:00Z",
    updated_at: "2025-01-09T13:10:00Z",
  },
  {
    stats_data_id: "0000060101",
    stat_name: "学校基本調査",
    title: "学校基本調査（2022年度）",
    area_type: "municipality",
    cycle: "年次",
    survey_date: "2022-05-01",
    description: "市区町村別の学校基本調査データ",
    last_fetched_at: "2025-01-08T10:45:00Z",
    created_at: "2025-01-08T10:45:00Z",
    updated_at: "2025-01-08T10:45:00Z",
  },
  {
    stats_data_id: "0000070101",
    stat_name: "工業統計調査",
    title: "工業統計調査（2021年）",
    area_type: "prefecture",
    cycle: "年次",
    survey_date: "2021-12-31",
    description: "都道府県別の工業統計調査データ",
    last_fetched_at: "2025-01-07T08:30:00Z",
    created_at: "2025-01-07T08:30:00Z",
    updated_at: "2025-01-07T08:30:00Z",
  },
  {
    stats_data_id: "0000080101",
    stat_name: "商業統計調査",
    title: "商業統計調査（2021年）",
    area_type: "prefecture",
    cycle: "年次",
    survey_date: "2021-12-31",
    description: "都道府県別の商業統計調査データ",
    last_fetched_at: "2025-01-06T14:15:00Z",
    created_at: "2025-01-06T14:15:00Z",
    updated_at: "2025-01-06T14:15:00Z",
  },
  {
    stats_data_id: "0000090101",
    stat_name: "サービス業基本調査",
    title: "サービス業基本調査（2021年）",
    area_type: "prefecture",
    cycle: "年次",
    survey_date: "2021-12-31",
    description: "都道府県別のサービス業基本調査データ",
    last_fetched_at: "2025-01-05T11:20:00Z",
    created_at: "2025-01-05T11:20:00Z",
    updated_at: "2025-01-05T11:20:00Z",
  },
  {
    stats_data_id: "0000100101",
    stat_name: "農林業センサス",
    title: "農林業センサス（2020年）",
    area_type: "municipality",
    cycle: "5年次",
    survey_date: "2020-02-01",
    description: "市区町村別の農林業センサスデータ",
    last_fetched_at: "2025-01-04T09:40:00Z",
    created_at: "2025-01-04T09:40:00Z",
    updated_at: "2025-01-04T09:40:00Z",
  },
];

const meta: Meta<typeof EstatMetaInfoSidebar> = {
  title: "Organisms/EstatApi/EstatMetaInfoSidebar",
  component: EstatMetaInfoSidebar,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Statメタ情報サイドバーコンポーネント。保存済み統計表一覧を表示し、ページネーション機能とアイテム選択機能を提供します。",
      },
    },
  },
  argTypes: {
    className: {
      control: "text",
      description: "カスタムクラス名",
    },
    initialData: {
      control: "object",
      description: "初期データ（保存済み統計表一覧）",
    },
    onView: {
      action: "view",
      description: "アイテムがクリックされた時のコールバック関数",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    initialData: [],
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story: "初期状態。保存済みデータがない状態での表示です。",
      },
    },
  },
};

export const WithData: Story = {
  args: {
    initialData: mockSavedStatsList.slice(0, 5),
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story: "保存済みデータがある状態。統計表一覧が表示されます。",
      },
    },
  },
};

export const WithManyData: Story = {
  args: {
    initialData: mockSavedStatsList,
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story:
          "多数の保存済みデータがある状態。ページネーションが表示されます。",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [selectedItem, setSelectedItem] = useState<EstatMetaInfo | null>(
      null
    );
    const [data, setData] = useState<EstatMetaInfo[]>(mockSavedStatsList);

    const handleView = (item: EstatMetaInfo) => {
      setSelectedItem(item);
      console.log("View item:", item);
    };

    const handleAddItem = () => {
      const newItem: EstatMetaInfo = {
        stats_data_id: `0000${String(data.length + 1).padStart(6, "0")}`,
        stat_name: "テスト統計",
        title: `テスト統計表 ${data.length + 1}`,
        area_type: "prefecture",
        cycle: "年次",
        survey_date: "2024-01-01",
        description: "テスト用の統計表データ",
        last_fetched_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setData([...data, newItem]);
    };

    const handleRemoveItem = () => {
      if (data.length > 0) {
        setData(data.slice(0, -1));
      }
    };

    const handleClearData = () => {
      setData([]);
      setSelectedItem(null);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleAddItem}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            アイテムを追加
          </button>
          <button
            onClick={handleRemoveItem}
            disabled={data.length === 0}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            アイテムを削除
          </button>
          <button
            onClick={handleClearData}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            データをクリア
          </button>
        </div>

        <div className="flex gap-4">
          <div className="w-80">
            <EstatMetaInfoSidebar initialData={data} onView={handleView} />
          </div>

          {selectedItem && (
            <div className="flex-1 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                選択されたアイテム
              </h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">統計表ID:</span>{" "}
                  {selectedItem.stats_data_id}
                </div>
                <div>
                  <span className="font-medium">統計名:</span>{" "}
                  {selectedItem.stat_name}
                </div>
                <div>
                  <span className="font-medium">タイトル:</span>{" "}
                  {selectedItem.title}
                </div>
                <div>
                  <span className="font-medium">地域タイプ:</span>{" "}
                  {selectedItem.area_type}
                </div>
                <div>
                  <span className="font-medium">更新日時:</span>{" "}
                  {new Date(selectedItem.updated_at).toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "インタラクティブな例。アイテムの追加・削除・クリアができ、選択されたアイテムの詳細が表示されます。",
      },
    },
  },
};

export const DifferentAreaTypes: Story = {
  args: {
    initialData: [
      {
        stats_data_id: "0000010101",
        stat_name: "人口推計",
        title: "人口推計（都道府県別）",
        area_type: "prefecture",
        cycle: "年次",
        survey_date: "2022-10-01",
        description: "都道府県別の人口推計データ",
        last_fetched_at: "2025-01-15T10:30:00Z",
        created_at: "2025-01-15T10:30:00Z",
        updated_at: "2025-01-15T10:30:00Z",
      },
      {
        stats_data_id: "0000020101",
        stat_name: "労働力調査",
        title: "労働力調査（全国）",
        area_type: "country",
        cycle: "年次",
        survey_date: "2022-01-01",
        description: "全国の労働力調査データ",
        last_fetched_at: "2025-01-14T15:20:00Z",
        created_at: "2025-01-14T15:20:00Z",
        updated_at: "2025-01-14T15:20:00Z",
      },
      {
        stats_data_id: "0000030101",
        stat_name: "住宅・土地統計調査",
        title: "住宅・土地統計調査（市区町村別）",
        area_type: "municipality",
        cycle: "5年次",
        survey_date: "2018-10-01",
        description: "市区町村別の住宅・土地統計データ",
        last_fetched_at: "2025-01-13T09:15:00Z",
        created_at: "2025-01-13T09:15:00Z",
        updated_at: "2025-01-13T09:15:00Z",
      },
    ],
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story:
          "異なる地域タイプのデータ。都道府県、全国、市区町村の3つの地域タイプのデータが表示されます。",
      },
    },
  },
};

export const PaginationExample: Story = {
  args: {
    initialData: mockSavedStatsList,
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story:
          "ページネーションの例。多数のデータがある場合のページネーション機能を確認できます。",
      },
    },
  },
};

export const CustomClassName: Story = {
  args: {
    initialData: mockSavedStatsList.slice(0, 3),
    className: "border-2 border-indigo-300 rounded-lg",
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story:
          "カスタムクラス名の例。ボーダーを追加してスタイルをカスタマイズしています。",
      },
    },
  },
};

export const MobileLayout: Story = {
  render: () => (
    <div className="w-80 mx-auto">
      <EstatMetaInfoSidebar
        initialData={mockSavedStatsList.slice(0, 3)}
        onView={(item) => console.log("View item:", item)}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "モバイルレイアウトでの表示例。狭い画面でも適切に表示されます。",
      },
    },
  },
};

export const TabletLayout: Story = {
  render: () => (
    <div className="w-96 mx-auto">
      <EstatMetaInfoSidebar
        initialData={mockSavedStatsList}
        onView={(item) => console.log("View item:", item)}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "タブレットレイアウトでの表示例。中程度の画面サイズでの表示を確認できます。",
      },
    },
  },
};

export const DesktopLayout: Story = {
  render: () => (
    <div className="w-80">
      <EstatMetaInfoSidebar
        initialData={mockSavedStatsList}
        onView={(item) => console.log("View item:", item)}
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "デスクトップレイアウトでの表示例。大画面での表示を確認できます。",
      },
    },
  },
};

export const LoadingState: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<EstatMetaInfo[]>([]);

    const handleLoadData = async () => {
      setLoading(true);
      setData([]);

      // 模擬的なデータ読み込み
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setData(mockSavedStatsList);
      setLoading(false);
    };

    return (
      <div className="space-y-4">
        <button
          onClick={handleLoadData}
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "読み込み中..." : "データを読み込み"}
        </button>

        <div className="w-80">
          <EstatMetaInfoSidebar
            initialData={data}
            onView={(item) => console.log("View item:", item)}
          />
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "ローディング状態の例。データの読み込み中をシミュレートできます。",
      },
    },
  },
};
