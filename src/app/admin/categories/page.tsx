import { AdminPageTitle } from "@/components/organisms/layout/AdminPageTitle";
import { CategoriesManagement } from "@/features/category/components/admin/CategoriesManagement";

export const runtime = "edge";

/**
 * カテゴリ管理画面
 * useSWRを使用してクライアントサイドでデータを取得するため、
 * サーバーコンポーネントから直接データを渡す必要はありません
 */
export default async function CategoriesPage() {
  return (
    <>
      <AdminPageTitle title="カテゴリ管理" iconName="Database" />
      <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
        <CategoriesManagement />
      </div>
    </>
  );
}

