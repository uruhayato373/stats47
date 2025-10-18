import type { Meta, StoryObj } from "@storybook/react";
import { ErrorView } from "./ErrorView";

const meta: Meta<typeof ErrorView> = {
  title: "Atoms/ErrorView",
  component: ErrorView,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "エラー情報を表示するコンポーネント。エラーメッセージ、詳細情報、再試行ボタンを提供します。",
      },
    },
  },
  argTypes: {
    error: {
      description: "表示するエラーオブジェクト",
    },
    details: {
      description: "エラーの詳細情報（統計表ID、カテゴリ、年度など）",
    },
    onRetry: {
      action: "retry",
      description: "再試行ボタンがクリックされた時のコールバック関数",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    error: new Error("データの取得に失敗しました"),
  },
};

export const WithDetails: Story = {
  args: {
    error: new Error("統計データの取得に失敗しました"),
    details: {
      statsDataId: "0000010101",
      cdCat01: "A",
      yearCode: "2023",
    },
  },
};

export const WithRetryButton: Story = {
  args: {
    error: new Error("ネットワークエラーが発生しました"),
    onRetry: () => console.log("再試行がクリックされました"),
  },
};

export const WithAllDetails: Story = {
  args: {
    error: new Error("APIリクエストがタイムアウトしました"),
    details: {
      statsDataId: "0000020201",
      cdCat01: "B",
      yearCode: "2024",
    },
    onRetry: () => console.log("再試行がクリックされました"),
  },
};

export const LongErrorMessage: Story = {
  args: {
    error: new Error(
      "サーバーとの通信中に予期しないエラーが発生しました。しばらく時間をおいてから再度お試しください。問題が解決しない場合は、システム管理者にお問い合わせください。"
    ),
    details: {
      statsDataId: "0000030301",
      cdCat01: "C",
      yearCode: "2023",
    },
    onRetry: () => console.log("再試行がクリックされました"),
  },
};

export const NetworkError: Story = {
  args: {
    error: new Error("ネットワーク接続を確認してください"),
    onRetry: () => console.log("再試行がクリックされました"),
  },
};

export const ServerError: Story = {
  args: {
    error: new Error("サーバーエラー (500)"),
    details: {
      statsDataId: "0000040401",
    },
    onRetry: () => console.log("再試行がクリックされました"),
  },
};

export const ValidationError: Story = {
  args: {
    error: new Error("入力されたパラメータが無効です"),
    details: {
      cdCat01: "X",
      yearCode: "invalid",
    },
  },
};

export const WithoutRetryButton: Story = {
  args: {
    error: new Error("致命的なエラーが発生しました"),
    details: {
      statsDataId: "0000050501",
      cdCat01: "D",
      yearCode: "2022",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "onRetryが提供されていない場合、再試行ボタンは表示されません。",
      },
    },
  },
};

export const MinimalDetails: Story = {
  args: {
    error: new Error("データが見つかりません"),
    details: {
      statsDataId: "0000060601",
    },
  },
  parameters: {
    docs: {
      description: {
        story: "詳細情報の一部のみが提供されている場合の表示例です。",
      },
    },
  },
};
