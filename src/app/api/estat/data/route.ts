/**
 * e-Statデータ取得APIエンドポイント
 *
 * Next.js API Route → estatAPI.getStatsData → e-Stat API
 *
 * 処理フロー:
 * 1. URLからクエリパラメータを抽出
 * 2. 必須パラメータ（statsDataId）のバリデーション
 * 3. オプションパラメータの処理（階層レベル、コード、フラグ等）
 * 4. e-Stat APIクライアントを呼び出し
 * 5. レスポンスをJSON形式で返却
 *
 * パラメータ変換:
 * - categoryCode → cdCat01 (e-Stat APIのパラメータ名)
 * - その他のパラメータもe-Stat API形式に変換
 */

import { NextRequest, NextResponse } from "next/server";
import { estatAPI } from "@/services/estat-api";
import { GetStatsDataParams } from "@/types/models/estat";

export async function GET(request: NextRequest) {
  try {
    // 1. URLからクエリパラメータを抽出
    const { searchParams } = new URL(request.url);

    // 2. 必須パラメータ（statsDataId）のバリデーション
    const statsDataId = searchParams.get("statsDataId");
    if (!statsDataId) {
      return NextResponse.json(
        { error: "statsDataId パラメータが必要です" },
        { status: 400 }
      );
    }

    // 3. オプションパラメータの処理（階層レベル、コード、フラグ等）
    // 全てのGetStatsDataParamsに対応
    const params: Partial<GetStatsDataParams> = {
      statsDataId,
    };

    // 階層レベル関連パラメータ - e-Stat APIの階層指定
    const lvParams = [
      "lvTab",
      "lvCat01",
      "lvCat02",
      "lvCat03",
      "lvCat04",
      "lvCat05",
      "lvCat06",
      "lvCat07",
      "lvCat08",
      "lvCat09",
      "lvCat10",
      "lvCat11",
      "lvCat12",
      "lvCat13",
      "lvCat14",
      "lvCat15",
      "lvArea",
      "lvTime",
    ];

    // コード関連パラメータ - e-Stat APIのコード指定
    const cdParams = [
      "cdTab",
      "cdCat01",
      "cdCat02",
      "cdCat03",
      "cdCat04",
      "cdCat05",
      "cdCat06",
      "cdCat07",
      "cdCat08",
      "cdCat09",
      "cdCat10",
      "cdCat11",
      "cdCat12",
      "cdCat13",
      "cdCat14",
      "cdCat15",
      "cdArea",
      "cdTime",
    ];

    // 時間軸範囲指定パラメータ
    const timeRangeParams = ["cdTimeFrom", "cdTimeTo"];

    // 数値パラメータ - ページネーション用
    const numericParams = ["startPosition", "limit"];

    // フラグパラメータ - API動作制御用
    const flagParams = [
      "lang",
      "metaGetFlg",
      "cntGetFlg",
      "explanationGetFlg",
      "annotationGetFlg",
      "replaceSpChars",
      "sectionHeaderFlg",
    ];

    // 全パラメータを処理 - 文字列パラメータ
    [...lvParams, ...cdParams, ...timeRangeParams, ...flagParams].forEach(
      (key) => {
        const value = searchParams.get(key);
        if (value && value.trim()) {
          (params as Record<string, string>)[key] = value.trim();
        }
      }
    );

    // 数値パラメータを処理 - ページネーション用
    numericParams.forEach((key) => {
      const value = searchParams.get(key);
      if (value && value.trim()) {
        const numValue = parseInt(value.trim());
        if (!isNaN(numValue)) {
          (params as Record<string, number>)[key] = numValue;
        }
      }
    });

    // 4. e-Stat APIクライアントを呼び出し
    const data = await estatAPI.getStatsData(
      params as Omit<GetStatsDataParams, "appId">
    );

    // 5. レスポンスをJSON形式で返却
    return NextResponse.json(data);
  } catch (error) {
    // エラーハンドリング - ログ出力とエラーレスポンス
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
