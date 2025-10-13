import { NextRequest, NextResponse } from "next/server";
import { createD1Database } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search") || "";

    const db = await createD1Database();
    const offset = (page - 1) * limit;

    // 効率的なクエリ：DISTINCT stats_data_idのみを取得し、必要な基本情報をGROUP BYで集約
    let query = `
      SELECT
        stats_data_id,
        stat_name,
        title,
        MIN(created_at) as created_at,
        MAX(updated_at) as updated_at,
        COUNT(*) as item_count
      FROM estat_metainfo
      WHERE stats_data_id IS NOT NULL
      AND stats_data_id != ''
    `;

    let countQuery = `
      SELECT COUNT(DISTINCT stats_data_id) as total
      FROM estat_metainfo
      WHERE stats_data_id IS NOT NULL
      AND stats_data_id != ''
    `;

    const params = [];

    // 検索条件の追加
    if (search) {
      const searchCondition = `
        AND (
          stats_data_id LIKE ?
          OR stat_name LIKE ?
          OR title LIKE ?
        )
      `;
      query += searchCondition;
      countQuery += searchCondition;

      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    // GROUP BY と ORDER BY を追加
    query += `
      GROUP BY stats_data_id, stat_name, title
      ORDER BY stats_data_id ASC
      LIMIT ? OFFSET ?
    `;

    params.push(limit.toString(), offset.toString());

    // データ取得
    const stmt = db.prepare(query);
    const result = await stmt.bind(...params).all();

    // 総数取得
    let totalCount = 0;
    if (search) {
      const countStmt = db.prepare(countQuery);
      const searchParam = `%${search}%`;
      const countResult = await countStmt
        .bind(searchParam, searchParam, searchParam)
        .all();
      const countData = countResult.results?.[0] as
        | { total: number }
        | undefined;
      totalCount = countData?.total || 0;
    } else {
      const countStmt = db.prepare(countQuery);
      const countResult = await countStmt.bind().all();
      const countData = countResult.results?.[0] as
        | { total: number }
        | undefined;
      totalCount = countData?.total || 0;
    }

    // レスポンス用のデータ形式に変換
    const items = (
      (result.results || []) as Array<{
        stats_data_id: string;
        stat_name: string;
        title: string;
        created_at: string;
        updated_at: string;
        item_count: number;
      }>
    ).map((row) => ({
      id: row.stats_data_id, // idとして統計表IDを使用
      stats_data_id: row.stats_data_id,
      stat_name: row.stat_name,
      title: row.title,
      cat01: null, // 効率化のため省略
      item_name: null, // 効率化のため省略
      unit: null, // 効率化のため省略
      created_at: row.created_at,
      updated_at: row.updated_at,
      item_count: row.item_count, // 追加情報：その統計表に含まれる項目数
    }));

    const response = {
      items,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalItems: totalCount,
        itemsPerPage: limit,
      },
      meta: {
        executedAt: new Date().toISOString(),
        searchQuery: search,
        queryOptimized: true, // 最適化されたクエリを使用していることを示す
      },
    };

    return NextResponse.json(response);
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
          itemsPerPage: parseInt(
            request.nextUrl.searchParams.get("limit") || "50"
          ),
        },
      },
      { status: 500 }
    );
  }
}
