import type { Meta, StoryObj } from "@storybook/react";
import { Footer } from "../Footer";

const meta: Meta<typeof Footer> = {
  title: "Components/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "アプリケーション全体のフッター情報とリンクを提供するコンポーネント。ブランド情報、クイックリンク、統計カテゴリへの直接リンクを表示します。",
      },
    },
  },
  tags: ["autodocs"],
  argTypes: {
    // 必要に応じてpropsの制御を追加
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Mobile: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

export const Tablet: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
  },
};

export const Desktop: Story = {
  args: {},
  parameters: {
    viewport: {
      defaultViewport: "desktop",
    },
  },
};
