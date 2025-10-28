/**
 * ダッシュボード設定取得API
 * GET /api/dashboard/[subcategoryId]/[areaType]
 */

import { MockDashboardRepository } from "@/features/dashboard/repositories/dashboard-repository.mock";
import { DashboardService } from "@/features/dashboard/services/dashboard-service";
import { NextRequest, NextResponse } from "next/server";

const repository = new MockDashboardRepository();
const service = new DashboardService(repository);

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ subcategoryId: string; areaType: string }>;
  }
) {
  try {
    const { subcategoryId, areaType } = await params;

    // バリデーション
    if (
      areaType !== "national" &&
      areaType !== "prefecture" &&
      areaType !== "city"
    ) {
      return NextResponse.json({ error: "Invalid area type" }, { status: 400 });
    }

    // ダッシュボード設定を取得
    const dashboard = await service.resolveDashboard(
      subcategoryId,
      areaType as "national" | "prefecture"
    );

    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(dashboard, {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[Dashboard API] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
