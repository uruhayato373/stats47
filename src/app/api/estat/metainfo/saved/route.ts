import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";

    console.log("=== SAVED METADATA API (LEGACY) ===");
    console.log(
      "Note: Consider using /api/estat/metainfo/stats-list for better performance"
    );

    // 新しい効率的なAPIエンドポイントにリダイレクト
    const newApiUrl = new URL("/api/estat/metainfo/stats-list", request.url);
    newApiUrl.searchParams.set("page", page.toString());
    newApiUrl.searchParams.set("limit", limit.toString());
    if (search) {
      newApiUrl.searchParams.set("search", search);
    }

    console.log("Redirecting to:", newApiUrl.pathname + newApiUrl.search);

    // 内部的に新しいAPIを呼び出し
    const response = await fetch(newApiUrl.toString());
    const data = (await response.json()) as Record<string, unknown>;

    // レスポンス形式を既存のクライアントに合わせて調整
    return NextResponse.json({
      ...data,
      meta: {
        ...(typeof data.meta === "object" && data.meta !== null
          ? (data.meta as Record<string, unknown>)
          : {}),
        legacyEndpoint: true,
        redirectedFrom: "/api/estat/metainfo/saved",
      },
    });
  } catch (error) {
    console.error("Saved metadata fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "保存済みデータの取得に失敗しました",
        items: [],
        pagination: {
          currentPage: 1,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: 10,
        },
      },
      { status: 500 }
    );
  }
}
