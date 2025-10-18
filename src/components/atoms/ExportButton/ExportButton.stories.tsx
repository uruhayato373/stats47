import type { Meta, StoryObj } from "@storybook/react";
import { ExportButton } from "./ExportButton";
import { FormattedValue } from "@/lib/estat-api";

// モックデータ
const mockData: FormattedValue[] = [
  { value: "100", label: "東京都", year: "2023" },
  { value: "95", label: "大阪府", year: "2023" },
  { value: "90", label: "神奈川県", year: "2023" },
  { value: "85", label: "愛知県", year: "2023" },
  { value: "80", label: "埼玉県", year: "2023" },
];

const largeMockData: FormattedValue[] = Array.from({ length: 100 }, (_, i) => ({
  value: (Math.random() * 100).toFixed(1),
  label: `都道府県${i + 1}`,
  year: "2023",
}));

const meta: Meta<typeof ExportButton> = {
  title: "Atoms/ExportButton",
  component: ExportButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "CSVエクスポートボタンコンポーネント。データをCSV形式でダウンロードできます。ローディング状態、データ件数表示、カスタマイズ可能なラベルとオプションを提供します。",
      },
    },
  },
  argTypes: {
    data: {
      description: "エクスポート対象のデータ配列",
    },
    filename: {
      control: "text",
      description: "ファイル名（拡張子なし）",
    },
    dataType: {
      control: "text",
      description: "データ種別（自動ファイル名生成用）",
    },
    metadata: {
      description: "メタデータ（自動ファイル名生成用）",
    },
    csvOptions: {
      description: "CSVエクスポートオプション",
    },
    className: {
      control: "text",
      description: "追加CSSクラス",
    },
    label: {
      control: "text",
      description: "ボタンテキスト",
    },
    iconSize: {
      control: { type: "number", min: 12, max: 24, step: 2 },
      description: "アイコンサイズ",
    },
    onExportComplete: {
      action: "exportComplete",
      description: "エクスポート完了時のコールバック関数",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    data: mockData,
    label: "CSVダウンロード",
  },
};

export const WithFilename: Story = {
  args: {
    data: mockData,
    filename: "都道府県ランキング",
    label: "CSVダウンロード",
  },
};

export const WithDataType: Story = {
  args: {
    data: mockData,
    dataType: "prefecture-ranking",
    label: "CSVダウンロード",
  },
};

export const WithMetadata: Story = {
  args: {
    data: mockData,
    dataType: "prefecture-ranking",
    metadata: {
      year: "2023",
      areaName: "全国",
    },
    label: "CSVダウンロード",
  },
};

export const CustomLabel: Story = {
  args: {
    data: mockData,
    label: "データをエクスポート",
    iconSize: 18,
  },
};

export const LargeDataset: Story = {
  args: {
    data: largeMockData,
    dataType: "large-dataset",
    metadata: {
      year: "2023",
    },
    label: "CSVダウンロード",
  },
  parameters: {
    docs: {
      description: {
        story: "大量のデータ（100行）をエクスポートする例です。",
      },
    },
  },
};

export const EmptyData: Story = {
  args: {
    data: [],
    label: "CSVダウンロード",
  },
  parameters: {
    docs: {
      description: {
        story: "データが空の場合、ボタンは無効化されます。",
      },
    },
  },
};

export const CustomStyling: Story = {
  args: {
    data: mockData,
    label: "エクスポート",
    className: "bg-blue-500 text-white hover:bg-blue-600 border-blue-500",
    iconSize: 20,
  },
};

export const WithCSVOptions: Story = {
  args: {
    data: mockData,
    csvOptions: {
      delimiter: ",",
      encoding: "utf-8",
      includeHeaders: true,
    },
    label: "CSVダウンロード",
  },
};

export const SmallIcon: Story = {
  args: {
    data: mockData,
    label: "CSV",
    iconSize: 12,
  },
};

export const LargeIcon: Story = {
  args: {
    data: mockData,
    label: "CSVダウンロード",
    iconSize: 24,
  },
};

export const WithCallback: Story = {
  args: {
    data: mockData,
    label: "CSVダウンロード",
    onExportComplete: (success) => {
      console.log(`エクスポート${success ? "成功" : "失敗"}`);
    },
  },
  parameters: {
    docs: {
      description: {
        story: "エクスポート完了時のコールバック関数を使用する例です。",
      },
    },
  },
};

export const MinimalData: Story = {
  args: {
    data: [{ value: "1", label: "テストデータ", year: "2023" }],
    label: "CSVダウンロード",
  },
  parameters: {
    docs: {
      description: {
        story: "最小限のデータ（1行）をエクスポートする例です。",
      },
    },
  },
};

export const DifferentDataTypes: Story = {
  render: () => (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium mb-2">都道府県データ</h3>
        <ExportButton
          data={mockData}
          dataType="prefecture"
          metadata={{ year: "2023" }}
          label="都道府県データをエクスポート"
        />
      </div>
      <div>
        <h3 className="text-sm font-medium mb-2">市区町村データ</h3>
        <ExportButton
          data={[
            { value: "50", label: "渋谷区", year: "2023" },
            { value: "45", label: "新宿区", year: "2023" },
          ]}
          dataType="municipality"
          metadata={{ year: "2023", areaName: "東京都" }}
          label="市区町村データをエクスポート"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "異なるデータタイプでのエクスポート例です。",
      },
    },
  },
};
