/**
 * Cloudflare D1 API レスポンス型定義
 */
interface D1ApiResponse {
  success: boolean;
  result?: Array<{
    results?: Record<string, unknown>[];
    meta?: {
      duration: number;
    };
  }>;
  errors?: Array<{
    message: string;
  }>;
}

/**
 * Cloudflare D1データベースクライアントを作成する
 * @throws {Error} 環境変数が不足している場合やAPI接続に失敗した場合
 */
export const createD1Database = async () => {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  const databaseId = process.env.CLOUDFLARE_D1_DATABASE_ID;

  // 環境変数のバリデーション
  const missingVars = [];
  if (!accountId) missingVars.push("CLOUDFLARE_ACCOUNT_ID");
  if (!apiToken) missingVars.push("CLOUDFLARE_API_TOKEN");
  if (!databaseId) missingVars.push("CLOUDFLARE_D1_DATABASE_ID");

  if (missingVars.length > 0) {
    throw new Error(
      `Cloudflare D1の設定が不完全です。不足している環境変数: ${missingVars.join(
        ", "
      )}`
    );
  }

  // 接続テスト
  try {
    const testResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!testResponse.ok) {
      throw new Error(
        `Cloudflare D1への接続テストに失敗しました: ${testResponse.status}`
      );
    }
  } catch (error) {
    throw new Error(
      `Cloudflare D1への接続に失敗しました: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }

  // リトライ用のユーティリティ関数
  const executeWithRetry = async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    const maxRetries = 3;
    const baseDelay = 1000; // 1秒
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // 最後の試行でない場合は待機してリトライ
        if (attempt < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, attempt); // 指数バックオフ
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
      }
    }

    // 全てのリトライが失敗した場合
    if (lastError) {
      throw lastError;
    }

    // この行に到達することはないが、TypeScriptの型チェックのため
    throw new Error("Unexpected error: all retries failed without error");
  };

  // Cloudflare D1 REST APIを使用してデータベースに接続
  return {
    // batch, exec, withSession, dump are not fully implemented yet
    // These are stub implementations to satisfy the D1Database type
    batch: async () => {
      throw new Error("batch() is not implemented for REST API client");
    },
    exec: async () => {
      throw new Error("exec() is not implemented for REST API client");
    },
    withSession: () => {
      throw new Error("withSession() is not implemented for REST API client");
    },
    dump: async () => {
      throw new Error("dump() is not implemented for REST API client");
    },
    prepare: (sql: string) => {
      const createQueryExecutor = (params: any[] = []) => ({
        raw: async () => {
          throw new Error("raw() is not implemented for REST API client");
        },
        run: async () => {
          console.log("🔵 D1 Client: run() メソッド呼び出し");
          console.log("🔵 D1 Client: SQL:", sql.substring(0, 100) + "...");
          console.log("🔵 D1 Client: Params length:", params.length);

          return executeWithRetry(async () => {
            const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
            console.log("🔵 D1 Client: API URL:", apiUrl);

            const requestBody = { sql, params };
            console.log(
              "🔵 D1 Client: Request body size:",
              JSON.stringify(requestBody).length
            );

            const response = await fetch(apiUrl, {
              method: "POST",
              headers: {
                Authorization: `Bearer ${apiToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(requestBody),
            });

            console.log("🔵 D1 Client: Response status:", response.status);

            if (!response.ok) {
              const errorText = await response.text();
              console.error("❌ D1 Client: API Error:", errorText);
              throw new Error(
                `D1 API Error: ${response.status} - ${errorText}`
              );
            }

            const result = (await response.json()) as D1ApiResponse;
            console.log("🔵 D1 Client: API Response:", {
              success: result.success,
              resultCount: result.result?.length,
              errors: result.errors,
            });

            if (!result.success) {
              console.error("❌ D1 Client: Query failed:", result.errors);
              throw new Error(
                `D1 Query failed: ${
                  result.errors?.[0]?.message || "Unknown error"
                }`
              );
            }

            console.log("✅ D1 Client: Query successful");
            return {
              success: true,
              meta: { duration: result.result?.[0]?.meta?.duration || 1 },
            };
          });
        },
        all: async () => {
          return executeWithRetry(async () => {
            const response = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ sql, params }),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `D1 API Error: ${response.status} - ${errorText}`
              );
            }

            const result = (await response.json()) as D1ApiResponse;
            if (!result.success) {
              throw new Error(
                `D1 Query failed: ${
                  result.errors?.[0]?.message || "Unknown error"
                }`
              );
            }

            return {
              success: true,
              results: result.result?.[0]?.results || [],
              meta: { duration: result.result?.[0]?.meta?.duration || 1 },
            };
          });
        },
        first: async () => {
          return executeWithRetry(async () => {
            const response = await fetch(
              `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${apiToken}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ sql, params }),
              }
            );

            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(
                `D1 API Error: ${response.status} - ${errorText}`
              );
            }

            const result = (await response.json()) as D1ApiResponse;
            if (!result.success) {
              throw new Error(
                `D1 Query failed: ${
                  result.errors?.[0]?.message || "Unknown error"
                }`
              );
            }

            return result.result?.[0]?.results?.[0] || null;
          });
        },
      });

      return {
        // Support parameterized queries: db.prepare(sql).bind(params).all()
        bind: (...params: unknown[]) => createQueryExecutor(params),
        // Support parameter-less queries: db.prepare(sql).all()
        ...createQueryExecutor([]),
      };
    },
  };
};
