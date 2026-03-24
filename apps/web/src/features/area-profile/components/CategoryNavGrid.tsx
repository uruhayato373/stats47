import Link from "next/link";
import type { Category } from "@stats47/category";
import { CategoryIcon, getCategoryColor } from "@/features/category";

interface Props {
    categories: Category[];
    areaCode: string;
    basePath?: string;
}

export function CategoryNavGrid({ categories, areaCode, basePath }: Props) {
    return (
        <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">カテゴリ別データ</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => {
                    const color = getCategoryColor(cat.categoryKey);
                    return (
                        <Link
                            key={cat.categoryKey}
                            href={`${basePath ?? `/areas/${areaCode}`}/${cat.categoryKey}`}
                            className="group flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all"
                        >
                            <div className={`p-2 rounded-lg ${color.bg} ${color.text} ${color.hoverBg} ${color.hoverText} transition-colors shrink-0`}>
                                <CategoryIcon
                                    categoryKey={cat.categoryKey}
                                    lucideIconName={cat.icon || ""}
                                    className="h-5 w-5"
                                />
                            </div>
                            <span className="text-sm font-medium truncate">
                                {cat.categoryName}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </section>
    );
}
