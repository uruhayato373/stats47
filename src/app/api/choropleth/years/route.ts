import { NextRequest, NextResponse } from 'next/server';
import { getSubcategoryById } from '@/lib/choropleth/categories';

/**
 * GET /api/choropleth/years?subcategoryId={id}
 * 指定されたサブカテゴリで利用可能な年度一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategoryId = searchParams.get('subcategoryId');

    if (!subcategoryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'サブカテゴリIDが指定されていません',
        },
        { status: 400 }
      );
    }

    // サブカテゴリ情報を取得
    const subcategoryData = getSubcategoryById(subcategoryId);
    if (!subcategoryData) {
      return NextResponse.json(
        {
          success: false,
          error: '指定されたサブカテゴリが見つかりません',
        },
        { status: 404 }
      );
    }

    const { subcategory } = subcategoryData;

    // 利用可能年度を生成（実際の実装では e-stat API から取得）
    const currentYear = new Date().getFullYear();
    const availableYears = Array.from({ length: 5 }, (_, i) => String(currentYear - i));
    const defaultYear = availableYears[0];

    return NextResponse.json({
      success: true,
      data: {
        subcategoryId: subcategory.id,
        subcategoryName: subcategory.name,
        availableYears,
        defaultYear,
        lastUpdated: subcategory.lastUpdated || new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error fetching available years:', error);
    return NextResponse.json(
      {
        success: false,
        error: '年度一覧の取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}