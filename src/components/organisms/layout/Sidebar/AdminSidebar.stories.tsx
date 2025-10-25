import { AdminSidebar } from "./AdminSidebar";

import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof AdminSidebar> = {
  title: "Organisms/Layout/Sidebar/AdminSidebar",
  component: AdminSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AdminSidebar>;

export const Default: Story = {};
