import type { Meta, StoryObj } from "@storybook/react";
import { UserMenu } from "./UserMenu";

const meta: Meta<typeof UserMenu> = {
  title: "Features/Auth/UserMenu",
  component: UserMenu,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof UserMenu>;

export const Default: Story = {
  args: {
    user: {
      username: "testuser",
      name: "テストユーザー",
      email: "test@example.com",
      role: "user",
    },
  },
};

export const Admin: Story = {
  args: {
    user: {
      username: "admin",
      name: "管理者",
      email: "admin@example.com",
      role: "admin",
    },
  },
};

export const WithoutUsername: Story = {
  args: {
    user: {
      name: "名前のみユーザー",
      email: "nameonly@example.com",
      role: "user",
    },
  },
};
