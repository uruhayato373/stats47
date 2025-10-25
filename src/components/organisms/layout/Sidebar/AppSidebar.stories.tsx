import { AppSidebar } from "./AppSidebar";

import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof AppSidebar> = {
  title: "Organisms/Layout/Sidebar/AppSidebar",
  component: AppSidebar,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
};

export default meta;
type Story = StoryObj<typeof AppSidebar>;

export const Default: Story = {};
