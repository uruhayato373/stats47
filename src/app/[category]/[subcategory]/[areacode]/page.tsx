import React from 'react';
import { notFound } from 'next/navigation';
import { getSubcategoryById } from '@/lib/choropleth/categories';
import { getAreaPageComponent } from '@/components/subcategories';

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
    areacode: string;
  }>;
  searchParams: Promise<{
    year?: string;
  }>;
}

export default async function AreaPage({ params, searchParams }: PageProps) {
  const { category: categoryId, subcategory: subcategoryId, areacode: areaCode } = await params;
  const { year } = await searchParams;
  const currentYear = year || new Date().getFullYear().toString();

  // カテゴリとサブカテゴリの存在確認
  const subcategoryData = getSubcategoryById(subcategoryId);

  // カテゴリIDとサブカテゴリIDの整合性チェック
  if (!subcategoryData || subcategoryData.category.id !== categoryId) {
    notFound();
  }

  const { category, subcategory } = subcategoryData;

  // 都道府県別ページコンポーネントを取得
  const AreaPageComponent = getAreaPageComponent(subcategoryId);

  return (
    <AreaPageComponent
      category={category}
      subcategory={subcategory}
      currentYear={currentYear}
      areaCode={areaCode}
    />
  );
}
