import Link from "next/link";

import { CategoryIcon } from "./CategoryIcon";
import { getCategoryColor } from "../utils/category-colors";

export interface CategoryGridItem {
  categoryKey: string;
  categoryName: string;
  icon?: string | null;
  itemCount?: number;
}

interface CategoryGridProps {
  categories: CategoryGridItem[];
}

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {categories.map((cat) => {
        const color = getCategoryColor(cat.categoryKey);
        return (
          <Link
            key={cat.categoryKey}
            href={`/category/${cat.categoryKey}`}
            data-testid="category-card"
            className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
          >
            <div
              className={`p-2 rounded-lg ${color.bg} ${color.text} ${color.hoverBg} ${color.hoverText} transition-colors shrink-0`}
            >
              <CategoryIcon
                categoryKey={cat.categoryKey}
                lucideIconName={cat.icon || ""}
                className="h-5 w-5"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-sm font-medium block truncate">
                {cat.categoryName}
              </span>
              {cat.itemCount != null && (
                <span className="text-xs text-muted-foreground">
                  {cat.itemCount}件
                </span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
