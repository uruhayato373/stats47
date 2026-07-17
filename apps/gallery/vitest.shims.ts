// テスト環境用の shim。
// - `server-only` を空モジュールにする (import "server-only" が本番ビルド以外で throw するのを回避)。
// - `next/server` の NextResponse / NextRequest を素の Web 標準クラスで代替する
//   (Route Handler を dev server 無しで直接 import してテストするため)。

export class NextRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
  }
  // route が req.nextUrl.searchParams を使う (GET /api/posts など) ため互換 getter を足す。
  get nextUrl(): URL {
    return new URL(this.url);
  }
}

export class NextResponse extends Response {
  static json(body: unknown, init?: ResponseInit): Response {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers as Record<string, string> | undefined),
      },
    });
  }

  static redirect(url: string | URL, status?: number): Response {
    return new Response(null, {
      status: status ?? 307,
      headers: { Location: typeof url === "string" ? url : url.toString() },
    });
  }
}

export {};
