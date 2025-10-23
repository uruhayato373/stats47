import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import { listCategories } from "@/lib/taxonomy/category";
import { ChevronRightIcon } from "lucide-react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category } = await params;
  const categories = listCategories();
  const categoryData = categories.find((c) => c.id === category);

  return {
    title: categoryData?.name || "カテゴリ",
    description: `${categoryData?.name}に関する統計データ`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params;
  const categories = listCategories();
  const categoryData = categories.find((c) => c.id === category);

  if (!categoryData) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">{categoryData.name}</h1>
      <div className="grid gap-4">
        {categoryData.subcategories?.map((subcategory) => (
          <Item key={subcategory.id} variant="outline" asChild>
            <a href={`/${category}/${subcategory.id}`}>
              <ItemContent>
                <ItemTitle>{subcategory.name}</ItemTitle>
                <ItemDescription>
                  {subcategory.description ||
                    `${subcategory.name}に関する統計データ`}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <ChevronRightIcon className="size-4" />
              </ItemActions>
            </a>
          </Item>
        ))}
      </div>
    </div>
  );
}
