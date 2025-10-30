import { useState } from "react";

import type { EstatMetaInfo } from "../../../../types";

import SavedMetaInfoListItem from "./SavedMetaInfoListItem";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// モックデータ
const mockEstatMetaInfo: EstatMetaInfo = {
  stats_data_id: "0000010101",
  stat_name: "社会・人口統計体系",
  title: "Ａ　人口・世帯",
  area_type: "prefecture",
  cycle: "年度次",
  survey_date: "2020",
  description: "社会・人口統計体系の都道府県ごとに集計したデータを提供します。",
  last_fetched_at: "2025-01-15T10:30:00Z",
  created_at: "2025-01-15T10:30:00Z",
  updated_at: "2025-01-15T10:30:00Z",
};

const mockCountryData: EstatMetaInfo = {
  stats_data_id: "0000020101",
  stat_name: "労働力調査",
  title: "労働力調査（2022年平均）",
  area_type: "national",
  cycle: "年次",
  survey_date: "2022-01-01",
  description: "全国の労働力調査データ",
  last_fetched_at: "2025-01-14T15:20:00Z",
  created_at: "2025-01-14T15:20:00Z",
  updated_at: "2025-01-14T15:20:00Z",
};

const mockCityata: EstatMetaInfo = {
  stats_data_id: "0000030101",
  stat_name: "住宅・土地統計調査",
  title: "住宅・土地統計調査（2018年）",
  area_type: "city",
  cycle: "5年次",
  survey_date: "2018-10-01",
  description: "市区町村別の住宅・土地統計データ",
  last_fetched_at: "2025-01-13T09:15:00Z",
  created_at: "2025-01-13T09:15:00Z",
  updated_at: "2025-01-13T09:15:00Z",
};

const mockLongTitleData: EstatMetaInfo = {
  stats_data_id: "0000040101",
  stat_name: "経済センサス",
  title: "経済センサス（2021年）基礎調査結果（企業に関する基本集計）",
  area_type: "prefecture",
  cycle: "5年次",
  survey_date: "2021-02-01",
  description: "都道府県別の経済センサスデータ",
  last_fetched_at: "2025-01-12T14:45:00Z",
  created_at: "2025-01-12T14:45:00Z",
  updated_at: "2025-01-12T14:45:00Z",
};

const mockRecentData: EstatMetaInfo = {
  stats_data_id: "0000050101",
  stat_name: "家計調査",
  title: "家計調査（2022年）",
  area_type: "prefecture",
  cycle: "年次",
  survey_date: "2022-01-01",
  description: "都道府県別の家計調査データ",
  last_fetched_at: "2025-01-15T16:30:00Z",
  created_at: "2025-01-15T16:30:00Z",
  updated_at: "2025-01-15T16:30:00Z",
};

const mockOldData: EstatMetaInfo = {
  stats_data_id: "0000060101",
  stat_name: "学校基本調査",
  title: "学校基本調査（2022年度）",
  area_type: "city",
  cycle: "年次",
  survey_date: "2022-05-01",
  description: "市区町村別の学校基本調査データ",
  last_fetched_at: "2025-01-01T08:00:00Z",
  created_at: "2025-01-01T08:00:00Z",
  updated_at: "2025-01-01T08:00:00Z",
};

const meta: Meta<typeof SavedMetaInfoListItem> = {
  title: "Organisms/EstatApi/SavedMetaInfoListItem",
  component: SavedMetaInfoListItem,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "保存済みメタ情報リストアイテムコンポーネント。統計表の基本情報を表示し、詳細表示ボタンを提供します。",
      },
    },
  },
  argTypes: {
    item: {
      control: "object",
      description: "EstatMetaInfoオブジェクト",
    },
    onView: {
      action: "view",
      description: "詳細表示ボタンがクリックされた時のコールバック関数",
    },
  },
  tags: ["autodocs"],
};

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    item: mockEstatMetaInfo,
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story: "基本的なメタ情報アイテム。都道府県データの表示例です。",
      },
    },
  },
};

export const CountryData: Story = {
  args: {
    item: mockCountryData,
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story: "全国データの表示例。area_typeが'country'の場合です。",
      },
    },
  },
};

export const Cityata: Story = {
  args: {
    item: mockCityata,
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story: "市区町村データの表示例。area_typeが'municipality'の場合です。",
      },
    },
  },
};

export const LongTitle: Story = {
  args: {
    item: mockLongTitleData,
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story: "長いタイトルの表示例。テキストの折り返しを確認できます。",
      },
    },
  },
};

export const RecentData: Story = {
  args: {
    item: mockRecentData,
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story: "最近更新されたデータの表示例。更新日時が最近の場合です。",
      },
    },
  },
};

export const OldData: Story = {
  args: {
    item: mockOldData,
    onView: (item) => console.log("View item:", item),
  },
  parameters: {
    docs: {
      description: {
        story: "古いデータの表示例。更新日時が古い場合です。",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [selectedItem, setSelectedItem] = useState<EstatMetaInfo | null>(
      null
    );
    const [clickCount, setClickCount] = useState(0);

    const handleView = (item: EstatMetaInfo) => {
      setSelectedItem(item);
      setClickCount((prev) => prev + 1);
      console.log("View item:", item);
    };

    const items = [
      mockEstatMetaInfo,
      mockCountryData,
      mockCityata,
      mockLongTitleData,
    ];

    return (
      <div className="space-y-4">
        <div className="w-80">
          <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg">
            <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
              <h3 className="font-medium text-gray-900 dark:text-neutral-100">
                保存済みデータ
              </h3>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-neutral-600">
              {items.map((item) => (
                <SavedMetaInfoListItem
                  key={item.stats_data_id}
                  item={item}
                  onView={handleView}
                />
              ))}
            </div>
          </div>
        </div>

        {selectedItem && (
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
              選択されたアイテム
            </h4>
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
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              クリック回数: {clickCount}
            </div>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "インタラクティブな例。複数のアイテムをクリックして選択状態を確認できます。",
      },
    },
  },
};

export const DifferentAreaTypes: Story = {
  render: () => {
    const areaTypes = [
      { type: "prefecture", label: "都道府県", data: mockEstatMetaInfo },
      { type: "national", label: "全国", data: mockCountryData },
      { type: "city", label: "市区町村", data: mockCityata },
    ];

    return (
      <div className="space-y-4">
        {areaTypes.map(({ type, label, data }) => (
          <div key={type} className="w-80">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {label}データ ({type})
            </h4>
            <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg">
              <SavedMetaInfoListItem
                item={data}
                onView={(item) => console.log("View item:", item)}
              />
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "異なる地域タイプの比較。都道府県、全国、市区町村の3つの地域タイプを比較できます。",
      },
    },
  },
};

export const HoverStates: Story = {
  render: () => {
    const items = [
      { label: "通常状態", data: mockEstatMetaInfo },
      { label: "ホバー状態", data: mockCountryData },
      { label: "フォーカス状態", data: mockCityata },
    ];

    return (
      <div className="space-y-4">
        {items.map(({ label, data }, index) => (
          <div key={index} className="w-80">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {label}
            </h4>
            <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg">
              <SavedMetaInfoListItem
                item={data}
                onView={(item) => console.log("View item:", item)}
              />
            </div>
          </div>
        ))}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "ホバー状態の例。ボタンのホバー効果を確認できます。",
      },
    },
  },
};

export const MobileLayout: Story = {
  render: () => (
    <div className="w-72 mx-auto">
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <SavedMetaInfoListItem
          item={mockEstatMetaInfo}
          onView={(item) => console.log("View item:", item)}
        />
      </div>
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
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <SavedMetaInfoListItem
          item={mockEstatMetaInfo}
          onView={(item) => console.log("View item:", item)}
        />
      </div>
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
      <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg">
        <SavedMetaInfoListItem
          item={mockEstatMetaInfo}
          onView={(item) => console.log("View item:", item)}
        />
      </div>
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

export const ListContext: Story = {
  render: () => {
    const items = [
      mockEstatMetaInfo,
      mockCountryData,
      mockCityata,
      mockLongTitleData,
      mockRecentData,
    ];

    return (
      <div className="w-80">
        <div className="bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-neutral-700">
            <h3 className="font-medium text-gray-900 dark:text-neutral-100">
              保存済みデータ
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-neutral-600">
            {items.map((item) => (
              <SavedMetaInfoListItem
                key={item.stats_data_id}
                item={item}
                onView={(item) => console.log("View item:", item)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "リスト内での表示例。複数のアイテムがリスト形式で表示される場合の表示を確認できます。",
      },
    },
  },
};

export default meta;
