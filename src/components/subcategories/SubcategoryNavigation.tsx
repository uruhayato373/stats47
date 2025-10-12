import React from "react";
import Link from "next/link";

interface CategoryData {
  id: string;
  name: string;
  description: string;
  icon: string;
  displayOrder: number;
  subcategories: SubcategoryData[];
}

interface SubcategoryData {
  id: string;
  categoryId: string;
  name: string;
  displayOrder?: number;
  component?: string;
  areaComponent?: string;
}

interface SubcategoryNavigationProps {
  category: CategoryData;
  currentSubcategory: SubcategoryData;
}

/**
 * サブカテゴリ間のタブナビゲーション
 */
export const SubcategoryNavigation: React.FC<SubcategoryNavigationProps> = ({
  category,
  currentSubcategory,
}) => {
  return (
    <div className="border-b border-gray-200 dark:border-neutral-700">
      <nav
        className="-mb-px flex space-x-8 overflow-x-auto px-4"
        aria-label="サブカテゴリ"
      >
        {category.subcategories
          .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
          .map((subcategory) => {
            const isActive = subcategory.id === currentSubcategory.id;
            const href = `/${category.id}/${subcategory.id}`;

            return (
              <Link
                key={subcategory.id}
                href={href}
                className={`
                  whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors
                  ${
                    isActive
                      ? "border-blue-500 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-neutral-400 dark:hover:border-neutral-600 dark:hover:text-neutral-300"
                  }
                `}
                aria-current={isActive ? "page" : undefined}
              >
                {subcategory.name}
              </Link>
            );
          })}
      </nav>
    </div>
  );
};
