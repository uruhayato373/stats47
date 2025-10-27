import { useState } from "react";

import type { EstatMetaInfoResponse } from "@/features/estat-api";

import EstatMetaInfoDisplay from "./EstatMetaInfoDisplay";

import type { Meta, StoryObj } from "@storybook/nextjs-vite";

// モックデータ
const mockMetaInfoResponse: EstatMetaInfoResponse = {
  GET_META_INFO: {
    RESULT: {
      STATUS: 0,
      ERROR_MSG: "正常に終了しました。",
      DATE: "2025-01-15T10:30:00.000+09:00",
    },
    PARAMETER: {
      LANG: "J",
      STATS_DATA_ID: "0000010101",
      DATA_FORMAT: "J",
    },
    METADATA_INF: {
      TABLE_INF: {
        "@id": "0000010101",
        STAT_NAME: {
          "@code": "00200502",
          $: "社会・人口統計体系",
        },
        GOV_ORG: {
          "@code": "00200",
          $: "総務省",
        },
        STATISTICS_NAME: "都道府県データ 基礎データ",
        TITLE: {
          "@no": "0000010101",
          $: "Ａ　人口・世帯",
        },
        CYCLE: "年度次",
        SURVEY_DATE: 0,
        OPEN_DATE: "2025-06-30",
        SMALL_AREA: 0,
        COLLECT_AREA: "全国",
        MAIN_CATEGORY: {
          "@code": "99",
          $: "その他",
        },
        SUB_CATEGORY: {
          "@code": "99",
          $: "その他",
        },
        OVERALL_TOTAL_NUMBER: 546720,
        UPDATED_DATE: "2025-06-30",
        STATISTICS_NAME_SPEC: {
          TABULATION_CATEGORY: "都道府県データ",
          TABULATION_SUB_CATEGORY1: "基礎データ",
        },
        DESCRIPTION: {
          TABULATION_CATEGORY_EXPLANATION:
            "社会・人口統計体系の都道府県ごとに集計したデータを提供します。",
        },
        TITLE_SPEC: {
          TABLE_NAME: "Ａ　人口・世帯",
        },
      },
      CLASS_INF: {
        CLASS_OBJ: [
          {
            "@id": "tab",
            "@name": "観測値",
            CLASS: {
              "@code": "00001",
              "@name": "観測値",
              "@level": "1",
            },
          },
          {
            "@id": "cat01",
            "@name": "Ａ　人口・世帯",
            CLASS: [
              {
                "@code": "A1101",
                "@name": "A1101_総人口",
                "@level": "1",
                "@unit": "人",
              },
              {
                "@code": "A110101",
                "@name": "A110101_総人口（男）",
                "@level": "1",
                "@unit": "人",
              },
              {
                "@code": "A110102",
                "@name": "A110102_総人口（女）",
                "@level": "1",
                "@unit": "人",
              },
              {
                "@code": "A1102",
                "@name": "A1102_日本人人口",
                "@level": "1",
                "@unit": "人",
              },
              {
                "@code": "A110201",
                "@name": "A110201_日本人人口（男）",
                "@level": "1",
                "@unit": "人",
              },
              {
                "@code": "A110202",
                "@name": "A110202_日本人人口（女）",
                "@level": "1",
                "@unit": "人",
              },
            ],
          },
          {
            "@id": "area",
            "@name": "地域",
            CLASS: [
              {
                "@code": "00000",
                "@name": "全国",
                "@level": "1",
              },
              {
                "@code": "01000",
                "@name": "北海道",
                "@level": "2",
              },
              {
                "@code": "02000",
                "@name": "青森県",
                "@level": "2",
              },
              {
                "@code": "03000",
                "@name": "岩手県",
                "@level": "2",
              },
              {
                "@code": "04000",
                "@name": "宮城県",
                "@level": "2",
              },
              {
                "@code": "05000",
                "@name": "秋田県",
                "@level": "2",
              },
            ],
          },
          {
            "@id": "time",
            "@name": "時間軸",
            CLASS: [
              {
                "@code": "2020000000",
                "@name": "2020年",
                "@level": "1",
              },
              {
                "@code": "2021000000",
                "@name": "2021年",
                "@level": "1",
              },
              {
                "@code": "2022000000",
                "@name": "2022年",
                "@level": "1",
              },
            ],
          },
        ],
      },
    },
  },
};

const meta: Meta<typeof EstatMetaInfoDisplay> = {
  title: "Organisms/EstatApi/EstatMetaInfoDisplay",
  component: EstatMetaInfoDisplay,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "e-Statメタ情報表示コンポーネント。統計表の基本情報、分類、地域、時間軸、JSONレスポンスをタブ形式で表示し、保存・ダウンロード機能を提供します。",
      },
    },
  },
  argTypes: {
    metaInfo: {
      control: "object",
      description: "e-Statメタ情報レスポンスデータ",
    },
    loading: {
      control: "boolean",
      description: "ローディング状態",
    },
    error: {
      control: "text",
      description: "エラーメッセージ",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    metaInfo: mockMetaInfoResponse,
    loading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story:
          "基本的なメタ情報表示。統計表情報、分類、地域、時間軸、JSONレスポンスのタブが表示されます。",
      },
    },
  },
};

export const Loading: Story = {
  args: {
    metaInfo: null,
    loading: true,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "ローディング状態。スケルトンローダーが表示されます。",
      },
    },
  },
};

export const Error: Story = {
  args: {
    metaInfo: null,
    loading: false,
    error: "メタ情報の取得に失敗しました。統計表IDが正しいか確認してください。",
  },
  parameters: {
    docs: {
      description: {
        story:
          "エラー状態。エラーメッセージがAlertコンポーネントで表示されます。",
      },
    },
  },
};

export const NoData: Story = {
  args: {
    metaInfo: null,
    loading: false,
    error: null,
  },
  parameters: {
    docs: {
      description: {
        story: "データなし状態。何も表示されません。",
      },
    },
  },
};

export const Interactive: Story = {
  render: () => {
    const [metaInfo, setMetaInfo] = useState<EstatMetaInfoResponse | null>(
      null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLoadData = async () => {
      setLoading(true);
      setError(null);
      setMetaInfo(null);

      // 模擬的なデータ読み込み
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setMetaInfo(mockMetaInfoResponse);
      setLoading(false);
    };

    const handleLoadError = async () => {
      setLoading(true);
      setError(null);
      setMetaInfo(null);

      // 模擬的なエラー
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setError("メタ情報の取得に失敗しました。");
      setLoading(false);
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleLoadData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            データを読み込み
          </button>
          <button
            onClick={handleLoadError}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            エラーを発生
          </button>
          <button
            onClick={() => {
              setMetaInfo(null);
              setError(null);
              setLoading(false);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            リセット
          </button>
        </div>

        <EstatMetaInfoDisplay
          metaInfo={metaInfo}
          loading={loading}
          error={error}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "インタラクティブな例。ボタンをクリックしてデータの読み込み、エラー状態、リセットを確認できます。",
      },
    },
  },
};

export const DifferentTabs: Story = {
  render: () => {
    const [activeTab, setActiveTab] = useState<string>("table");

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab("table")}
            className={`px-3 py-1 rounded ${
              activeTab === "table"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            統計表情報
          </button>
          <button
            onClick={() => setActiveTab("categories")}
            className={`px-3 py-1 rounded ${
              activeTab === "categories"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            分類
          </button>
          <button
            onClick={() => setActiveTab("areas")}
            className={`px-3 py-1 rounded ${
              activeTab === "areas"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            地域
          </button>
          <button
            onClick={() => setActiveTab("time")}
            className={`px-3 py-1 rounded ${
              activeTab === "time"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            時間軸
          </button>
          <button
            onClick={() => setActiveTab("json")}
            className={`px-3 py-1 rounded ${
              activeTab === "json"
                ? "bg-indigo-600 text-white"
                : "bg-gray-200 text-gray-700"
            }`}
          >
            JSONレスポンス
          </button>
        </div>

        <EstatMetaInfoDisplay
          metaInfo={mockMetaInfoResponse}
          loading={false}
          error={null}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "タブ切り替えの例。各タブの内容を確認できます。実際のタブ切り替えはコンポーネント内で行われます。",
      },
    },
  },
};

export const SaveStates: Story = {
  render: () => {
    const [saveResult, setSaveResult] = useState<{
      success: boolean;
      message: string;
    } | null>(null);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      setSaving(true);
      setSaveResult(null);

      // 模擬的な保存処理
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setSaving(false);
      setSaveResult({
        success: true,
        message: "メタ情報が正常に保存されました。",
      });
    };

    const handleSaveError = async () => {
      setSaving(true);
      setSaveResult(null);

      // 模擬的な保存エラー
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSaving(false);
      setSaveResult({
        success: false,
        message: "保存に失敗しました。しばらくしてから再試行してください。",
      });
    };

    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存成功をシミュレート"}
          </button>
          <button
            onClick={handleSaveError}
            disabled={saving}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {saving ? "保存中..." : "保存エラーをシミュレート"}
          </button>
          <button
            onClick={() => {
              setSaveResult(null);
              setSaving(false);
            }}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            リセット
          </button>
        </div>

        <EstatMetaInfoDisplay
          metaInfo={mockMetaInfoResponse}
          loading={false}
          error={null}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "保存状態の例。保存成功・失敗の状態をシミュレートできます。",
      },
    },
  },
};

export const LargeDataset: Story = {
  render: () => {
    // より大きなデータセットのモック
    const largeMockData: EstatMetaInfoResponse = {
      ...mockMetaInfoResponse,
      GET_META_INFO: {
        ...mockMetaInfoResponse.GET_META_INFO,
        METADATA_INF: {
          ...mockMetaInfoResponse.GET_META_INFO.METADATA_INF,
          CLASS_INF: {
            CLASS_OBJ: [
              ...mockMetaInfoResponse.GET_META_INFO.METADATA_INF.CLASS_INF
                .CLASS_OBJ,
              {
                "@id": "cat02",
                "@name": "Ｂ　労働",
                CLASS: Array.from({ length: 50 }, (_, i) => ({
                  "@code": `B${String(i + 1).padStart(3, "0")}`,
                  "@name": `B${String(i + 1).padStart(3, "0")}_労働項目${
                    i + 1
                  }`,
                  "@level": "1",
                  "@unit": "人",
                })),
              },
              {
                "@id": "cat03",
                "@name": "Ｃ　住宅",
                CLASS: Array.from({ length: 30 }, (_, i) => ({
                  "@code": `C${String(i + 1).padStart(3, "0")}`,
                  "@name": `C${String(i + 1).padStart(3, "0")}_住宅項目${
                    i + 1
                  }`,
                  "@level": "1",
                  "@unit": "戸",
                })),
              },
            ],
          },
        },
      },
    };

    return (
      <EstatMetaInfoDisplay
        metaInfo={largeMockData}
        loading={false}
        error={null}
      />
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "大きなデータセットの例。多数の分類項目を含むメタ情報の表示を確認できます。",
      },
    },
  },
};

export const MobileLayout: Story = {
  render: () => (
    <div className="w-80 mx-auto">
      <EstatMetaInfoDisplay
        metaInfo={mockMetaInfoResponse}
        loading={false}
        error={null}
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
    <div className="w-768 mx-auto">
      <EstatMetaInfoDisplay
        metaInfo={mockMetaInfoResponse}
        loading={false}
        error={null}
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
    <div className="w-full">
      <EstatMetaInfoDisplay
        metaInfo={mockMetaInfoResponse}
        loading={false}
        error={null}
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
