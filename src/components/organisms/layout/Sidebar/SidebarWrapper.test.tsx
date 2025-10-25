import { headers } from "next/headers";

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarWrapper } from "./SidebarWrapper";

// モック
vi.mock("next/headers", () => ({
  headers: vi.fn(),
}));

const mockHeaders = vi.mocked(headers);

describe("SidebarWrapper", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows AdminSidebar on /admin path", async () => {
    mockHeaders.mockResolvedValue({
      get: (key: string) => (key === "x-pathname" ? "/admin" : null),
    });

    const component = await SidebarWrapper();
    render(component);

    // AdminSidebarの要素が存在することを確認
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });

  it("shows AppSidebar on root path", async () => {
    mockHeaders.mockResolvedValue({
      get: (key: string) => (key === "x-pathname" ? "/" : null),
    });

    const component = await SidebarWrapper();
    render(component);

    expect(screen.getByText("ホーム")).toBeInTheDocument();
  });

  it("shows AppSidebar on category paths", async () => {
    mockHeaders.mockResolvedValue({
      get: (key: string) => (key === "x-pathname" ? "/population" : null),
    });

    const component = await SidebarWrapper();
    render(component);

    expect(screen.getByText("ホーム")).toBeInTheDocument();
  });

  it("handles sub-admin routes correctly", async () => {
    mockHeaders.mockResolvedValue({
      get: (key: string) => (key === "x-pathname" ? "/admin/users" : null),
    });

    const component = await SidebarWrapper();
    render(component);

    // サブルートでもAdminSidebarが表示されることを確認
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
  });
});
