import type { Meta, StoryObj } from "@storybook/react";

import { BreadcrumbAreaDropdown } from "./BreadcrumbAreaDropdown";

const meta: Meta<typeof BreadcrumbAreaDropdown> = {
  title: "Organisms/Layout/StatsBreadcrumb/BreadcrumbAreaDropdown",
  component: BreadcrumbAreaDropdown,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof BreadcrumbAreaDropdown>;

export const National: Story = {
  args: {
    areaCode: "00000",
    categoryId: "landweather",
    subcategoryId: "land-area",
    pageType: "dashboard",
  },
};

export const Hokkaido: Story = {
  args: {
    areaCode: "01000",
    categoryId: "landweather",
    subcategoryId: "land-area",
    pageType: "dashboard",
  },
};

export const Tokyo: Story = {
  args: {
    areaCode: "13000",
    categoryId: "landweather",
    subcategoryId: "land-area",
    pageType: "dashboard",
  },
};

export const Osaka: Story = {
  args: {
    areaCode: "27000",
    categoryId: "landweather",
    subcategoryId: "land-area",
    pageType: "dashboard",
  },
};

export const Okinawa: Story = {
  args: {
    areaCode: "47000",
    categoryId: "landweather",
    subcategoryId: "land-area",
    pageType: "dashboard",
  },
};

