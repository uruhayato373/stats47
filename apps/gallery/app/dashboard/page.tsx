import { DashboardView } from "@/components/dashboard/dashboard-view";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プロジェクト現況 — stats47 統合メディアコンソール",
};

export default function DashboardPage() {
  return <DashboardView />;
}
