import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statsDataId = searchParams.get("statsDataId");
    const cat01 = searchParams.get("cat01");

    if (!statsDataId || !cat01) {
      return NextResponse.json(
        { error: "statsDataId and cat01 parameters are required" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // 指定されたstatsDataIdとcat01の設定を取得
    const settings = await db
      .prepare(
        `
        SELECT
          id,
          stats_data_id,
          cat01,
          map_color_scheme,
          map_diverging_midpoint,
          ranking_direction,
          conversion_factor,
          decimal_places,
          created_at,
          updated_at
        FROM ranking_visualizations
        WHERE stats_data_id = ? AND cat01 = ?
      `
      )
      .bind(statsDataId, cat01)
      .first();

    if (!settings) {
      // デフォルト設定を返す
      return NextResponse.json({
        success: true,
        settings: {
          stats_data_id: statsDataId,
          cat01: cat01,
          map_color_scheme: "interpolateBlues",
          map_diverging_midpoint: "zero",
          ranking_direction: "desc",
          conversion_factor: 1,
          decimal_places: 0,
        },
        isDefault: true,
      });
    }

    return NextResponse.json({
      success: true,
      settings: settings,
      isDefault: false,
    });
  } catch (error) {
    console.error("Visualization settings fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch visualization settings",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      stats_data_id: string;
      cat01: string;
      map_color_scheme?: string;
      map_diverging_midpoint?: string;
      ranking_direction?: string;
      conversion_factor?: number;
      decimal_places?: number;
    };
    const {
      stats_data_id,
      cat01,
      map_color_scheme,
      map_diverging_midpoint,
      ranking_direction,
      conversion_factor,
      decimal_places,
    } = body;

    if (!stats_data_id || !cat01) {
      return NextResponse.json(
        { error: "stats_data_id and cat01 are required" },
        { status: 400 }
      );
    }

    const db = await createD1Database();

    // INSERT OR REPLACE で設定を保存/更新
    const result = await db
      .prepare(
        `
        INSERT OR REPLACE INTO ranking_visualizations (
          stats_data_id,
          cat01,
          map_color_scheme,
          map_diverging_midpoint,
          ranking_direction,
          conversion_factor,
          decimal_places,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `
      )
      .bind(
        stats_data_id,
        cat01,
        map_color_scheme || "interpolateBlues",
        map_diverging_midpoint || "zero",
        ranking_direction || "desc",
        conversion_factor || 1,
        decimal_places || 0
      )
      .run();

    return NextResponse.json({
      success: true,
      message: "Visualization settings saved successfully",
    });
  } catch (error) {
    console.error("Visualization settings save error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to save visualization settings",
      },
      { status: 500 }
    );
  }
}
