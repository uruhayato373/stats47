// server-only パッケージのモック（テスト環境・Storybook環境用）
// このファイルはテスト環境とStorybook環境で server-only のインポートを空のモジュールとして扱います

// server-only のモック（空のモジュールとしてエクスポート）
// StorybookやVitestなどのクライアントサイド環境で使用される

// next/server のモック
export class NextRequest extends Request {
  constructor(input: RequestInfo | URL, init?: RequestInit) {
    super(input, init);
  }
}

export class NextResponse extends Response {
  static json(body: any, init?: ResponseInit) {
    return new Response(JSON.stringify(body), {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  }

  static redirect(url: string | URL, status?: number) {
    return new Response(null, {
      status: status || 307,
      headers: {
        Location: typeof url === "string" ? url : url.toString(),
      },
    });
  }
}

export {};

