import type { Meta, StoryObj } from "@storybook/react";
import { Sparkline, SparklineDataPoint } from "./Sparkline";

// モックデータ
const generateMockData = (
  count: number,
  startYear: number = 2020
): SparklineDataPoint[] => {
  return Array.from({ length: count }, (_, i) => ({
    year: (startYear + i).toString(),
    value: Math.random() * 100 + 50,
  }));
};

const ascendingData: SparklineDataPoint[] = [
  { year: "2020", value: 20 },
  { year: "2021", value: 35 },
  { year: "2022", value: 45 },
  { year: "2023", value: 60 },
  { year: "2024", value: 75 },
];

const descendingData: SparklineDataPoint[] = [
  { year: "2020", value: 80 },
  { year: "2021", value: 70 },
  { year: "2022", value: 55 },
  { year: "2023", value: 40 },
  { year: "2024", value: 25 },
];

const volatileData: SparklineDataPoint[] = [
  { year: "2020", value: 50 },
  { year: "2021", value: 80 },
  { year: "2022", value: 30 },
  { year: "2023", value: 90 },
  { year: "2024", value: 40 },
];

const largeDataset: SparklineDataPoint[] = generateMockData(20, 2005);

const meta: Meta<typeof Sparkline> = {
  title: "Atoms/Sparkline",
  component: Sparkline,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "スパークライン（小さな折れ線グラフ）コンポーネント。D3.jsを使用してデータの傾向を視覚化します。ツールチップ、エリア表示、カスタマイズ可能な色とサイズを提供します。",
      },
    },
  },
  argTypes: {
    data: {
      description: "表示するデータ配列",
    },
    width: {
      control: { type: "number", min: 100, max: 500, step: 10 },
      description: "グラフの幅",
    },
    height: {
      control: { type: "number", min: 20, max: 100, step: 5 },
      description: "グラフの高さ",
    },
    color: {
      control: "color",
      description: "グラフの色",
    },
    showArea: {
      control: "boolean",
      description: "エリア表示の有無",
    },
    showTooltip: {
      control: "boolean",
      description: "ツールチップ表示の有無",
    },
    className: {
      control: "text",
      description: "追加CSSクラス",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: ascendingData,
    width: 200,
    height: 40,
    color: "#4f46e5",
    showArea: true,
    showTooltip: true,
  },
};

export const Ascending: Story = {
  args: {
    data: ascendingData,
    width: 250,
    height: 50,
    color: "#10b981",
    showArea: true,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: "上昇傾向のデータの例です。",
      },
    },
  },
};

export const Descending: Story = {
  args: {
    data: descendingData,
    width: 250,
    height: 50,
    color: "#ef4444",
    showArea: true,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: "下降傾向のデータの例です。",
      },
    },
  },
};

export const Volatile: Story = {
  args: {
    data: volatileData,
    width: 250,
    height: 50,
    color: "#f59e0b",
    showArea: true,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: "変動の激しいデータの例です。",
      },
    },
  },
};

export const WithoutArea: Story = {
  args: {
    data: ascendingData,
    width: 200,
    height: 40,
    color: "#8b5cf6",
    showArea: false,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: "エリア表示なしの例です。",
      },
    },
  },
};

export const WithoutTooltip: Story = {
  args: {
    data: ascendingData,
    width: 200,
    height: 40,
    color: "#06b6d4",
    showArea: true,
    showTooltip: false,
  },
  parameters: {
    docs: {
      description: {
        story: "ツールチップ表示なしの例です。",
      },
    },
  },
};

export const LargeDataset: Story = {
  args: {
    data: largeDataset,
    width: 300,
    height: 60,
    color: "#ec4899",
    showArea: true,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: "大量のデータ（20点）の例です。",
      },
    },
  },
};

export const SmallSize: Story = {
  args: {
    data: ascendingData,
    width: 150,
    height: 30,
    color: "#84cc16",
    showArea: true,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: "小さいサイズの例です。",
      },
    },
  },
};

export const LargeSize: Story = {
  args: {
    data: ascendingData,
    width: 400,
    height: 80,
    color: "#dc2626",
    showArea: true,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: "大きいサイズの例です。",
      },
    },
  },
};

export const DifferentColors: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">青</h3>
        <Sparkline
          data={ascendingData}
          width={200}
          height={40}
          color="#3b82f6"
          showArea={true}
          showTooltip={true}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">緑</h3>
        <Sparkline
          data={ascendingData}
          width={200}
          height={40}
          color="#10b981"
          showArea={true}
          showTooltip={true}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">赤</h3>
        <Sparkline
          data={descendingData}
          width={200}
          height={40}
          color="#ef4444"
          showArea={true}
          showTooltip={true}
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">紫</h3>
        <Sparkline
          data={volatileData}
          width={200}
          height={40}
          color="#8b5cf6"
          showArea={true}
          showTooltip={true}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "異なる色での表示例です。",
      },
    },
  },
};

export const InCard: Story = {
  render: () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          売上推移
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          2020-2024
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            ¥1,234,567
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            +12.5% 前年比
          </p>
        </div>
        <div className="ml-4">
          <Sparkline
            data={ascendingData}
            width={150}
            height={40}
            color="#10b981"
            showArea={true}
            showTooltip={true}
          />
        </div>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "カード内での使用例です。",
      },
    },
  },
};

export const MultipleSparklines: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          ユーザー数
        </h4>
        <Sparkline
          data={ascendingData}
          width={200}
          height={40}
          color="#3b82f6"
          showArea={true}
          showTooltip={true}
        />
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          売上
        </h4>
        <Sparkline
          data={volatileData}
          width={200}
          height={40}
          color="#10b981"
          showArea={true}
          showTooltip={true}
        />
      </div>
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
          エラー率
        </h4>
        <Sparkline
          data={descendingData}
          width={200}
          height={40}
          color="#ef4444"
          showArea={true}
          showTooltip={true}
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "複数のスパークラインを並べて表示する例です。",
      },
    },
  },
};

export const EmptyData: Story = {
  args: {
    data: [],
    width: 200,
    height: 40,
    color: "#6b7280",
    showArea: true,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: "データが空の場合の例です。",
      },
    },
  },
};

export const SingleDataPoint: Story = {
  args: {
    data: [{ year: "2024", value: 100 }],
    width: 200,
    height: 40,
    color: "#8b5cf6",
    showArea: true,
    showTooltip: true,
  },
  parameters: {
    docs: {
      description: {
        story: "データが1点のみの場合の例です。",
      },
    },
  },
};
