/// <reference types="@cloudflare/workers-types" />

import { EstatMetadataService } from "./lib/estat/metadata-service";

export interface Env {
  AUTH_DB: D1Database;
  ESTAT_DB: D1Database;
  // 環境変数の型定義
  NODE_ENV?: string;
  ESTAT_API_KEY?: string;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // e-Statメタ情報関連のAPI
    if (url.pathname.startsWith("/api/estat/metadata")) {
      return handleEstatMetadata(request, env);
    }

    // その他のリクエストは404
    return new Response("Not Found", { status: 404 });
  },
};

export default worker;

async function handleEstatMetadata(
  request: Request,
  env: Env
): Promise<Response> {
  const url = new URL(request.url);

  try {
    if (url.pathname === "/api/estat/metadata/stats") {
      return handleStats(request, env);
    } else if (url.pathname === "/api/estat/metadata/save") {
      return handleSave(request, env);
    } else if (url.pathname === "/api/estat/metadata/search") {
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
  const metadataService = new EstatMetadataService(env.ESTAT_DB);

  try {
    const [count, categories] = await Promise.all([
      metadataService.getSavedDataCount(),
      metadataService.getSavedStatList(),
    ]);

    return Response.json({
      success: true,
      data: {
        totalCount: count,
        statCount: categories.length,
        categories: categories,
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
    const { statsDataId, batchMode, startId, endId } = await request.json();
    const metadataService = new EstatMetadataService(env.ESTAT_DB);

    if (batchMode && startId && endId) {
      await metadataService.fetchAndSaveMetadataRange(startId, endId);
      return Response.json({
        success: true,
        message: `${startId}から${endId}までの統計表IDを処理しました`,
      });
    } else if (Array.isArray(statsDataId)) {
      await metadataService.fetchAndSaveMultipleMetadata(statsDataId);
      return Response.json({
        success: true,
        message: `${statsDataId.length}件の統計表IDを処理しました`,
      });
    } else if (statsDataId) {
      await metadataService.fetchAndSaveMetadata(statsDataId);
      return Response.json({
        success: true,
        message: `${statsDataId}のメタ情報を保存しました`,
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

  try {
    const metadataService = new EstatMetadataService(env.ESTAT_DB);
    let results;

    if (statsDataId) {
      results = await metadataService.getSavedMetadataByStatsId(statsDataId);
    } else if (category) {
      results = await metadataService.getSavedMetadataByCategory(category);
    } else if (query) {
      results = await metadataService.searchSavedMetadata(query);
    } else {
      results = await metadataService.getSavedStatList();
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
