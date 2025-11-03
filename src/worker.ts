/// <reference types="@cloudflare/workers-types" />

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
    if (url.pathname.startsWith("/api/estat-api/meta-info")) {
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
    if (url.pathname === "/api/estat-api/meta-info/save") {
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
    // TODO: EstatMetaInfoRepository と EstatMetaInfoCacheService の実装が必要
    // 現在はこれらのクラスが存在しないため、実装を保留
    return Response.json(
      { error: "この機能は現在実装されていません" },
      { status: 501 }
    );
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
