import { NextRequest, NextResponse } from 'next/server';
import { getSubcategoryById } from '@/lib/choropleth/categories';
import { EstatStatsDataService } from '@/lib/estat/statsdata';
import { transformEstatToFormattedValues, transformToChoroplethData, generateSampleData } from '@/lib/choropleth/data-transformer';

/**
 * GET /api/choropleth/data?subcategoryId={id}&year={year}
 * 指定されたサブカテゴリと年度のコロプレス地図用データを取得
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategoryId = searchParams.get('subcategoryId');
    const year = searchParams.get('year');
    const useSample = searchParams.get('sample') === 'true';

    if (!subcategoryId) {
      return NextResponse.json(
        {
          success: false,
          error: 'サブカテゴリIDが指定されていません',
        },
        { status: 400 }
      );
    }

    if (!year) {
      return NextResponse.json(
        {
          success: false,
          error: '年度が指定されていません',
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

    // サンプルデータを使用する場合
    if (useSample) {
      const sampleFormattedValues = generateSampleData(subcategory, year);
      const choroplethData = transformToChoroplethData(sampleFormattedValues, subcategory, year);

      return NextResponse.json({
        success: true,
        data: choroplethData,
        formattedValues: sampleFormattedValues,
        isSample: true,
        timestamp: new Date().toISOString(),
      });
    }

    // 実際のe-stat APIからデータを取得
    try {
      const estatData = await EstatStatsDataService.getStatsDataRaw(subcategory.statsDataId, {
        yearFilter: year,
        limit: 100000,
      });

      // データを変換
      const formattedValues = transformEstatToFormattedValues(estatData, subcategory, year);

      if (formattedValues.length === 0) {
        // データが取得できない場合はサンプルデータを返す
        const sampleFormattedValues = generateSampleData(subcategory, year);
        const choroplethData = transformToChoroplethData(sampleFormattedValues, subcategory, year);

        return NextResponse.json({
          success: true,
          data: choroplethData,
          formattedValues: sampleFormattedValues,
          isSample: true,
          fallbackReason: 'e-stat APIからデータを取得できませんでした',
          timestamp: new Date().toISOString(),
        });
      }

      const choroplethData = transformToChoroplethData(formattedValues, subcategory, year);

      return NextResponse.json({
        success: true,
        data: choroplethData,
        formattedValues,
        isSample: false,
        timestamp: new Date().toISOString(),
      });

    } catch (estatError) {
      console.error('e-stat API error:', estatError);

      // e-stat APIエラーの場合はサンプルデータを返す
      const sampleFormattedValues = generateSampleData(subcategory, year);
      const choroplethData = transformToChoroplethData(sampleFormattedValues, subcategory, year);

      return NextResponse.json({
        success: true,
        data: choroplethData,
        formattedValues: sampleFormattedValues,
        isSample: true,
        fallbackReason: 'e-stat APIエラーのためサンプルデータを使用',
        timestamp: new Date().toISOString(),
      });
    }

  } catch (error) {
    console.error('Error fetching choropleth data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'データの取得に失敗しました',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}