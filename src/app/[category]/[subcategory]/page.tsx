import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
import { validateSubcategoryOrThrow } from "@/lib/taxonomy/category";
import { ChevronRightIcon, MapIcon, TrendingUpIcon } from "lucide-react";
import { Metadata } from "next";

interface PageProps {
  params: Promise<{ category: string; subcategory: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { category, subcategory } = await params;
  const subcategoryData = validateSubcategoryOrThrow(category, subcategory);

  return {
    title: subcategoryData.subcategory.name,
    description:
      subcategoryData.subcategory.description ||
      `${subcategoryData.subcategory.name}に関する統計データ`,
  };
}

export default async function SubcategoryPage({ params }: PageProps) {
  const { category, subcategory } = await params;
  const subcategoryData = validateSubcategoryOrThrow(category, subcategory);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-2">
        {subcategoryData.subcategory.name}
      </h1>
      <p className="text-muted-foreground mb-6">
        {subcategoryData.subcategory.description ||
          `${subcategoryData.subcategory.name}に関する統計データ`}
      </p>

      <div className="grid gap-4 max-w-2xl">
        <Item variant="outline" asChild>
          <a href={`/${category}/${subcategory}/ranking`}>
            <ItemMedia variant="icon">
              <TrendingUpIcon className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>ランキング</ItemTitle>
              <ItemDescription>都道府県別のランキングを表示</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4" />
            </ItemActions>
          </a>
        </Item>

        <Item variant="outline" asChild>
          <a href={`/${category}/${subcategory}/area`}>
            <ItemMedia variant="icon">
              <MapIcon className="size-5" />
            </ItemMedia>
            <ItemContent>
              <ItemTitle>地域別ダッシュボード</ItemTitle>
              <ItemDescription>
                全国および各都道府県の詳細データを表示
              </ItemDescription>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4" />
            </ItemActions>
          </a>
        </Item>
      </div>
    </div>
  );
}
