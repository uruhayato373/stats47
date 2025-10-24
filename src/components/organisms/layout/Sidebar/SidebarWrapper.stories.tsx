import type { Meta, StoryObj } from "@storybook/react";
import { SidebarWrapper } from "./SidebarWrapper";

const meta: Meta<typeof SidebarWrapper> = {
  title: "Organisms/Layout/Sidebar/SidebarWrapper",
  component: SidebarWrapper,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof SidebarWrapper>;

// Note: サーバーコンポーネントのためStorybookでの表示は制限される
export const AdminRoute: Story = {
  parameters: {
    docs: {
      description: {
        story: "/adminパスの場合、AdminSidebarを表示",
      },
    },
  },
};

export const DefaultRoute: Story = {
  parameters: {
    docs: {
      description: {
        story: "それ以外の場合、AppSidebarを表示",
      },
    },
  },
};
