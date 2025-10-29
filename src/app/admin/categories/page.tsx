import { CategoriesManagement } from "@/features/category/components/admin/CategoriesManagement";

/**
 * カテゴリ管理画面
 * useSWRを使用してクライアントサイドでデータを取得するため、
 * サーバーコンポーネントから直接データを渡す必要はありません
 */
export default async function CategoriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">カテゴリ管理</h2>
      </div>
      <CategoriesManagement />
    </div>
  );
}

