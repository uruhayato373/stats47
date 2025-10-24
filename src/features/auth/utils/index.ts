import type { User, UserStats } from "../types";

/**
 * ユーザー統計を計算（サーバーサイド）
 */
export function calculateUserStats(users: User[]): UserStats {
  return {
    totalUsers: users.length,
    adminCount: users.filter((user) => user.role === "admin").length,
    activeUsers: users.filter((user) => user.is_active).length,
  };
}
