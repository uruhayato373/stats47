import React from 'react';
import { notFound } from 'next/navigation';
import { getSubcategoryById } from '@/lib/choropleth/categories';
import { EstatStatsDataService } from '@/lib/estat/statsdata';
import { transformEstatToFormattedValues, transformToChoroplethData, generateSampleData } from '@/lib/choropleth/data-transformer';
import { getSubcategoryComponent } from '@/components/subcategories';

interface PageProps {
  params: {
    category: string;
    subcategory: string;
  };
  searchParams: {
    year?: string;
  };
}

export default async function SubcategoryPage({ params, searchParams }: PageProps) {
  const { category: categoryId, subcategory: subcategoryId } = params;
  const year = searchParams.year || new Date().getFullYear().toString();

  // カテゴリとサブカテゴリの存在確認
  const subcategoryData = getSubcategoryById(subcategoryId);

  // カテゴリIDとサブカテゴリIDの整合性チェック
  if (!subcategoryData || subcategoryData.category.id !== categoryId) {
    notFound();
  }

  const { category, subcategory } = subcategoryData;

  // サーバーサイドでデータ取得
  let choroplethData = null;
  let formattedValues = null;
  let isSample = false;
  let error = null;

  // 環境変数でサンプルデータ使用を制御
  const useSampleData = process.env.FORCE_SAMPLE_DATA === 'true';

  if (useSampleData) {
    // サンプルデータを生成
    formattedValues = generateSampleData(subcategory, year);
    choroplethData = transformToChoroplethData(formattedValues, subcategory, year);
    error = '設定によりサンプルデータを使用';
  } else {
    try {
      // e-stat APIからデータを取得
      const estatData = await EstatStatsDataService.getStatsDataRaw(subcategory.statsDataId, {
        categoryFilter: subcategory.categoryCode,
        yearFilter: year,
        limit: 100000,
      });

      // データを変換
      formattedValues = transformEstatToFormattedValues(estatData, subcategory, year);

      if (formattedValues.length === 0) {
        // データが取得できない場合はサンプルデータを使用
        formattedValues = generateSampleData(subcategory, year);
        isSample = true;
        error = 'APIからデータを取得できないためサンプルデータを使用';
      } else {
        isSample = false;
      }

      choroplethData = transformToChoroplethData(formattedValues, subcategory, year);

    } catch (estatError) {
      console.error('e-stat API error:', estatError);

      // e-stat APIエラーの場合はサンプルデータを使用
      formattedValues = generateSampleData(subcategory, year);
      choroplethData = transformToChoroplethData(formattedValues, subcategory, year);
      isSample = true;
      error = 'e-stat APIエラーのためサンプルデータを使用';
    }
  }

  // サブカテゴリーIDに対応するコンポーネントを取得
  const SubcategoryComponent = getSubcategoryComponent(subcategoryId);

  return (
    <SubcategoryComponent
      category={category}
      subcategory={subcategory}
      choroplethData={choroplethData}
      formattedValues={formattedValues}
      currentYear={year}
      isSample={isSample}
      error={error}
    />
  );
}