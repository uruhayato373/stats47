import { Suspense } from "react";

import { fetchUsers } from "@/features/auth/actions";
import { AdminLoadingSkeleton } from "@/features/auth/components/AdminLoadingSkeleton";
import { AdminPageHeader } from "@/features/auth/components/AdminPageHeader";
import { AdminStatsCards } from "@/features/auth/components/AdminStatsCards";
import { UserManagementTableServer } from "@/features/auth/components/UserManagementTableServer";
import { calculateUserStats } from "@/features/auth/utils";

/**
 * 管理画面ページ
 *
 * このページはサーバーコンポーネントとして実装されており、
 * Next.js 15のServer Actionsを活用してパフォーマンスとセキュリティを向上させています。
 *
 * 環境ごとの動作:
 * - Mock環境: 認証バイパス（自動的に管理者としてアクセス）
 * - API環境: 認証必須（ログインフローをテスト可能）
 * - 本番環境: 認証必須
 *
 * 主な機能:
 * - ユーザー一覧の表示
 * - ユーザー統計の表示
 * - ユーザー状態の切り替え（Server Actions）
 *
 * アーキテクチャ:
 * - サーバーサイドでデータ取得（fetchUsers）
 * - サーバーサイドで統計計算（calculateUserStats）
 * - 最小限のクライアントコンポーネント（UserToggleButton）
 */
export default async function AdminPage() {
  // Server Actionsでユーザーデータを取得
  // モック環境では data/mock/auth/users.json から読み込み
  const users = await fetchUsers();

  // ユーザー統計を計算（総数、管理者数、アクティブユーザー数）
  const stats = calculateUserStats(users);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ページヘッダー */}
        <AdminPageHeader />

        {/* 統計カード（総ユーザー数、管理者数、アクティブユーザー数） */}
        <AdminStatsCards stats={stats} />

        {/* ユーザー管理テーブル（Suspenseでローディング状態を管理） */}
        <Suspense fallback={<AdminLoadingSkeleton />}>
          <UserManagementTableServer users={users} />
        </Suspense>
      </div>
    </div>
  );
}
