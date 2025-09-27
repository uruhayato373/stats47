import { NextRequest, NextResponse } from 'next/server';
import { getSortedCategories } from '@/lib/choropleth/categories';

/**
 * GET /api/choropleth/categories
 * コロプレス地図用のカテゴリ・サブカテゴリ一覧を取得
 */
export async function GET(request: NextRequest) {
  try {
    const categories = getSortedCategories();

    return NextResponse.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching choropleth categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'カテゴリの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}