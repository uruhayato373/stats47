import React from 'react';
import { notFound } from 'next/navigation';
import { CategoryPageClient } from '@/components/choropleth/CategoryPageClient';
import categoriesData from '@/config/categories.json';

interface PageProps {
  params: Promise<{
    category: string;
  }>;
}

export default async function CategoryPage({ params }: PageProps) {
  const { category: categoryId } = await params;

  // カテゴリの存在確認
  const category = categoriesData.find((cat) => cat.id === categoryId);

  if (!category) {
    notFound();
  }

  return <CategoryPageClient category={category} />;
}