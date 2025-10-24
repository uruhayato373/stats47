import type { Meta, StoryObj } from "@storybook/react";
import { HeaderAuthSection } from "./HeaderAuthSection";

const meta: Meta<typeof HeaderAuthSection> = {
  title: "Features/Auth/HeaderAuthSection",
  component: HeaderAuthSection,
  tags: ["autodocs"],
  parameters: {
    nextjs: {
      appDirectory: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof HeaderAuthSection>;

export const Default: Story = {};
