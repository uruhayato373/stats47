import { LoginButton } from "./LoginButton";

import type { Meta, StoryObj } from "@storybook/react";

const meta: Meta<typeof LoginButton> = {
  title: "Features/Auth/LoginButton",
  component: LoginButton,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof LoginButton>;

export const Default: Story = {
  args: {
    onClick: () => console.log("Login clicked"),
  },
};
