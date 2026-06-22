import { SurfaceLinkCard } from "@/components/surface";

import { CategoryIcon, getCategoryColor } from "@/features/category";

import type { Category } from "@stats47/category";

interface Props {
    categories: Category[];
    areaCode: string;
    basePath?: string;
}

/** カテゴリキー → テーマスラグのマッピング（Type A テーマのみ） */
const CATEGORY_TO_THEME: Record<string, string> = {
  population: "population-dynamics",
  laborwage: "labor-wages",
  economy: "local-economy",
  agriculture: "local-economy",
  miningindustry: "manufacturing",
  construction: "living-housing",
  commercial: "local-economy",
  tourism: "tourism",
  socialsecurity: "healthcare",
  educationsports: "education-culture",
  safetyenvironment: "safety",
  landweather: "climate",
  international: "foreign-residents",
  administrativefinancial: "local-finance",
  // infrastructure / energy / ict はテーマなし → エリアプロフィール
};

export function CategoryNavGrid({ categories, areaCode }: Props) {
    return (
        <section>
            <h2 className="text-2xl font-bold text-foreground mb-4">テーマ別データ</h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {categories.map((cat) => {
                    const themeSlug = CATEGORY_TO_THEME[cat.categoryKey];
                    const href = themeSlug
                        ? `/areas/${areaCode}/${themeSlug}`
                        : `/category/${cat.categoryKey}`;
                    const color = getCategoryColor(cat.categoryKey);
                    return (
                        <SurfaceLinkCard
                            key={cat.categoryKey}
                            href={href}
                            className="group flex items-center gap-3 p-3"
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
                        </SurfaceLinkCard>
                    );
                })}
            </div>
        </section>
    );
}
