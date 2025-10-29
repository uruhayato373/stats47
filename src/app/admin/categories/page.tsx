import { CategoriesManagement } from "@/features/category/components/admin/CategoriesManagement";
import { CategoryRepository } from "@/features/category/repositories/category-repository";

/**
 * カテゴリ管理画面
 */
export default async function CategoriesPage() {
  const repository = await CategoryRepository.create();
  const categories = await repository.getAllCategories();

  return (
    <div className="max-w-7xl mx-auto px-2 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">カテゴリ管理</h2>
      </div>
      <CategoriesManagement categories={categories} />
    </div>
  );
}

