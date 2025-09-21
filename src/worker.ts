/// <reference types="@cloudflare/workers-types" />

import { EstatMetaInfoService } from "./lib/estat/metainfo";

export interface Env {
  AUTH_DB: D1Database;
  STATS47_DB: D1Database;
  // 環境変数の型定義
  NODE_ENV?: string;
  ESTAT_API_KEY?: string;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // e-Statメタ情報関連のAPI
    if (url.pathname.startsWith("/api/estat/metainfo")) {
      return handleEstatMetainfo(request, env);
    }

    // その他のリクエストは404
    return new Response("Not Found", { status: 404 });
  },
};

export default worker;

async function handleEstatMetainfo(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);

  try {
    if (url.pathname === "/api/estat/metainfo/stats") {
      return handleStats(request, env);
    } else if (url.pathname === "/api/estat/metainfo/save") {
      return handleSave(request, env);
    } else if (url.pathname === "/api/estat/metainfo/search") {
      return handleSearch(request, env);
    }

    return new Response("Not Found", { status: 404 });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function handleStats(request: Request, env: Env): Promise<Response> {
  const metaInfoService = new EstatMetaInfoService(env.STATS47_DB);

  try {
    const [summary, statsList] = await Promise.all([
      metaInfoService.getMetaInfoSummary(),
      metaInfoService.getStatsList({ limit: 100 }),
    ]);

    return Response.json({
      success: true,
      data: {
        totalCount: summary.totalEntries,
        statCount: summary.uniqueStats,
        categories: summary.categories,
        statsList: statsList,
      },
    });
  } catch (error) {
    console.error("統計情報取得エラー:", error);
    return Response.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "統計情報の取得に失敗しました",
      },
      { status: 500 }
    );
  }
}

async function handleSave(request: Request, env: Env): Promise<Response> {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  try {
    const { statsDataId, batchMode, startId, endId } =
      (await request.json()) as {
        statsDataId?: string | string[];
        batchMode?: boolean;
        startId?: string;
        endId?: string;
      };
    const metaInfoService = new EstatMetaInfoService(env.STATS47_DB);

    if (batchMode && startId && endId) {
      const result = await metaInfoService.processMetaInfoRange(startId, endId);
      return Response.json({
        success: true,
        message: `${startId}から${endId}までの統計表IDを処理しました`,
        details: result,
      });
    } else if (Array.isArray(statsDataId)) {
      const result = await metaInfoService.processBulkMetaInfo(statsDataId);
      return Response.json({
        success: true,
        message: `${statsDataId.length}件の統計表IDを処理しました`,
        details: result,
      });
    } else if (statsDataId) {
      const result = await metaInfoService.processAndSaveMetaInfo(statsDataId);
      return Response.json({
        success: result.success,
        message: result.success
          ? `${statsDataId}のメタ情報を保存しました`
          : `${statsDataId}のメタ情報保存に失敗しました`,
        details: result,
      });
    } else {
      return Response.json({ error: "統計表IDが必要です" }, { status: 400 });
    }
  } catch (error) {
    console.error("メタ情報保存エラー:", error);
    return Response.json(
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

async function handleSearch(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const query = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";
  const statsDataId = url.searchParams.get("statsDataId") || "";
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  const limit = limitParam ? parseInt(limitParam) : 100;
  const offset = offsetParam ? parseInt(offsetParam) : 0;

  try {
    const metaInfoService = new EstatMetaInfoService(env.STATS47_DB);
    let results;

    if (statsDataId) {
      results = await metaInfoService.searchMetaInfo(statsDataId, {
        searchType: "stats_id",
        limit,
        offset,
      });
    } else if (category) {
      results = await metaInfoService.searchMetaInfo(category, {
        searchType: "category",
        limit,
        offset,
      });
    } else if (query) {
      results = await metaInfoService.searchMetaInfo(query, {
        searchType: "full",
        limit,
        offset,
      });
    } else {
      const statsList = await metaInfoService.getStatsList({ limit, offset });
      results = {
        entries: statsList,
        totalCount: statsList.length,
        searchQuery: "",
        executedAt: new Date().toISOString(),
      };
    }

    return Response.json({ success: true, data: results });
  } catch (error) {
    console.error("検索エラー:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "検索に失敗しました" },
      { status: 500 }
    );
  }
}
