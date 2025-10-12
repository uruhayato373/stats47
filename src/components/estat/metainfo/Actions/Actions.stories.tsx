import type { Meta, StoryObj } from "@storybook/react";
import Actions from "./Actions";

const meta = {
  title: "estat/metainfo/EstatMetainfoActions",
  component: Actions,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Actions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    onRefresh: () => console.log("Refresh clicked"),
    hasError: false,
  },
};

export const WithError: Story = {
  args: {
    onRefresh: () => console.log("Refresh clicked"),
    onRetry: () => console.log("Retry clicked"),
    hasError: true,
  },
};

export const WithoutRetry: Story = {
  args: {
    onRefresh: () => console.log("Refresh clicked"),
    hasError: true,
  },
};
