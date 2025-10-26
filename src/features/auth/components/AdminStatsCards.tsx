import { BarChart3, Settings, Shield, Users } from "lucide-react";

import { UserStatCard } from "./UserStatCard";

import type { UserStats } from "../types";

interface AdminStatsCardsProps {
  stats: UserStats;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <UserStatCard
        icon={Users}
        iconColor="text-primary"
        label="総ユーザー数"
        value={stats.totalUsers}
      />
      <UserStatCard
        icon={Shield}
        iconColor="text-primary"
        label="管理者数"
        value={stats.adminCount}
      />
      <UserStatCard
        icon={BarChart3}
        iconColor="text-primary"
        label="アクティブユーザー"
        value={stats.activeUsers}
      />
      <UserStatCard
        icon={Settings}
        iconColor="text-primary"
        label="開発ツール"
        value=""
        link={{ href: "/admin/dev-tools", text: "開発ツールへ" }}
      />
    </div>
  );
}
