import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/d1-client";

interface VisualizationUpdateRequest {
  mapColorScheme?: string;
  mapDivergingMidpoint?: string;
  rankingDirection?: "asc" | "desc";
  conversionFactor?: number;
  decimalPlaces?: number;
}

/**
 * ランキング項目の可視化設定更新API
 * PATCH /api/ranking-items/[id]/visualization
 *
 * 指定されたランキング項目の可視化設定を更新する
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const itemId = parseInt(id);
    
    if (isNaN(itemId)) {
      return NextResponse.json(
        { error: "Invalid item ID" },
        { status: 400 }
      );
    }

    const body = await request.json() as VisualizationUpdateRequest;
    const db = await createD1Database();

    // 更新クエリを動的に構築
    const updates: string[] = [];
    const values: any[] = [];

    if (body.mapColorScheme !== undefined) {
      updates.push("map_color_scheme = ?");
      values.push(body.mapColorScheme);
    }
    if (body.mapDivergingMidpoint !== undefined) {
      updates.push("map_diverging_midpoint = ?");
      values.push(body.mapDivergingMidpoint);
    }
    if (body.rankingDirection !== undefined) {
      updates.push("ranking_direction = ?");
      values.push(body.rankingDirection);
    }
    if (body.conversionFactor !== undefined) {
      updates.push("conversion_factor = ?");
      values.push(body.conversionFactor);
    }
    if (body.decimalPlaces !== undefined) {
      updates.push("decimal_places = ?");
      values.push(body.decimalPlaces);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 }
      );
    }

    // updated_atも更新
    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(itemId);

    const query = `
      UPDATE ranking_items
      SET ${updates.join(", ")}
      WHERE id = ?
    `;

    const result = await db.prepare(query).bind(...values).run();

    if (!result.success) {
      return NextResponse.json(
        { error: "Failed to update visualization settings" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Visualization settings updated successfully",
      changes: result.meta?.changes || 0,
    });
  } catch (error) {
    console.error("Error updating visualization settings:", error);
    return NextResponse.json(
      { error: "Failed to update visualization settings" },
      { status: 500 }
    );
  }
}
