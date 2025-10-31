import "server-only";

import { NextRequest, NextResponse } from "next/server";

import type { AreaType } from "@/features/area";
import { fetchMetaInfo } from "@/features/estat-api/meta-info/services/fetcher";
import { extractTableInfo } from "@/features/estat-api/meta-info/services/formatter";
import { saveMetaInfo } from "@/features/estat-api/meta-info/repositories/meta-info-repository";

/**
 * POST /api/estat-api/meta-info/save
 *
 * e-Statメタ情報を取得してデータベースに保存
 *
 * リクエストボディ:
 * {
 *   "statsDataId": "0000010101"
 * }
 *
 * レスポンス:
 * {
 *   "success": true,
 *   "message": "メタ情報を保存しました"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      statsDataId?: string;
    };

    const { statsDataId } = body;

    if (!statsDataId) {
      return NextResponse.json(
        { error: "統計表IDが必要です" },
        { status: 400 }
      );
    }

    // e-Stat APIからメタ情報を取得
    const metaInfoResponse = await fetchMetaInfo(statsDataId);

    // メタ情報から必要な情報を抽出
    const tableInfo = extractTableInfo(metaInfoResponse);

    // area_typeを推定（COLLECT_AREAから）
    const collectArea = tableInfo.collectArea || "";
    let areaType: AreaType = "national";
    if (collectArea.includes("都道府県") || collectArea.includes("県")) {
      areaType = "prefecture";
    } else if (
      collectArea.includes("市区町村") ||
      collectArea.includes("市") ||
      collectArea.includes("区") ||
      collectArea.includes("町") ||
      collectArea.includes("村")
    ) {
      areaType = "city";
    }

    // データベースに保存
    const success = await saveMetaInfo({
      stats_data_id: tableInfo.id || statsDataId,
      stat_name: tableInfo.statName || "",
      title: tableInfo.title || "",
      area_type: areaType,
      cycle: tableInfo.cycle || undefined,
      survey_date: String(tableInfo.surveyDate || "") || undefined,
      description: undefined,
    });

    if (!success) {
      return NextResponse.json(
        { error: "メタ情報の保存に失敗しました" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${statsDataId}のメタ情報を保存しました`,
    });
  } catch (error) {
    console.error("メタ情報保存エラー:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "メタ情報の保存に失敗しました",
      },
      { status: 500 }
    );
  }
}

