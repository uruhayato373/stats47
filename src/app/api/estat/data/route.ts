import { NextRequest, NextResponse } from "next/server";
import { estatAPI } from "@/services/estat-api";
import { GetStatsDataParams } from "@/types/estat";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const statsDataId = searchParams.get('statsDataId');
    if (!statsDataId) {
      return NextResponse.json(
        { error: "statsDataId パラメータが必要です" },
        { status: 400 }
      );
    }

    // 全てのGetStatsDataParamsに対応
    const params: Partial<GetStatsDataParams> = {
      statsDataId
    };

    // 階層レベル関連パラメータ
    const lvParams = [
      'lvTab', 'lvCat01', 'lvCat02', 'lvCat03', 'lvCat04', 'lvCat05',
      'lvCat06', 'lvCat07', 'lvCat08', 'lvCat09', 'lvCat10', 'lvCat11',
      'lvCat12', 'lvCat13', 'lvCat14', 'lvCat15', 'lvArea', 'lvTime'
    ];

    // コード関連パラメータ
    const cdParams = [
      'cdTab', 'cdCat01', 'cdCat02', 'cdCat03', 'cdCat04', 'cdCat05',
      'cdCat06', 'cdCat07', 'cdCat08', 'cdCat09', 'cdCat10', 'cdCat11',
      'cdCat12', 'cdCat13', 'cdCat14', 'cdCat15', 'cdArea', 'cdTime'
    ];

    // 時間軸範囲指定
    const timeRangeParams = ['cdTimeFrom', 'cdTimeTo'];

    // 数値パラメータ
    const numericParams = ['startPosition', 'limit'];

    // フラグパラメータ
    const flagParams = [
      'lang', 'metaGetFlg', 'cntGetFlg', 'explanationGetFlg', 
      'annotationGetFlg', 'replaceSpChars', 'sectionHeaderFlg'
    ];

    // 全パラメータを処理
    [...lvParams, ...cdParams, ...timeRangeParams, ...flagParams].forEach(key => {
      const value = searchParams.get(key);
      if (value && value.trim()) {
        (params as any)[key] = value.trim();
      }
    });

    // 数値パラメータを処理
    numericParams.forEach(key => {
      const value = searchParams.get(key);
      if (value && value.trim()) {
        const numValue = parseInt(value.trim());
        if (!isNaN(numValue)) {
          (params as any)[key] = numValue;
        }
      }
    });

    console.log('API Request params:', params);

    // e-Stat APIから統計データを取得
    const data = await estatAPI.getStatsData(params as Omit<GetStatsDataParams, 'appId'>);
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("e-Stat API データ取得エラー:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `データ取得に失敗しました: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: "データ取得に失敗しました" },
      { status: 500 }
    );
  }
}