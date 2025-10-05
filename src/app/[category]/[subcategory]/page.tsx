import React from 'react';
import { notFound } from 'next/navigation';
import { getSubcategoryById } from '@/lib/choropleth/categories';
import { getSubcategoryComponent } from '@/components/subcategories';

interface PageProps {
  params: Promise<{
    category: string;
    subcategory: string;
  }>;
  searchParams: Promise<{
    year?: string;
  }>;
}

export default async function SubcategoryPage({ params, searchParams }: PageProps) {
  const { category: categoryId, subcategory: subcategoryId } = await params;
  const { year } = await searchParams;
  const currentYear = year || new Date().getFullYear().toString();

  // カテゴリとサブカテゴリの存在確認
  const subcategoryData = getSubcategoryById(subcategoryId);

  // カテゴリIDとサブカテゴリIDの整合性チェック
  if (!subcategoryData || subcategoryData.category.id !== categoryId) {
    notFound();
  }

  const { category, subcategory } = subcategoryData;

  // サブカテゴリーIDに対応するコンポーネントを取得
  const SubcategoryComponent = getSubcategoryComponent(subcategoryId, categoryId);

  return (
    <SubcategoryComponent
      category={category}
      subcategory={subcategory}
      currentYear={currentYear}
    />
  );
}