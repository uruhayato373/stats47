import { Home, Settings } from "lucide-react";

import { ActiveSidebarMenuButton } from "./ActiveSidebarMenuButton";

import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof ActiveSidebarMenuButton> = {
  title: "Organisms/Layout/Sidebar/ActiveSidebarMenuButton",
  component: ActiveSidebarMenuButton,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/admin",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ActiveSidebarMenuButton>;

export const Default: Story = {
  args: {
    href: "/admin",
    children: (
      <>
        <Settings className="size-4" />
        <span>管理画面</span>
      </>
    ),
  },
};

export const Active: Story = {
  args: {
    href: "/admin",
    children: (
      <>
        <Settings className="size-4" />
        <span>管理画面</span>
      </>
    ),
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/admin",
      },
    },
  },
};

export const Inactive: Story = {
  args: {
    href: "/admin",
    children: (
      <>
        <Settings className="size-4" />
        <span>管理画面</span>
      </>
    ),
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
};

export const WithHomeIcon: Story = {
  args: {
    href: "/",
    children: (
      <>
        <Home className="size-4" />
        <span>ホーム</span>
      </>
    ),
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
};
