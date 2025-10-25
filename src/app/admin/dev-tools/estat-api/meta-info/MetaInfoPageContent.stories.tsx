import { useState } from "react";

import type { EstatMetaInfo } from "@/lib/database/estat/types/metainfo";

import MetaInfoPageContent from "./MetaInfoPageContent";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// モックデータ
const mockSavedStatsList: EstatMetaInfo[] = [
  {
    stats_data_id: "0000010101",
    stat_name: "人口推計",
    title: "人口推計（令和4年10月1日現在）",
    area_type: "prefecture",
    cycle: "年次",
    survey_date: "2022-10-01",
    description: "都道府県別の人口推計データ",
    last_fetched_at: "2024-01-15T10:30:00Z",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-01-15T10:30:00Z",
  },
  {
    stats_data_id: "0000020101",
    stat_name: "家計調査",
    title: "家計調査（2022年）",
    area_type: "prefecture",
    cycle: "年次",
    survey_date: "2022-01-01",
    description: "都道府県別の家計調査データ",
    last_fetched_at: "2024-01-14T15:20:00Z",
    created_at: "2024-01-14T15:20:00Z",
    updated_at: "2024-01-14T15:20:00Z",
  },
  {
    stats_data_id: "0000030101",
    stat_name: "労働力調査",
    title: "労働力調査（2022年平均）",
    area_type: "country",
    cycle: "年次",
    survey_date: "2022-01-01",
    description: "全国の労働力調査データ",
    last_fetched_at: "2024-01-13T09:15:00Z",
    created_at: "2024-01-13T09:15:00Z",
    updated_at: "2024-01-13T09:15:00Z",
  },
  {
    stats_data_id: "0000040101",
    stat_name: "住宅・土地統計調査",
    title: "住宅・土地統計調査（2018年）",
    area_type: "municipality",
    cycle: "5年次",
    survey_date: "2018-10-01",
    description: "市区町村別の住宅・土地統計データ",
    last_fetched_at: "2024-01-12T14:45:00Z",
    created_at: "2024-01-12T14:45:00Z",
    updated_at: "2024-01-12T14:45:00Z",
  },
  {
    stats_data_id: "0000050101",
    stat_name: "経済センサス",
    title: "経済センサス（2021年）",
    area_type: "prefecture",
    cycle: "5年次",
    survey_date: "2021-02-01",
    description: "都道府県別の経済センサスデータ",
    last_fetched_at: "2024-01-11T11:30:00Z",
    created_at: "2024-01-11T11:30:00Z",
    updated_at: "2024-01-11T11:30:00Z",
  },
];

const meta: Meta<typeof MetaInfoPageContent> = {
  title: "Pages/EstatApi/MetaInfoPageContent",
  component: MetaInfoPageContent,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "e-Statメタ情報管理ページ。統計表IDを入力してメタ情報を取得・表示し、保存済み統計表一覧を管理できます。",
      },
    },
  },
  argTypes: {
    savedStatsList: {
      control: "object",
      description:
        "保存済み統計表一覧（データベースから取得した統計表メタデータ）",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    savedStatsList: [],
  },
  parameters: {
    docs: {
      description: {
        story: "初期状態。保存済みデータがない状態での表示です。",
      },
    },
  },
};

export const WithSavedData: Story = {
  args: {
    savedStatsList: mockSavedStatsList,
  },
  parameters: {
    docs: {
      description: {
        story:
          "保存済みデータがある状態。サイドバーに統計表一覧が表示されます。",
      },
    },
  },
};

export const WithFewSavedData: Story = {
  args: {
    savedStatsList: mockSavedStatsList.slice(0, 2),
  },
  parameters: {
    docs: {
      description: {
        story: "少数の保存済みデータがある状態。",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [savedStatsList, setSavedStatsList] =
      useState<EstatMetaInfo[]>(mockSavedStatsList);
    const [currentStatsId, setCurrentStatsId] = useState<string>("");

    const handleFetchMetaInfo = (statsDataId: string) => {
      setCurrentStatsId(statsDataId);
      console.log("メタ情報取得:", statsDataId);
    };

    const handleSidebarItemView = (item: EstatMetaInfo) => {
      if (item.stats_data_id) {
        handleFetchMetaInfo(item.stats_data_id);
      }
    };

    return (
      <div className="h-screen">
        <MetaInfoPageContent savedStatsList={savedStatsList} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "インタラクティブな例。統計表IDを入力してメタ情報を取得したり、サイドバーのアイテムをクリックして動作を確認できます。",
      },
    },
  },
};

export const LoadingState: Story = {
  render: () => {
    const [loading, setLoading] = useState(false);
    const [currentStatsId, setCurrentStatsId] = useState<string>("0000010101");

    const handleFetchMetaInfo = async (statsDataId: string) => {
      setCurrentStatsId(statsDataId);
      setLoading(true);

      // 模擬的なローディング
      await new Promise((resolve) => setTimeout(resolve, 3000));

      setLoading(false);
    };

    return (
      <div className="h-screen">
        <MetaInfoPageContent savedStatsList={mockSavedStatsList} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "ローディング状態の表示。API通信中にローディングアイコンが表示されます。",
      },
    },
  },
};

export const ErrorState: Story = {
  render: () => {
    const [error, setError] = useState<string | null>(null);

    const handleFetchMetaInfo = async (statsDataId: string) => {
      setError(null);

      // 模擬的なエラー
      setTimeout(() => {
        setError(
          "メタ情報の取得に失敗しました。統計表IDが正しいか確認してください。"
        );
      }, 1000);
    };

    return (
      <div className="h-screen">
        <MetaInfoPageContent savedStatsList={mockSavedStatsList} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "エラー状態の表示。API取得に失敗した場合のエラーメッセージが表示されます。",
      },
    },
  },
};

export const AutoSaveSuccess: Story = {
  render: () => {
    const [autoSaveStatus, setAutoSaveStatus] = useState<{
      type: "success" | "error" | null;
      message: string;
    }>({ type: "success", message: "自動保存が完了しました" });

    return (
      <div className="h-screen">
        <MetaInfoPageContent savedStatsList={mockSavedStatsList} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "自動保存成功状態。保存成功時のアラートが表示されます。",
      },
    },
  },
};

export const AutoSaveError: Story = {
  render: () => {
    const [autoSaveStatus, setAutoSaveStatus] = useState<{
      type: "success" | "error" | null;
      message: string;
    }>({
      type: "error",
      message: "自動保存に失敗しました。しばらくしてから再試行してください。",
    });

    return (
      <div className="h-screen">
        <MetaInfoPageContent savedStatsList={mockSavedStatsList} />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "自動保存エラー状態。保存失敗時のアラートが表示されます。",
      },
    },
  },
};

export const DifferentAreaTypes: Story = {
  render: () => {
    const differentAreaTypesData: EstatMetaInfo[] = [
      {
        stats_data_id: "0000010101",
        stat_name: "人口推計",
        title: "人口推計（都道府県別）",
        area_type: "prefecture",
        cycle: "年次",
        survey_date: "2022-10-01",
        description: "都道府県別の人口推計データ",
        last_fetched_at: "2024-01-15T10:30:00Z",
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-15T10:30:00Z",
      },
      {
        stats_data_id: "0000020101",
        stat_name: "労働力調査",
        title: "労働力調査（全国）",
        area_type: "country",
        cycle: "年次",
        survey_date: "2022-01-01",
        description: "全国の労働力調査データ",
        last_fetched_at: "2024-01-14T15:20:00Z",
        created_at: "2024-01-14T15:20:00Z",
        updated_at: "2024-01-14T15:20:00Z",
      },
      {
        stats_data_id: "0000030101",
        stat_name: "住宅・土地統計調査",
        title: "住宅・土地統計調査（市区町村別）",
        area_type: "municipality",
        cycle: "5年次",
        survey_date: "2018-10-01",
        description: "市区町村別の住宅・土地統計データ",
        last_fetched_at: "2024-01-13T09:15:00Z",
        created_at: "2024-01-13T09:15:00Z",
        updated_at: "2024-01-13T09:15:00Z",
      },
    ];

    return (
      <div className="h-screen">
        <MetaInfoPageContent savedStatsList={differentAreaTypesData} />
      </div>
    );
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

export const MobileLayout: Story = {
  render: () => (
    <div className="w-80 h-screen mx-auto">
      <MetaInfoPageContent savedStatsList={mockSavedStatsList.slice(0, 3)} />
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
    <div className="w-768 h-screen mx-auto">
      <MetaInfoPageContent savedStatsList={mockSavedStatsList} />
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
    <div className="w-full h-screen">
      <MetaInfoPageContent savedStatsList={mockSavedStatsList} />
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
