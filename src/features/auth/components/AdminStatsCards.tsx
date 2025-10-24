import { BarChart3, Settings, Shield, Users } from "lucide-react";
import type { UserStats } from "../types";
import { UserStatCard } from "./UserStatCard";

interface AdminStatsCardsProps {
  stats: UserStats;
}

export function AdminStatsCards({ stats }: AdminStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <UserStatCard
        icon={Users}
        iconColor="text-indigo-600"
        label="総ユーザー数"
        value={stats.totalUsers}
      />
      <UserStatCard
        icon={Shield}
        iconColor="text-purple-600"
        label="管理者数"
        value={stats.adminCount}
      />
      <UserStatCard
        icon={BarChart3}
        iconColor="text-green-600"
        label="アクティブユーザー"
        value={stats.activeUsers}
      />
      <UserStatCard
        icon={Settings}
        iconColor="text-orange-600"
        label="開発ツール"
        value=""
        link={{ href: "/admin/dev-tools", text: "開発ツールへ" }}
      />
    </div>
  );
}
