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
    if (url.pathname === "/api/estat/metainfo/save") {
      return handleSave(request, env);
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

}

